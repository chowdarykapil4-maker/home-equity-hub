import { useHomePL } from '@/hooks/useHomePL';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { HelpTip } from '@/components/homepl/HelpTip';

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

  // Build milestones: starting from the next $100K above current equity, up to $1M
  const startMilestone = Math.ceil(currentEquity / 100000) * 100000;
  const milestones: number[] = [];
  for (let m = Math.max(startMilestone, 100000); m <= 1000000; m += 100000) {
    milestones.push(m);
  }
  // If already past $1M, extend
  if (startMilestone > 1000000) {
    for (let m = startMilestone; m <= startMilestone + 400000; m += 100000) {
      milestones.push(m);
    }
  }

  if (milestones.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="px-4 py-3 text-center">
          <p className="text-sm font-medium">All milestones reached! 🏆</p>
        </CardContent>
      </Card>
    );
  }

  const nextMilestone = milestones[0];
  const lastMilestone = milestones[milestones.length - 1];
  const monthsToNext = monthlyGrowth > 0 ? Math.ceil((nextMilestone - currentEquity) / monthlyGrowth) : null;

  return (
    <Card className="rounded-xl">
      <CardContent className="px-4 py-3">
        <p className="text-[13px] font-medium mb-2">
          <HelpTip
            plain="Track your equity growth through upcoming $100K milestones. Dates are estimated based on your current monthly wealth creation rate and may vary with market conditions."
          >
            Equity milestones
          </HelpTip>
        </p>

        {/* Desktop timeline */}
        <div className="hidden sm:block">
          <div className="relative">
            <div className="absolute top-[4px] left-0 right-0 h-[2px] bg-muted/40" />
            <div className="flex justify-between">
              {milestones.map((m, i) => {
                const isNext = i === 0;
                return (
                  <div key={m} className="flex flex-col items-center relative">
                    {isNext ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-success relative z-10 milestone-pulse" />
                    ) : (
                      <div className="w-2 h-2 rounded-full border border-muted-foreground/30 bg-card relative z-10" />
                    )}
                    <span className={`text-[10px] mt-1 ${isNext ? 'text-success font-bold' : 'text-muted-foreground'}`}>
                      {formatShort(m)}
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-tight">
                      est. {estDate(currentEquity, m, monthlyGrowth)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="sm:hidden flex items-center justify-between text-[11px]">
          <span className="text-success font-medium">Next: {formatShort(nextMilestone)}</span>
          <span className="text-muted-foreground">Goal: {formatShort(lastMilestone)}</span>
        </div>

        {/* Summary */}
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          {formatCurrency(currentEquity)} current
          {monthsToNext ? ` · next ${formatShort(nextMilestone)} in ~${monthsToNext} mo` : ''}
          {` · ${formatShort(lastMilestone)} by est. ${estDate(currentEquity, lastMilestone, monthlyGrowth)}`}
        </p>
      </CardContent>
    </Card>
  );
}
