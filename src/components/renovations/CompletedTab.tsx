import { useState } from 'react';
import { RenovationProject, getEstimatedValueAdded, getROIPercentage, CATEGORY_COLORS, ProjectCategory } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Trophy, DollarSign, TrendingUp, BarChart3, Calendar } from 'lucide-react';

interface Props {
  projects: RenovationProject[];
}

export default function CompletedTab({ projects }: Props) {
  const sorted = [...projects]
    .filter(p => p.status === 'Complete')
    .sort((a, b) => (b.dateCompleted || '').localeCompare(a.dateCompleted || ''));

  const totalSpent = sorted.reduce((s, p) => s + p.actualCost, 0);
  const totalValueAdded = sorted.reduce((s, p) => s + getEstimatedValueAdded(p), 0);
  const avgCost = sorted.length > 0 ? totalSpent / sorted.length : 0;
  const bestROI = sorted.length > 0
    ? sorted.reduce((best, p) => getROIPercentage(p) > getROIPercentage(best) ? p : best, sorted[0])
    : null;

  // Year breakdown
  const yearTotals: Record<string, number> = {};
  sorted.forEach(p => {
    const year = p.dateCompleted ? new Date(p.dateCompleted).getFullYear().toString() : 'Unknown';
    yearTotals[year] = (yearTotals[year] || 0) + p.actualCost;
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard icon={<BarChart3 className="h-4 w-4" />} label="Completed" value={String(sorted.length)} />
        <SummaryCard icon={<DollarSign className="h-4 w-4" />} label="Total Spent" value={formatCurrency(totalSpent)} />
        <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label="Value Added" value={formatCurrency(totalValueAdded)} />
        <SummaryCard icon={<Trophy className="h-4 w-4" />} label="Best ROI" value={bestROI ? bestROI.projectName.slice(0, 20) : '—'} sub={bestROI ? formatPercent(getROIPercentage(bestROI)) : ''} />
        <SummaryCard icon={<DollarSign className="h-4 w-4" />} label="Avg Cost" value={formatCurrency(avgCost)} />
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> By Year</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(yearTotals).sort().map(([year, amount]) => (
                <span key={year} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                  {year}: {formatCurrency(amount)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {sorted.length === 0 && (
            <p className="text-muted-foreground text-center py-12">No completed projects yet.</p>
          )}
          {sorted.map(p => (
            <TimelineCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">{icon} {label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function TimelineCard({ project: p }: { project: RenovationProject }) {
  const valueAdded = getEstimatedValueAdded(p);
  const roi = getROIPercentage(p);
  const netCost = p.actualCost - valueAdded;
  const dateStr = p.dateCompleted
    ? new Date(p.dateCompleted).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';
  const catColor = CATEGORY_COLORS[p.category as ProjectCategory] || 'hsl(215, 16%, 47%)';

  return (
    <div className="relative pl-10">
      <div className="absolute left-[11px] top-4 w-3 h-3 rounded-full bg-primary border-2 border-background" />
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-foreground">{p.projectName}</h3>
                <Badge
                  className="text-[10px] px-2 py-0 border-0"
                  style={{ backgroundColor: catColor, color: '#fff' }}
                >
                  {p.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
              {p.vendorName && <p className="text-xs text-muted-foreground">Vendor: {p.vendorName}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold">{formatCurrency(p.actualCost)}</p>
              <p className="text-xs text-success">{formatCurrency(valueAdded)} value added ({formatPercent(roi)} ROI)</p>
              <p className={`text-xs font-medium ${netCost > 0 ? 'text-destructive' : 'text-success'}`}>
                Net: {netCost > 0 ? '' : '+'}{formatCurrency(Math.abs(netCost))} {netCost > 0 ? 'cost' : 'equity'}
              </p>
            </div>
          </div>

          {/* Lifecycle */}
          {(p.dateAddedToWishlist || p.datePromotedToPlanned || p.dateCompleted) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {p.dateAddedToWishlist && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Wishlist: {p.dateAddedToWishlist}</span>}
              {p.datePromotedToPlanned && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Planned: {p.datePromotedToPlanned}</span>}
              {p.dateCompleted && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Completed: {dateStr}</span>}
            </div>
          )}

          {p.notes && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors">
                <ChevronDown className="h-3 w-3" /> Notes
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{p.notes}</p>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
