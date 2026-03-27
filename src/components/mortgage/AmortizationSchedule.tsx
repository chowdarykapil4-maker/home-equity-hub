import { useState, useMemo, useRef, useEffect } from 'react';
import { AmortizationRow, AmortizationSummary } from '@/lib/amortization';
import { formatCurrency } from '@/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

const ROWS_PER_PAGE = 36; // 3 years per page

interface Props {
  rows: AmortizationRow[];
  summary: AmortizationSummary;
}

export default function AmortizationSchedule({ rows, summary }: Props) {
  // Extract unique years for jump dropdown
  const years = useMemo(() => {
    const ySet = new Set<string>();
    rows.forEach(r => ySet.add(r.date.substring(0, 4)));
    return Array.from(ySet).sort();
  }, [rows]);

  // Find the current month row index
  const currentIdx = useMemo(() => rows.findIndex(r => r.isCurrentMonth), [rows]);

  // Page state - start at the page containing current month
  const initialPage = currentIdx >= 0 ? Math.floor(currentIdx / ROWS_PER_PAGE) : 0;
  const [page, setPage] = useState(initialPage);
  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
  const pageRows = rows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const currentRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (currentRowRef.current) {
      currentRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [page]);

  const jumpToYear = (year: string) => {
    const idx = rows.findIndex(r => r.date.startsWith(year));
    if (idx >= 0) setPage(Math.floor(idx / ROWS_PER_PAGE));
  };

  const formatYM = (ym: string) => {
    const [y, m] = ym.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m) - 1]} ${y}`;
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Jump to:</span>
          <Select onValueChange={jumpToYear}>
            <SelectTrigger className="h-8 w-28 text-sm">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary/10 border border-primary/30" /> Current month
          <span className="ml-2 inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(142, 71%, 45%, 0.15)' }} /> Principal
          <span className="ml-2 inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(0, 84%, 60%, 0.15)' }} /> Interest
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Payment</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Cum. Principal</TableHead>
              <TableHead className="text-right">Cum. Interest</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map(row => (
              <TableRow
                key={row.paymentNumber}
                ref={row.isCurrentMonth ? currentRowRef : undefined}
                className={
                  row.isCurrentMonth
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : !row.isPast && !row.isCurrentMonth
                    ? 'text-muted-foreground'
                    : ''
                }
              >
                <TableCell className="text-center text-xs">{row.paymentNumber}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  <div className="flex items-center gap-1.5">
                    {formatYM(row.date)}
                    {row.isCurrentMonth && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary text-primary">
                        <MapPin className="h-2.5 w-2.5 mr-0.5" />You are here
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm">{formatCurrency(row.monthlyPayment)}</TableCell>
                <TableCell className="text-right text-sm font-medium" style={{ color: 'hsl(142, 71%, 45%)' }}>
                  {formatCurrency(row.principalPortion)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium" style={{ color: 'hsl(0, 84%, 60%)' }}>
                  {formatCurrency(row.interestPortion)}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{formatCurrency(row.cumulativePrincipal)}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{formatCurrency(row.cumulativeInterest)}</TableCell>
                <TableCell className="text-right text-sm font-medium">{formatCurrency(row.remainingBalance)}</TableCell>
              </TableRow>
            ))}
            {/* Summary row on last page */}
            {page === totalPages - 1 && (
              <TableRow className="bg-muted/50 font-semibold border-t-2">
                <TableCell colSpan={2} className="text-sm">Total ({summary.totalPayments} payments)</TableCell>
                <TableCell className="text-right text-sm">{formatCurrency(summary.totalAmount)}</TableCell>
                <TableCell className="text-right text-sm" style={{ color: 'hsl(142, 71%, 45%)' }}>{formatCurrency(summary.totalPrincipal)}</TableCell>
                <TableCell className="text-right text-sm" style={{ color: 'hsl(0, 84%, 60%)' }}>{formatCurrency(summary.totalInterest)}</TableCell>
                <TableCell colSpan={3} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Previous
          </button>
          <span className="text-muted-foreground">
            Page {page + 1} of {totalPages} · Payments {page * ROWS_PER_PAGE + 1}–{Math.min((page + 1) * ROWS_PER_PAGE, rows.length)} of {rows.length}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
