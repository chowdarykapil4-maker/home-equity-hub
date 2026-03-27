import { useMemo } from 'react';
import { RenovationProject, getROIPercentage, getEstimatedValueAdded, CATEGORY_COLORS, ProjectCategory } from '@/types';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, TrendingUp, DollarSign, Target } from 'lucide-react';

interface Props {
  projects: RenovationProject[];
  onTabChange: (tab: string) => void;
}

export default function RenovationSummaryHeader({ projects, onTabChange }: Props) {
  const completed = useMemo(() => projects.filter(p => p.status === 'Complete'), [projects]);
  const planned = useMemo(() => projects.filter(p => p.status === 'Planned 2026' || p.status === 'Planned 2027' || p.status === 'In Progress'), [projects]);
  const wishlist = useMemo(() => projects.filter(p => p.status === 'Wishlist'), [projects]);

  const totalSpent = useMemo(() => completed.reduce((s, p) => s + p.actualCost, 0), [completed]);
  const totalValueAdded = useMemo(() => completed.reduce((s, p) => s + getEstimatedValueAdded(p), 0), [completed]);
  const netCost = totalSpent - totalValueAdded;
  const recoveryRate = totalSpent > 0 ? (totalValueAdded / totalSpent) * 100 : 0;

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
  const currentYear = new Date().getFullYear().toString();

  // Top categories
  const topCategories = useMemo(() => {
    const map: Record<string, number> = {};
    completed.forEach(p => { map[p.category] = (map[p.category] || 0) + p.actualCost; });
    const sorted = Object.entries(map).sort(([, a], [, b]) => b - a);
    if (sorted.length <= 6) return sorted.map(([cat, amt]) => ({ category: cat as ProjectCategory, amount: amt }));
    const top5 = sorted.slice(0, 5);
    const otherTotal = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
    return [...top5.map(([cat, amt]) => ({ category: cat as ProjectCategory, amount: amt })), { category: 'Other' as ProjectCategory, amount: otherTotal }];
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
    <div className="space-y-4">
      {/* SECTION 1 — Pipeline */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 py-3">
        <PipelineSegment
          count={wishlist.length}
          label="Wishlist"
          onClick={() => onTabChange('wishlist')}
          className="text-muted-foreground"
        />
        <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        <PipelineSegment
          count={planned.length}
          label="Planned"
          onClick={() => onTabChange('planned')}
          className="text-primary"
        />
        <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        <PipelineSegment
          count={completed.length}
          label="Completed"
          onClick={() => onTabChange('completed')}
          className="text-accent-foreground"
          emphasized
        />
      </div>

      {/* SECTION 2 — Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 pb-5">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Total invested
            </p>
            <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {completed.length} projects since Oct 2022
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-5">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Value created
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
              {formatCurrency(totalValueAdded)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {recoveryRate.toFixed(1)}% recovery rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6 pb-5">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Net renovation cost
            </p>
            <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(netCost)}</p>
            <p className="text-xs text-muted-foreground mt-1">After value-add offset</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3 — Efficiency Bar */}
      <Card>
        <CardContent className="py-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Investment efficiency</span>
            <span className="text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2.5 py-0.5 rounded-full">
              {recoveryRate.toFixed(1)}% recovered
            </span>
          </div>
          <div className="relative h-7 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(recoveryRate, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(totalValueAdded)} of {formatCurrency(totalSpent)} returned as home value
          </p>
        </CardContent>
      </Card>

      {/* SECTION 4 — Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Spending by year */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Spending by year</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {spendingByYear.map(([year, amount]) => (
              <div key={year} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-muted-foreground font-medium shrink-0">{year}</span>
                <div className="flex-1 h-4 rounded bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded transition-all ${year === currentYear ? 'bg-green-500' : 'bg-primary'}`}
                    style={{ width: `${(amount / maxYearSpend) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right text-muted-foreground font-medium shrink-0">
                  {formatCurrency(amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Top categories by spend</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {topCategories.map(({ category, amount }) => (
              <div key={category} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[category] || 'hsl(215,16%,47%)' }}
                />
                <span className="flex-1 text-muted-foreground truncate">{category}</span>
                <span className="text-foreground font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ROI Leaders */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">ROI leaders</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {roiLeaders && (
              <>
                <ROIRow
                  label="Highest return"
                  name={roiLeaders.highestReturn.project.projectName}
                  roiPct={roiLeaders.highestReturn.roiPct}
                  valueAdded={roiLeaders.highestReturn.valueAdded}
                  cost={roiLeaders.highestReturn.project.actualCost}
                />
                <ROIRow
                  label="Biggest value-add"
                  name={roiLeaders.biggestValue.project.projectName}
                  roiPct={roiLeaders.biggestValue.roiPct}
                  valueAdded={roiLeaders.biggestValue.valueAdded}
                  cost={roiLeaders.biggestValue.project.actualCost}
                />
                <ROIRow
                  label="Best bang for buck"
                  name={roiLeaders.bestBang.project.projectName}
                  roiPct={roiLeaders.bestBang.roiPct}
                  valueAdded={roiLeaders.bestBang.valueAdded}
                  cost={roiLeaders.bestBang.project.actualCost}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PipelineSegment({ count, label, onClick, className, emphasized }: {
  count: number; label: string; onClick: () => void; className?: string; emphasized?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${className}`}
    >
      <span className={`font-bold ${emphasized ? 'text-3xl text-primary' : 'text-xl'}`}>{count}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </button>
  );
}

function ROIRow({ label, name, roiPct, valueAdded, cost }: {
  label: string; name: string; roiPct: number; valueAdded: number; cost: number;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-xs text-foreground font-medium truncate">{name}</p>
      <p className="text-xs text-green-600 dark:text-green-400">
        {roiPct}% · {formatCurrency(Math.round(valueAdded))} value on {formatCurrency(cost)} cost
      </p>
    </div>
  );
}
