import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getROIPercentage, getEstimateMidpoint, getEstimatedValueAdded } from '@/types';
import { formatCurrency } from '@/lib/format';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { HelpTip } from '@/components/homepl/HelpTip';
import { Link } from 'react-router-dom';

function roiTier(pct: number) {
  if (pct > 70) return { label: 'High', color: 'hsl(142, 71%, 45%)' };
  if (pct >= 40) return { label: 'Moderate', color: 'hsl(38, 92%, 50%)' };
  return { label: 'Low', color: 'hsl(0, 72%, 51%)' };
}

export default function RenovationROIRanker() {
  const { projects } = useAppContext();
  const [open, setOpen] = useState(false);

  const ranked = useMemo(() => {
    const eligible = projects.filter(
      p => p.status.startsWith('Planned') || p.status === 'Wishlist'
    );
    return eligible
      .map(p => {
        const roi = getROIPercentage(p);
        const cost = getEstimateMidpoint(p);
        const valueAdded = getEstimatedValueAdded(p);
        const netCost = cost - valueAdded;
        return { ...p, roi, cost, valueAdded, netCost, tier: roiTier(roi) };
      })
      .sort((a, b) => b.roi - a.roi);
  }, [projects]);

  const totalCost = ranked.reduce((s, r) => s + r.cost, 0);
  const totalValue = ranked.reduce((s, r) => s + r.valueAdded, 0);
  const avgROI = ranked.length ? Math.round(ranked.reduce((s, r) => s + r.roi, 0) / ranked.length) : 0;
  const bestPlanned = ranked.find(r => r.status.startsWith('Planned'));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
          <span className="text-sm font-medium text-foreground">Renovation ROI ranker</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {ranked.length} project{ranked.length !== 1 ? 's' : ''} ranked by return →
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 rounded-lg border bg-card p-3 space-y-3">
          {ranked.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No planned projects to rank. Add projects with "Planned" or "Wishlist" status in the{' '}
              <Link to="/renovations" className="text-primary underline">Renovations tab</Link>.
            </p>
          ) : (
            <>
              {/* Section A — Ranked table */}
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-1.5 px-1 w-8">#</th>
                      <th className="text-left py-1.5 px-1">Project</th>
                      <th className="text-right py-1.5 px-1">Cost</th>
                      <th className="text-right py-1.5 px-1">
                        <HelpTip plain="Return on investment — the percentage of spending that comes back as home value. 75% ROI means $0.75 of every dollar becomes equity.">
                          ROI
                        </HelpTip>
                      </th>
                      <th className="text-right py-1.5 px-1">
                        <HelpTip plain="Estimated increase in home value from this project — becomes part of your market-dependent equity.">
                          Value added
                        </HelpTip>
                      </th>
                      <th className="text-right py-1.5 px-1">
                        <HelpTip plain="The portion that doesn't translate to value — becomes sunk cost. Lower is better.">
                          Net cost
                        </HelpTip>
                      </th>
                      <th className="text-center py-1.5 px-1">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((r, i) => (
                      <tr key={r.id} className={`h-7 ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
                        <td className="px-1">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: r.tier.color }} />
                            <span className="text-muted-foreground">{i + 1}</span>
                          </span>
                        </td>
                        <td className="px-1 font-medium truncate max-w-[160px]">{r.projectName}</td>
                        <td className="px-1 text-right tabular-nums">{formatCurrency(r.cost)}</td>
                        <td className="px-1 text-right">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="tabular-nums">{r.roi}%</span>
                            <span className="inline-block h-1.5 rounded-full" style={{ width: `${Math.min(r.roi, 100) * 0.4}px`, backgroundColor: r.tier.color }} />
                          </span>
                        </td>
                        <td className="px-1 text-right tabular-nums text-emerald-600">{formatCurrency(r.valueAdded)}</td>
                        <td className="px-1 text-right tabular-nums text-red-500">{formatCurrency(r.netCost)}</td>
                        <td className="px-1 text-center">
                          {r.status === 'Wishlist' ? (
                            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Wishlist</span>
                          ) : (
                            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Planned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section B — Summary */}
              <p className="text-xs text-muted-foreground">
                If you complete all planned projects: {formatCurrency(totalCost)} invested → {formatCurrency(totalValue)} value added ({avgROI}% avg ROI)
              </p>

              {/* Section C — Best next move */}
              {bestPlanned && (
                <p className="text-[13px]">
                  <HelpTip plain="The planned project with the highest estimated ROI. Completing high-ROI projects first maximizes your renovation efficiency.">
                    Best next project
                  </HelpTip>
                  : {bestPlanned.projectName} — spend {formatCurrency(bestPlanned.cost)}, add{' '}
                  <span className="text-emerald-600 font-medium">~{formatCurrency(bestPlanned.valueAdded)}</span>{' '}
                  to your equity ({bestPlanned.roi}% return)
                </p>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
