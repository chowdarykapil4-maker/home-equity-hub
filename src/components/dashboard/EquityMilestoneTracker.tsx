import { useHomePL } from '@/hooks/useHomePL';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const MILESTONES = [250000, 500000, 600000, 750000, 1000000, 1500000, 2000000];

export function EquityMilestoneTracker() {
  const pl = useHomePL();
  const currentEquity = pl.wealthBuilt;

  const lastMilestone = [...MILESTONES].reverse().find(m => m <= currentEquity) ?? 0;
  const nextMilestone = MILESTONES.find(m => m > currentEquity);

  if (!nextMilestone) {
    return (
      <Card className="rounded-xl">
        <CardContent className="px-4 py-3 flex items-center justify-center">
          <p className="text-sm font-medium">All milestones reached! 🏆</p>
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentEquity - lastMilestone) / (nextMilestone - lastMilestone)) * 100;
  const monthlyGrowth = pl.trueMonthlyWealthCreation || pl.monthlyWealthCreation;
  
  let estDate = '—';
  if (monthlyGrowth > 0) {
    const monthsToNext = (nextMilestone - currentEquity) / monthlyGrowth;
    const target = new Date();
    target.setMonth(target.getMonth() + Math.ceil(monthsToNext));
    estDate = target.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  return (
    <Card className="rounded-xl">
      <CardContent className="px-4 py-2.5 flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-success shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium leading-tight">Next milestone: {formatCurrency(nextMilestone)}</p>
          <div className="w-full h-1.5 rounded-full bg-muted/40 mt-1">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {formatCurrency(currentEquity)} of {formatCurrency(nextMilestone)} · est. {estDate}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-muted-foreground">Last: {formatCurrency(lastMilestone)} <span className="text-success">✓</span></p>
        </div>
      </CardContent>
    </Card>
  );
}