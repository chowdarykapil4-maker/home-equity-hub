import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/AppContext';
import { generateAmortizationSchedule } from '@/lib/amortization';
import { formatCurrency, formatPercent } from '@/lib/format';
import { HelpTip } from '@/components/homepl/HelpTip';
import { isARM } from '@/types';
import type { HomePLData } from '@/hooks/useHomePL';

interface Props {
  d: HomePLData;
}

export default function RefinanceAnalyzer({ d }: Props) {
  const { mortgage, mortgagePayments } = useAppContext();
  const [open, setOpen] = useState(false);
  const [newRate, setNewRate] = useState(4.5);
  const [closingCosts, setClosingCosts] = useState(8000);
  const [newTermYears, setNewTermYears] = useState(30);

  const currentRate = mortgage.interestRate;
  const currentRateStr = `${currentRate}%`;

  const results = useMemo(() => {
    const balance = d.currentBalance;
    const currentPayment = mortgage.monthlyPayment;

    // Current remaining interest from amortization schedule
    const schedule = generateAmortizationSchedule(mortgage, mortgagePayments);
    const remainingInterest = schedule
      .filter(r => !r.isPast && !r.isCurrentMonth)
      .reduce((s, r) => s + r.interestPortion, 0);

    // New loan amortization
    const r = newRate / 1200;
    const n = newTermYears * 12;
    let newPayment: number;
    if (r === 0) {
      newPayment = balance / n;
    } else {
      newPayment = balance * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    newPayment = Math.round(newPayment * 100) / 100;

    // New total interest
    let bal = balance;
    let newTotalInterest = 0;
    for (let i = 0; i < n && bal > 0.01; i++) {
      const int = bal * r;
      const prin = Math.min(newPayment - int, bal);
      newTotalInterest += int;
      bal -= prin;
    }

    const monthlySavings = currentPayment - newPayment;
    const totalInterestSaved = remainingInterest - newTotalInterest;
    const breakevenMonths = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : Infinity;

    const breakevenDate = new Date();
    breakevenDate.setMonth(breakevenDate.getMonth() + breakevenMonths);
    const breakevenStr = breakevenMonths <= 600
      ? breakevenDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'N/A';

    // P/I impact — first month principal portion
    const currentFirstInterest = balance * (currentRate / 1200);
    const currentFirstPrincipal = currentPayment - currentFirstInterest;
    const currentPIPct = currentPayment > 0 ? (currentFirstPrincipal / currentPayment) * 100 : 0;

    const newFirstInterest = balance * r;
    const newFirstPrincipal = newPayment - newFirstInterest;
    const newPIPct = newPayment > 0 ? (newFirstPrincipal / newPayment) * 100 : 0;

    const wealthBoost = newFirstPrincipal - currentFirstPrincipal;

    return {
      balance,
      currentPayment,
      remainingInterest: Math.round(remainingInterest),
      newPayment,
      newTotalInterest: Math.round(newTotalInterest),
      monthlySavings: Math.round(monthlySavings),
      totalInterestSaved: Math.round(totalInterestSaved),
      breakevenMonths,
      breakevenStr,
      currentPIPct,
      newPIPct,
      wealthBoost: Math.round(wealthBoost),
    };
  }, [d.currentBalance, mortgage, mortgagePayments, newRate, newTermYears, closingCosts, currentRate]);

  const ratePills = [4.0, 4.5, 5.0, currentRate];
  const uniquePills = [...new Set(ratePills)].sort((a, b) => a - b);

  const breakevenColor = results.breakevenMonths <= 24
    ? 'text-emerald-600'
    : results.breakevenMonths <= 48
      ? 'text-amber-600'
      : 'text-red-500';

  const breakevenLabel = results.breakevenMonths <= 24
    ? 'Strong candidate'
    : results.breakevenMonths <= 48
      ? 'Worth considering if staying long-term'
      : 'Weak — savings don\'t justify costs quickly';

  const savingsPositive = results.monthlySavings > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/30 transition-colors">
          <span className="text-sm font-medium text-foreground">Refinance analyzer</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">See savings at lower rates →</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="rounded-b-lg border border-t-0 border-border bg-card px-4 py-3 space-y-4">
          {/* Section A — Inputs */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">New rate:</span>
              <div className="relative w-[60px]">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="15"
                  value={newRate}
                  onChange={e => setNewRate(parseFloat(e.target.value) || 0)}
                  className="h-7 text-xs pr-5"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
            </div>

            <div className="flex gap-1">
              {uniquePills.map(r => (
                <button
                  key={r}
                  onClick={() => setNewRate(r)}
                  className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                    r === currentRate
                      ? 'bg-muted text-muted-foreground border-border opacity-60'
                      : newRate === r
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-muted/50'
                  }`}
                >
                  {r}%{r === currentRate ? ' (current)' : ''}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Closing costs:</span>
              <Input
                type="number"
                step="500"
                min="0"
                value={closingCosts}
                onChange={e => setClosingCosts(parseFloat(e.target.value) || 0)}
                className="h-7 text-xs w-[80px]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">New term:</span>
              <Select value={String(newTermYears)} onValueChange={v => setNewTermYears(Number(v))}>
                <SelectTrigger className="h-7 text-xs w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30yr</SelectItem>
                  <SelectItem value="20">20yr</SelectItem>
                  <SelectItem value="15">15yr</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section B — Side-by-side */}
          <div className="grid grid-cols-2 gap-0 text-xs">
            {/* Current */}
            <div className="pr-4 border-r border-border space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Current loan</p>
              <p>Rate: {currentRate}% {isARM(mortgage.loanType) ? mortgage.loanType : 'fixed'}</p>
              <p className="text-base font-semibold">{formatCurrency(results.currentPayment)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
              <p>Remaining balance: {formatCurrency(results.balance)}</p>
              <p><HelpTip plain="Sum of all interest you'll pay from now until the loan is fully paid off at your current rate."
                >Remaining interest</HelpTip>: {formatCurrency(results.remainingInterest)}</p>
              {isARM(mortgage.loanType) && mortgage.armResetDate && (
                <p className="text-amber-600">ARM resets: {new Date(mortgage.armResetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
              )}
            </div>

            {/* After refi */}
            <div className="pl-4 space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">After refinance</p>
              <p>Rate: {newRate}% fixed</p>
              <p className={`text-base font-semibold ${savingsPositive ? 'text-emerald-600' : ''}`}>
                {formatCurrency(results.newPayment)}<span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
              <p>Balance: {formatCurrency(results.balance)} <span className="text-muted-foreground">(unchanged)</span></p>
              <p>Total new interest: {formatCurrency(results.newTotalInterest)}</p>
              {savingsPositive && (
                <p className="text-emerald-600 font-semibold text-sm">
                  <HelpTip plain="Real cash flow — this stays in your pocket every month after refinancing."
                    >Monthly savings</HelpTip>: {formatCurrency(results.monthlySavings)}
                </p>
              )}
            </div>
          </div>

          {/* Section C — Verdict */}
          {savingsPositive ? (
            <div className="rounded-md bg-muted/40 px-3 py-2.5 space-y-0.5">
              <p className="text-lg font-semibold text-emerald-600">Monthly savings: {formatCurrency(results.monthlySavings)}</p>
              <p className="text-sm">Total interest saved: {formatCurrency(results.totalInterestSaved)}</p>
              <p className={`text-[13px] ${breakevenColor}`}>
                <HelpTip plain="Months of savings needed to recoup refinancing closing costs. After this, every month is pure savings."
                  >Breakeven</HelpTip>: {results.breakevenMonths} months — refi pays for itself by {results.breakevenStr}
                <span className="ml-2 font-medium">· {breakevenLabel}</span>
              </p>
            </div>
          ) : (
            <div className="rounded-md bg-muted/40 px-3 py-2.5">
              <p className="text-sm text-muted-foreground">
                At {newRate}%, your payment would {results.monthlySavings === 0 ? 'stay the same' : `increase by ${formatCurrency(Math.abs(results.monthlySavings))}/mo`}. No savings at this rate.
              </p>
            </div>
          )}

          {/* Section D — P&L Impact */}
          <div className="text-[13px] space-y-0.5">
            <p>
              <HelpTip plain="At a lower rate, more of each payment goes to principal (building equity) and less to interest (sunk cost)."
                >After refi</HelpTip>, {formatPercent(results.newPIPct)} of each payment goes to principal (currently {formatPercent(results.currentPIPct)})
            </p>
            {results.wealthBoost > 0 && (
              <p className="text-emerald-600">
                Wealth creation boost: +{formatCurrency(results.wealthBoost)}/mo faster equity buildup
              </p>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
