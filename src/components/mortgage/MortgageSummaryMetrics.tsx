import { useMemo, useState } from 'react';
import { MortgageProfile, MortgagePayment, isARM, calculateMonthsRemaining } from '@/types';
import { formatCurrency } from '@/lib/format';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  mortgage: MortgageProfile;
  payments: MortgagePayment[];
  currentValue: number;
}

export default function MortgageSummaryMetrics({ mortgage, payments, currentValue }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);

  const sorted = useMemo(() => [...payments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate)), [payments]);

  const currentBalance = sorted.length > 0 ? sorted[sorted.length - 1].remainingBalance : mortgage.originalLoanAmount;
  const paidDown = mortgage.originalLoanAmount - currentBalance;
  const totalPrincipalPaid = sorted.reduce((s, p) => s + p.principalPortion + p.extraPrincipal, 0);
  const totalInterestPaid = sorted.reduce((s, p) => s + p.interestPortion, 0);
  const totalPaid = sorted.reduce((s, p) => s + p.paymentAmount + p.extraPrincipal, 0);
  const principalPct = totalPrincipalPaid + totalInterestPaid > 0 ? (totalPrincipalPaid / (totalPrincipalPaid + totalInterestPaid)) * 100 : 0;
  const interestPct = 100 - principalPct;
  const ltv = currentValue > 0 ? (currentBalance / currentValue) * 100 : 0;
  const equity = currentValue - currentBalance;
  const monthsRemaining = calculateMonthsRemaining(currentBalance, mortgage.interestRate, mortgage.monthlyPayment);
  const paymentsMade = sorted.length;
  const totalTermMonths = mortgage.loanTermYears * 12;

  const now = new Date();
  const startDate = new Date(mortgage.loanStartDate);
  const yearsIn = (now.getTime() - startDate.getTime()) / (365.25 * 24 * 3600000);
  const yearsRemaining = monthsRemaining === Infinity ? Infinity : monthsRemaining / 12;
  const projectedPayoff = new Date(now.getFullYear(), now.getMonth() + monthsRemaining, 1);
  const payoffStr = monthsRemaining === Infinity ? '∞' : projectedPayoff.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const principalPaidPct = mortgage.originalLoanAmount > 0 ? (totalPrincipalPaid / mortgage.originalLoanAmount) * 100 : 0;
  const avgProjectNet = paymentsMade > 0 ? (totalPaid - totalInterestPaid) / paymentsMade : 0;
  const progressPct = totalTermMonths > 0 ? (paymentsMade / totalTermMonths) * 100 : 0;

  // ARM
  const showARM = isARM(mortgage.loanType);
  const armReset = new Date(mortgage.armResetDate);
  const monthsUntilReset = (armReset.getFullYear() - now.getFullYear()) * 12 + (armReset.getMonth() - now.getMonth());
  const armResetStr = armReset.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const fmtK = (v: number) => {
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K`;
    return formatCurrency(v);
  };

  return (
    <div className="border-b border-border">
      {/* ROW 1 — Title Bar */}
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-lg font-medium text-foreground">Mortgage</h2>
        {showARM && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            ARM resets {armResetStr} · {monthsUntilReset} mo
          </span>
        )}
      </div>

      {/* ROW 2 — Hero Metrics Strip */}
      <div className="flex flex-col sm:flex-row border-t border-b border-border divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="flex-1 px-3.5 py-2.5">
          <p className="text-[11px] text-muted-foreground">Original loan</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(mortgage.originalLoanAmount)}</p>
        </div>
        <div className="flex-1 px-3.5 py-2.5">
          <p className="text-[11px] text-muted-foreground">Current balance</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(currentBalance)}</p>
          <p className="text-[11px] text-muted-foreground">Paid down {formatCurrency(paidDown)}</p>
        </div>
        <div className="flex-1 px-3.5 py-2.5">
          <p className="text-[11px] text-muted-foreground">Equity</p>
          <p className="text-xl font-bold text-success">{formatCurrency(equity)}</p>
          <p className="text-[11px] text-muted-foreground">LTV {ltv.toFixed(1)}%</p>
        </div>
      </div>

      {/* ROW 3 — P/I Split Bar */}
      <div className="flex items-center gap-3 px-3.5 py-2 bg-secondary/30 border-b border-border">
        <span className="text-xs font-medium text-success whitespace-nowrap">{fmtK(totalPrincipalPaid)} principal</span>
        <div className="flex-1">
          <div className="h-3.5 rounded-full overflow-hidden flex bg-muted">
            <div className="bg-success/70 h-full transition-all" style={{ width: `${principalPct}%` }} />
            <div className="bg-destructive/50 h-full transition-all" style={{ width: `${interestPct}%` }} />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-muted-foreground">{principalPct.toFixed(1)}% to principal</span>
            <span className="text-[10px] text-muted-foreground">{interestPct.toFixed(1)}% to interest</span>
          </div>
        </div>
        <span className="text-xs font-medium text-destructive whitespace-nowrap">{fmtK(totalInterestPaid)} interest</span>
      </div>

      {/* ROW 4 — Loan Progress Bar */}
      <div className="flex items-center gap-3 px-3.5 py-1.5 border-b border-border">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap"><span className="font-semibold text-foreground">{paymentsMade}</span> paid</span>
        <div className="flex-1 relative">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-primary rounded-full"
            style={{ left: `${progressPct}%` }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          <span className="font-semibold text-foreground">{monthsRemaining === Infinity ? '∞' : totalTermMonths - paymentsMade}</span> remaining · payoff {payoffStr}
        </span>
      </div>

      {/* ROW 5 — ARM Details (conditional) */}
      {showARM && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 px-3.5 py-1.5 bg-amber-50/60 dark:bg-amber-900/10 border-b border-border text-xs">
          <span><span className="text-amber-700/70 dark:text-amber-400/70">Reset:</span> <span className="font-medium text-amber-900 dark:text-amber-300">{armResetStr}</span></span>
          <span><span className="text-amber-700/70 dark:text-amber-400/70">In:</span> <span className="font-medium text-amber-900 dark:text-amber-300">{monthsUntilReset} months</span></span>
          <span><span className="text-amber-700/70 dark:text-amber-400/70">Current:</span> <span className="font-medium text-amber-900 dark:text-amber-300">{mortgage.interestRate}%</span></span>
          <span><span className="text-amber-700/70 dark:text-amber-400/70">Est. market:</span> <span className="font-medium text-amber-900 dark:text-amber-300">{mortgage.estimatedMarketRate}%</span></span>
        </div>
      )}

      {/* ROW 6 — Collapsible Detail Row */}
      <Collapsible open={detailOpen} onOpenChange={setDetailOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs text-primary hover:text-primary/80 cursor-pointer border-b border-border">
          {detailOpen ? 'Hide full metrics' : 'Show full metrics'}
          {detailOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border">
            <DetailCell label="Total paid" value={formatCurrency(totalPaid)} />
            <DetailCell label="Monthly payment" value={formatCurrency(mortgage.monthlyPayment)} />
            <DetailCell label="Principal paid %" value={`${principalPaidPct.toFixed(1)}%`} sub="of original loan" />
            <DetailCell label="Years in / remaining" value={`${yearsIn.toFixed(1)} / ${yearsRemaining === Infinity ? '∞' : yearsRemaining.toFixed(1)}`} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function DetailCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 px-3.5 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
