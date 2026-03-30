import { useAppContext } from '@/context/AppContext';
import { useHomePL } from '@/hooks/useHomePL';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function MonthOverMonthDelta() {
  const { mortgagePayments, valueEntries, homePLConfig } = useAppContext();
  const pl = useHomePL();

  const sortedPayments = [...mortgagePayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  const latestPayment = sortedPayments[sortedPayments.length - 1];
  const prevPayment = sortedPayments[sortedPayments.length - 2];

  const monthlyAppRate = (homePLConfig.tax.annualAppreciation || 3) / 100 / 12;

  // Equity delta
  const currentEquity = pl.wealthBuilt;
  const lastMonthValue = pl.currentHomeValue / (1 + monthlyAppRate);
  const lastMonthBalance = prevPayment?.remainingBalance ?? pl.currentBalance;
  const lastMonthEquity = lastMonthValue - lastMonthBalance;
  const equityDelta = currentEquity - lastMonthEquity;

  // Mortgage delta (balance drop — negative means it went down, which is good)
  const mortgageDelta = latestPayment && prevPayment
    ? latestPayment.remainingBalance - prevPayment.remainingBalance
    : 0;

  // Home value delta
  const sortedValues = [...valueEntries].sort((a, b) => a.date.localeCompare(b.date));
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = `${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}-${String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0')}`;
  
  const thisMonthEntry = sortedValues.filter(e => e.date.startsWith(thisMonth)).pop();
  const lastMonthEntry = sortedValues.filter(e => e.date.startsWith(lastMonth)).pop();
  const valueDelta = thisMonthEntry && lastMonthEntry
    ? thisMonthEntry.estimatedValue - lastMonthEntry.estimatedValue
    : pl.currentHomeValue * monthlyAppRate;

  // Sunk cost this month
  const monthlySunk = pl.monthlyCostOfOwnership;

  const deltas = [
    { label: 'Equity', value: equityDelta, invertColor: false },
    { label: 'Mortgage', value: mortgageDelta, invertColor: true },
    { label: 'Home value', value: valueDelta, invertColor: false },
    { label: 'Sunk cost', value: -monthlySunk, invertColor: false, isSunk: true },
  ];

  return (
    <Card className="rounded-xl">
      <CardContent className="px-4 py-2.5">
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">vs last month</p>
        <div className="grid grid-cols-2 md:grid-cols-4 text-center">
          {deltas.map((d, i) => {
            const isPositive = d.invertColor ? d.value < 0 : d.value > 0;
            const displayValue = Math.abs(d.value);
            const colorClass = d.isSunk ? 'text-destructive/70' : isPositive ? 'text-success' : 'text-destructive';
            const prefix = d.isSunk ? '' : d.value >= 0 ? '+' : '−';
            const showArrow = !d.isSunk;

            return (
              <div key={i} className={`py-1 ${i < deltas.length - 1 ? 'md:border-r md:border-border/20' : ''}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{d.label}</p>
                <p className={`text-[13px] font-semibold ${colorClass} inline-flex items-center gap-0.5 justify-center`}>
                  {showArrow && (isPositive
                    ? <TrendingUp className="h-3 w-3" />
                    : <TrendingDown className="h-3 w-3" />
                  )}
                  {prefix}{formatCurrency(displayValue)}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}