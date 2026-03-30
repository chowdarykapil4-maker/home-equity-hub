import { useHomePL } from '@/hooks/useHomePL';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { HelpTip } from '@/components/homepl/HelpTip';

const MILESTONES = [100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000];

function formatShort(val: number) {
  return val >= 1000000 ? `$${val / 1000000}M` : `$${val / 1000}K`;
}

function estDate(currentEquity: number, milestone: number, monthlyGrowth: number): string {
  if (monthlyGrowth <= 0) return '—';
  const months = (milestone - currentEquity) / monthlyGrowth;
  if (months < 0 || !isFinite(months)) return '—';
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(months));
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function EquityMilestoneTracker() {
  const pl = useHomePL();
  const currentEquity = pl.wealthBuilt;
  const monthlyGrowth = pl.trueMonthlyWealthCreation || pl.monthlyWealthCreation;

  const passedCount = MILESTONES.filter(m => m <= currentEquity).length;
  const nextIdx = MILESTONES.findIndex(m => m > currentEquity);
  const lastMilestoneDate = estDate(currentEquity, 1000000, monthlyGrowth);

  const nextMilestone = nextIdx >= 0 ? MILESTONES[nextIdx] : null;
  const monthsToNext = nextMilestone && monthlyGrowth > 0
    ? Math.ceil((nextMilestone - currentEquity) / monthlyGrowth)
    : null;

  return (
    <Card className="rounded-xl">
      <CardContent className="px-4 py-3">
        <p className="text-[13px] font-medium mb-2">
          <HelpTip
            plain="Track your equity growth through $100K milestones. Dates are estimated based on your current monthly wealth creation rate and may vary with market conditions."
          >
            Equity milestones
          </HelpTip>
        </p>

        {/* Desktop timeline */}
        <div className="hidden sm:block">
          <div className="relative">
            {/* Track line */}
            <div className="absolute top-[4px] left-0 right-0 h-[2px] bg-muted/40" />
            <div className="grid grid-cols-10">
              {MILESTONES.map((m, i) => {
                const passed = m <= currentEquity;
                const isNext = nextIdx === i;
                return (
                  <div key={m} className="flex flex-col items-center relative">
                    {/* Dot */}
                    {passed ? (
                      <div className="w-2 h-2 rounded-full bg-success flex items-center justify-center relative z-10">
                        <Check className="w-[6px] h-[6px] text-success-foreground" strokeWidth={3} />
                      </div>
                    ) : isNext ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-success relative z-10 milestone-pulse" />
                    ) : (
                      <div className="w-2 h-2 rounded-full border border-muted-foreground/30 bg-card relative z-10" />
                    )}
                    {/* Label */}
                    <span className={`text-[10px] mt-1 ${passed ? 'text-success' : isNext ? 'text-success font-bold' : 'text-muted-foreground'}`}>
                      {formatShort(m)}
                    </span>
                    {/* Date for next & future */}
                    {!passed && (
                      <span className="text-[9px] text-muted-foreground leading-tight">
                        est. {estDate(currentEquity, m, monthlyGrowth)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile: collapsed */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-success font-medium">{passedCount} of 10 reached</span>
            {nextMilestone && (
              <span className="text-muted-foreground">Next: {formatShort(nextMilestone)}</span>
            )}
            <span className="text-muted-foreground">Goal: $1M</span>
          </div>
        </div>

        {/* Summary */}
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          {formatCurrency(currentEquity)} current
          {nextMilestone && monthsToNext ? ` · next ${formatShort(nextMilestone)} in ~${monthsToNext} mo` : ''}
          {` · $1M by est. ${lastMilestoneDate}`}
        </p>
      </CardContent>
    </Card>
  );
}
