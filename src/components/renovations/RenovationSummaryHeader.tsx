import { useState, useMemo } from 'react';
import { RenovationProject, getROIPercentage, getEstimatedValueAdded, CATEGORY_COLORS, ProjectCategory } from '@/types';
import { formatCurrency } from '@/lib/format';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface Props {
  projects: RenovationProject[];
  onTabChange: (tab: string) => void;
}

function abbreviate(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `$${n}`;
}

export default function RenovationSummaryHeader({ projects, onTabChange }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);

  const completed = useMemo(() => projects.filter(p => p.status === 'Complete'), [projects]);
  const planned = useMemo(() => projects.filter(p => p.status === 'Planned 2026' || p.status === 'Planned 2027' || p.status === 'In Progress'), [projects]);
  const wishlist = useMemo(() => projects.filter(p => p.status === 'Wishlist'), [projects]);

  const totalSpent = useMemo(() => completed.reduce((s, p) => s + p.actualCost, 0), [completed]);
  const totalValueAdded = useMemo(() => completed.reduce((s, p) => s + getEstimatedValueAdded(p), 0), [completed]);
  const netCost = totalSpent - totalValueAdded;
  const recoveryRate = totalSpent > 0 ? (totalValueAdded / totalSpent) * 100 : 0;
  const avgCost = completed.length > 0 ? totalSpent / completed.length : 0;
  const avgNet = completed.length > 0 ? netCost / completed.length : 0;

  // Spending by year
  const spendingByYear = useMemo(() => {
    const map: Record<string, number> = {};
    completed.forEach(p => {
      if (p.dateCompleted) {
        const year = p.dateCompleted.substring(0, 4);
        map[year] = (map[year] || 0) + p.actualCost;
      }
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [completed]);
  const maxYearSpend = Math.max(...spendingByYear.map(([, v]) => v), 1);

  // Top categories
  const topCategories = useMemo(() => {
    const map: Record<string, number> = {};
    completed.forEach(p => { map[p.category] = (map[p.category] || 0) + p.actualCost; });
    const sorted = Object.entries(map).sort(([, a], [, b]) => b - a);
    if (sorted.length <= 5) return sorted.map(([cat, amt]) => ({ category: cat as ProjectCategory, amount: amt }));
    const top4 = sorted.slice(0, 4);
    const otherTotal = sorted.slice(4).reduce((s, [, v]) => s + v, 0);
    return [...top4.map(([cat, amt]) => ({ category: cat as ProjectCategory, amount: amt })), { category: 'Other' as ProjectCategory, amount: otherTotal }];
  }, [completed]);

  // ROI leaders
  const roiLeaders = useMemo(() => {
    if (completed.length === 0) return null;
    const withROI = completed.map(p => ({
      project: p,
      roiPct: getROIPercentage(p),
      valueAdded: getEstimatedValueAdded(p),
    }));
    const highestReturn = [...withROI].sort((a, b) => b.roiPct - a.roiPct)[0];
    const biggestValue = [...withROI].sort((a, b) => b.valueAdded - a.valueAdded)[0];
    const significant = withROI.filter(w => w.project.actualCost >= 5000);
    const bestBang = significant.length > 0
      ? [...significant].sort((a, b) => (b.valueAdded / b.project.actualCost) - (a.valueAdded / a.project.actualCost))[0]
      : highestReturn;
    return { highestReturn, biggestValue, bestBang };
  }, [completed]);

  return (
    <div className="space-y-0">
      {/* ROW 1 — Title bar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h2 className="text-lg font-medium text-foreground">Renovation planner</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onTabChange('wishlist')}
            className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {wishlist.length} ideas
          </button>
          <button
            onClick={() => onTabChange('planned')}
            className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {planned.length} planned
          </button>
          <button
            onClick={() => onTabChange('completed')}
            className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
          >
            {completed.length} done
          </button>
        </div>
      </div>

      {/* ROW 2 — Metrics strip */}
      <div className="mx-3 rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <MetricCell label="Total invested" value={formatCurrency(totalSpent)} sub={`${completed.length} projects`} />
          <MetricCell label="Value created" value={formatCurrency(totalValueAdded)} sub={`${recoveryRate.toFixed(1)}% recovery`} green />
          <MetricCell label="Net cost" value={formatCurrency(netCost)} sub="After value offset" />
          <MetricCell label="Avg project" value={formatCurrency(Math.round(avgCost))} sub={`${formatCurrency(Math.round(avgNet))} net`} last />
        </div>
        {/* 3px efficiency accent bar */}
        <div className="h-[3px] w-full bg-muted flex">
          <div
            className="h-full bg-green-500 dark:bg-green-400 transition-all duration-500"
            style={{ width: `${Math.min(recoveryRate, 100)}%` }}
          />
        </div>
      </div>

      {/* ROW 3 — Collapsible detail panel */}
      <Collapsible open={detailOpen} onOpenChange={setDetailOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer">
          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${detailOpen ? 'rotate-180' : ''}`} />
          {detailOpen ? 'Hide breakdown' : 'Show breakdown'}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-3 pb-3">
            {/* By year */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">By year</p>
              {spendingByYear.map(([year, amount]) => (
                <div key={year} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-7 text-muted-foreground shrink-0">{year}</span>
                  <div className="w-[60px] h-[10px] rounded bg-muted overflow-hidden shrink-0">
                    <div className="h-full rounded bg-primary" style={{ width: `${(amount / maxYearSpend) * 100}%` }} />
                  </div>
                  <span className="text-foreground font-medium">{abbreviate(amount)}</span>
                </div>
              ))}
            </div>

            {/* Top categories */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Top categories</p>
              {topCategories.map(({ category, amount }) => (
                <div key={category} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[category] || 'hsl(215,16%,47%)' }} />
                  <span className="flex-1 text-muted-foreground truncate">{category}</span>
                  <span className="text-foreground font-medium">{abbreviate(amount)}</span>
                </div>
              ))}
            </div>

            {/* ROI leaders */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">ROI leaders</p>
              {roiLeaders && (
                <>
                  <MiniROI label="Highest return" name={roiLeaders.highestReturn.project.projectName} roiPct={roiLeaders.highestReturn.roiPct} valueAdded={roiLeaders.highestReturn.valueAdded} cost={roiLeaders.highestReturn.project.actualCost} />
                  <MiniROI label="Biggest add" name={roiLeaders.biggestValue.project.projectName} roiPct={roiLeaders.biggestValue.roiPct} valueAdded={roiLeaders.biggestValue.valueAdded} cost={roiLeaders.biggestValue.project.actualCost} />
                  <MiniROI label="Best value" name={roiLeaders.bestBang.project.projectName} roiPct={roiLeaders.bestBang.roiPct} valueAdded={roiLeaders.bestBang.valueAdded} cost={roiLeaders.bestBang.project.actualCost} />
                </>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Bottom border before tabs */}
      <div className="border-b border-border" />
    </div>
  );
}

function MetricCell({ label, value, sub, green, last }: {
  label: string; value: string; sub: string; green?: boolean; last?: boolean;
}) {
  return (
    <div className={`px-3 py-2.5 ${last ? '' : 'border-r border-border/50'}`}>
      <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
      <p className={`text-lg font-medium leading-tight mt-0.5 ${green ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>{value}</p>
      <p className={`text-[11px] leading-none mt-0.5 ${green ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>{sub}</p>
    </div>
  );
}

function MiniROI({ label, name, roiPct, valueAdded, cost }: {
  label: string; name: string; roiPct: number; valueAdded: number; cost: number;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-xs text-foreground font-medium truncate leading-tight">{name}</p>
      <p className="text-[10px] text-green-600 dark:text-green-400 leading-tight">
        {roiPct}% · {abbreviate(Math.round(valueAdded))} on {abbreviate(cost)}
      </p>
    </div>
  );
}
