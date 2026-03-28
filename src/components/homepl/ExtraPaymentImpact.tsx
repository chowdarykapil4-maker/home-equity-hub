import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { HelpTip } from '@/components/homepl/HelpTip';
import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';

interface Props {
  d: HomePLData;
}

interface ExtraResult {
  extra: number;
  baseMonths: number;
  extraMonths: number;
  baseInterest: number;
  extraInterest: number;
  monthsSaved: number;
  interestSaved: number;
}

function computeImpact(balance: number, rate: number, payment: number, extra: number): ExtraResult {
  const r = rate / 100 / 12;

  // Baseline
  let bal = balance;
  let baseMonths = 0;
  let baseInterest = 0;
  while (bal > 0.01 && baseMonths < 600) {
    const int = bal * r;
    const prin = Math.min(payment - int, bal);
    baseInterest += int;
    bal -= prin;
    baseMonths++;
  }

  // With extra
  bal = balance;
  let extraMonths = 0;
  let extraInterest = 0;
  while (bal > 0.01 && extraMonths < 600) {
    const int = bal * r;
    const prin = Math.min(payment + extra - int, bal);
    extraInterest += int;
    bal -= prin;
    extraMonths++;
  }

  return {
    extra,
    baseMonths,
    extraMonths,
    baseInterest: Math.round(baseInterest),
    extraInterest: Math.round(extraInterest),
    monthsSaved: baseMonths - extraMonths,
    interestSaved: Math.round(baseInterest - extraInterest),
  };
}

function formatYearsMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} mo`;
  if (m === 0) return `${y} yr`;
  return `${y} yr ${m} mo`;
}

function payoffDate(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function ExtraPaymentImpact({ d }: Props) {
  const { mortgage } = useAppContext();
  const [open, setOpen] = useState(false);
  const [extra, setExtra] = useState(500);

  const pills = [250, 500, 1000, 2000];

  const results = useMemo(() => {
    const balance = d.currentBalance;
    const rate = mortgage.interestRate;
    const payment = mortgage.monthlyPayment;

    // Compute for current slider value + all pill values
    const allExtras = new Set([extra, ...pills]);
    const map = new Map<number, ExtraResult>();
    allExtras.forEach(e => {
      map.set(e, computeImpact(balance, rate, payment, e));
    });
    return map;
  }, [d.currentBalance, mortgage.interestRate, mortgage.monthlyPayment, extra]);

  const current = results.get(extra) || computeImpact(d.currentBalance, mortgage.interestRate, mortgage.monthlyPayment, extra);
  const preview500 = results.get(500) || current;

  const timelineRatio = current.baseMonths > 0 ? (current.extraMonths / current.baseMonths) * 100 : 100;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
          <span className="text-sm font-medium text-foreground">Extra payment impact</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-green-600 dark:text-green-400">
              $500/mo extra saves {formatCurrency(preview500.interestSaved)} in interest
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 rounded-lg border bg-card p-4 space-y-5">
          {/* Section A — Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                <HelpTip plain="This entire amount goes to principal — none goes to interest. Every extra dollar directly reduces what you owe.">
                  Extra monthly payment
                </HelpTip>
              </span>
              <span className="text-base font-medium text-foreground">{formatCurrency(extra)}/mo extra</span>
            </div>
            <Slider
              value={[extra]}
              onValueChange={v => setExtra(v[0])}
              min={0}
              max={3000}
              step={100}
            />
            <div className="flex gap-1.5">
              {pills.map(p => (
                <button
                  key={p}
                  onClick={() => setExtra(p)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    extra === p
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted/60'
                  }`}
                >
                  {formatCurrency(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Section B — Impact comparison */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
            {/* Without extra */}
            <div className="space-y-1.5 pr-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Without extra</p>
              <p className="text-sm">Payment: <span className="font-medium">{formatCurrency(mortgage.monthlyPayment)}/mo</span></p>
              <p className="text-[13px] text-muted-foreground">Payoff: {payoffDate(current.baseMonths)}</p>
              <p className="text-[13px] text-muted-foreground">
                <HelpTip plain="Sum of all interest you'll pay from now until the loan is fully paid off at your current rate.">
                  Remaining interest
                </HelpTip>: {formatCurrency(current.baseInterest)}
              </p>
            </div>

            {/* Divider + delta */}
            <div className="flex flex-col items-center justify-center px-4 border-l border-r border-border">
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                <HelpTip plain="Extra payments accelerate your payoff date. The standard schedule assumes minimum payments.">
                  {formatYearsMonths(current.monthsSaved)} earlier
                </HelpTip>
              </p>
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                <HelpTip plain="Extra principal reduces your balance faster. Lower balance = less interest charged every future month. The savings compound over time.">
                  Saves {formatCurrency(current.interestSaved)}
                </HelpTip>
              </p>
            </div>

            {/* With extra */}
            <div className="space-y-1.5 pl-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">With {formatCurrency(extra)}/mo extra</p>
              <p className="text-sm">Payment: <span className="font-medium">{formatCurrency(mortgage.monthlyPayment + extra)}/mo</span></p>
              <p className="text-[13px] text-green-600 dark:text-green-400">Payoff: {payoffDate(current.extraMonths)}</p>
              <p className="text-[13px] text-muted-foreground">Remaining interest: {formatCurrency(current.extraInterest)}</p>
            </div>
          </div>

          {/* Section C — Timeline bar */}
          <div className="space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-3 rounded-full bg-muted-foreground/20 flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatYearsMonths(current.baseMonths)} remaining</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 rounded-full bg-green-500/70 dark:bg-green-400/60" style={{ width: `${timelineRatio}%` }} />
                <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
                  {formatYearsMonths(current.extraMonths)} · {formatYearsMonths(current.monthsSaved)} saved
                </span>
              </div>
            </div>
          </div>

          {/* Section D — Sensitivity table */}
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left font-medium text-muted-foreground px-3 py-1.5">Extra/mo</th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-1.5">
                    <HelpTip plain="Extra principal reduces your balance faster. Lower balance = less interest charged every future month. The savings compound over time.">
                      Interest saved
                    </HelpTip>
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-1.5">
                    <HelpTip plain="Extra payments accelerate your payoff date. The standard schedule assumes minimum payments.">
                      Years saved
                    </HelpTip>
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-1.5">
                    <HelpTip plain="Unlike your regular payment which splits between principal and interest, extra payments are 100% equity building.">
                      Equity boost
                    </HelpTip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pills.map((p, i) => {
                  const r = results.get(p);
                  if (!r) return null;
                  const isActive = extra === p;
                  return (
                    <tr
                      key={p}
                      className={`${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'} ${isActive ? 'border-l-[3px] border-l-green-500' : 'border-l-[3px] border-l-transparent'}`}
                    >
                      <td className="px-3 py-1.5 font-medium">{formatCurrency(p)}</td>
                      <td className="px-3 py-1.5 text-right text-green-600 dark:text-green-400">{formatCurrency(r.interestSaved)}</td>
                      <td className="px-3 py-1.5 text-right">{formatYearsMonths(r.monthsSaved)}</td>
                      <td className="px-3 py-1.5 text-right text-green-600 dark:text-green-400">+{formatCurrency(p)}/mo</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
