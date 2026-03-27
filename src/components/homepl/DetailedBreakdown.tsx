import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FlowRow {
  label: string;
  value: number;
  type: 'equity' | 'sunk';
}

export default function DetailedBreakdown({ d }: { d: HomePLData }) {
  const [open, setOpen] = useState(false);

  const cashFlows: FlowRow[] = ([
    { label: 'Down payment', value: d.downPayment, type: 'equity' as const },
    { label: 'Interest to bank', value: d.interestPaid, type: 'sunk' as const },
    { label: 'Renovation spend', value: d.totalRenoSpend, type: 'sunk' as const },
    { label: 'Property tax', value: d.totalPropertyTax, type: 'sunk' as const },
    { label: 'Principal paid', value: d.principalPaid, type: 'equity' as const },
    { label: 'Insurance', value: d.totalInsurance, type: 'sunk' as const },
    { label: 'Maintenance', value: d.totalMaintenance, type: 'sunk' as const },
    ...(d.totalHOA > 0 ? [{ label: 'HOA', value: d.totalHOA, type: 'sunk' as const }] : []),
  ] satisfies FlowRow[]).sort((a, b) => b.value - a.value);

  const maxFlow = Math.max(...cashFlows.map(f => f.value));

  const sunkItems = [
    { label: 'Interest', value: d.interestPaid },
    { label: 'Property tax', value: d.totalPropertyTax },
    { label: 'Net reno cost', value: d.netRenoCost },
    { label: 'Insurance', value: d.totalInsurance },
    { label: 'Maintenance', value: d.totalMaintenance },
    ...(d.totalHOA > 0 ? [{ label: 'HOA', value: d.totalHOA }] : []),
  ].filter(i => i.value > 0)
   .sort((a, b) => b.value - a.value);

  const sunkTotal = sunkItems.reduce((s, i) => s + i.value, 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full rounded-xl border border-border bg-card px-4 py-2 flex items-center justify-between hover:bg-accent/50 transition-colors h-9">
        <span className="text-[13px] font-medium text-foreground">Show detailed breakdown</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-1.5 rounded-xl border border-border bg-card px-4 py-3 overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cash outflows */}
          <div>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground mb-2">Cash outflows</p>
            <div className="space-y-1">
              {cashFlows.map(row => {
                const barPct = maxFlow > 0 ? (row.value / maxFlow) * 100 : 0;
                return (
                  <div key={row.label} className="flex items-center gap-1.5 h-6">
                    <span className="text-[11px] text-muted-foreground w-24 shrink-0 truncate">{row.label}</span>
                    <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${row.type === 'equity' ? 'bg-success/70' : 'bg-destructive/60'}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium tabular-nums w-18 text-right">{formatCurrency(row.value)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sunk cost composition */}
          <div>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground mb-2">
              Sunk cost breakdown · {formatCurrency(sunkTotal)}
            </p>
            <div className="space-y-1">
              {sunkItems.map(item => {
                const pct = sunkTotal > 0 ? (item.value / sunkTotal) * 100 : 0;
                return (
                  <div key={item.label} className="flex items-center gap-1.5 h-6">
                    <span className="text-[11px] text-muted-foreground w-20 shrink-0 truncate">{item.label}</span>
                    <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-destructive/50" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] tabular-nums text-muted-foreground w-8 text-right">{Math.round(pct)}%</span>
                    <span className="text-[11px] font-medium tabular-nums w-18 text-right">{formatCurrency(item.value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
