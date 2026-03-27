import { formatCurrency, formatPercent } from '@/lib/format';
import { TrendingUp } from 'lucide-react';
import { HomePLData } from '@/hooks/useHomePL';
import ScenarioDelta from './ScenarioDelta';

interface Props {
  d: HomePLData;
  baseD?: HomePLData;
  scenarioActive?: boolean;
}

export default function VerdictHero({ d, baseD, scenarioActive = false }: Props) {
  const b = baseD || d;

  return (
    <div className="rounded-xl border border-success/20 bg-success/[0.04] px-5 pt-4 pb-3">
      <div className="text-center space-y-1">
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Ownership advantage over renting
        </p>
        <p className={`text-4xl font-bold tracking-tight ${d.ownershipAdvantage >= 0 ? 'text-success' : 'text-destructive'}`}>
          {d.ownershipAdvantage >= 0 ? '+' : ''}{formatCurrency(d.ownershipAdvantage)}
          <ScenarioDelta scenarioVal={d.ownershipAdvantage} baseVal={b.ownershipAdvantage} active={scenarioActive} />
        </p>
        <p className="text-sm text-muted-foreground">
          You're building <span className="font-semibold text-foreground">{formatCurrency(d.monthlyWealthCreation)}/mo</span> in wealth that a renter never would
          <ScenarioDelta scenarioVal={d.monthlyWealthCreation} baseVal={b.monthlyWealthCreation} active={scenarioActive} />
        </p>

        {d.wealthBuilt < 0 && (
          <p className="text-xs text-destructive font-medium">Underwater — home value below mortgage balance</p>
        )}

        <div className="border-t border-border my-2" />

        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className={`text-sm font-bold ${d.wealthBuilt >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(d.wealthBuilt)}
              </span>
              <ScenarioDelta scenarioVal={d.wealthBuilt} baseVal={b.wealthBuilt} active={scenarioActive} />
            </div>
            <p className="text-[11px] text-muted-foreground">equity built</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-bold">{formatCurrency(d.sunkCost)}</span>
            <p className="text-[11px] text-muted-foreground">cost of ownership</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-bold">
              {formatPercent(d.returnOnCash)}
              <ScenarioDelta scenarioVal={d.returnOnCash} baseVal={b.returnOnCash} active={scenarioActive} />
            </span>
            <p className="text-[11px] text-muted-foreground">return on cash</p>
          </div>
        </div>
      </div>
    </div>
  );
}
