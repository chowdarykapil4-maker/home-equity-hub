import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { generateAmortizationSchedule } from '@/lib/amortization';
import { HelpTip } from '@/components/homepl/HelpTip';

export function MortgagePayoffCountdown() {
  const { mortgage, mortgagePayments } = useAppContext();

  const { monthsRemaining, percentComplete, remainingInterest, totalTermMonths, monthsPaid } = useMemo(() => {
    const schedule = generateAmortizationSchedule(mortgage, mortgagePayments);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const currentIdx = schedule.findIndex(r => r.date === currentMonth);
    const futureRows = currentIdx >= 0 ? schedule.slice(currentIdx + 1) : schedule.filter(r => !r.isPast);
    const remInterest = futureRows.reduce((s, r) => s + r.interestPortion, 0);
    
    const total = mortgage.loanTermYears * 12;
    const paid = currentIdx >= 0 ? currentIdx + 1 : mortgagePayments.length;
    const remaining = Math.max(0, total - paid);
    const pct = total > 0 ? (paid / total) * 100 : 0;

    return { monthsRemaining: remaining, percentComplete: pct, remainingInterest: remInterest, totalTermMonths: total, monthsPaid: paid };
  }, [mortgage, mortgagePayments]);

  const years = Math.floor(monthsRemaining / 12);
  const months = monthsRemaining % 12;
  const timeStr = years > 0 ? `${years} yr ${months} mo remaining` : `${months} mo remaining`;

  return (
    <div className="bg-muted/20 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <p className="text-xs">
          Mortgage payoff:{' '}
          <HelpTip plain="Time until your mortgage is fully paid off at current payment rate. Extra payments or refinancing can shorten this significantly.">
            <span className="font-medium">{timeStr}</span>
          </HelpTip>
        </p>
        <div className="flex items-center gap-1.5">
          <div className="w-[100px] h-1 rounded-full bg-muted/60">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${Math.min(100, percentComplete)}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground">{Math.round(percentComplete)}% complete</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Total interest remaining:{' '}
        <HelpTip plain="Sum of all interest you'll pay from now until the loan is paid off. This is the amount you can save by refinancing or making extra payments.">
          <span className="font-medium text-foreground">{formatCurrency(remainingInterest)}</span>
        </HelpTip>
      </p>
    </div>
  );
}