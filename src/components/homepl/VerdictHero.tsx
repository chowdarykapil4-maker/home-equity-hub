import { formatCurrency, formatPercent } from '@/lib/format';
import { TrendingUp } from 'lucide-react';
import { HomePLData } from '@/hooks/useHomePL';
import ScenarioDelta from './ScenarioDelta';
import AdvantageBreakdown from './AdvantageBreakdown';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  d: HomePLData;
  baseD?: HomePLData;
  scenarioActive?: boolean;
}

export default function VerdictHero({ d, baseD, scenarioActive = false }: Props) {
  const b = baseD || d;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-success/20 bg-success/[0.04] px-5 pt-4 pb-3">
        <div className="text-center space-y-1">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            Ownership advantage over renting
          </p>
          <div className="flex items-center justify-center gap-1">
            <AdvantageBreakdown d={d} scenarioActive={scenarioActive} />
            <ScenarioDelta scenarioVal={d.ownershipAdvantage} baseVal={b.ownershipAdvantage} active={scenarioActive} />
          </div>
          <p className="text-sm text-muted-foreground">
            You're building <span className="font-semibold text-foreground">{formatCurrency(d.monthlyWealthCreation)}/mo</span> in wealth that a renter never would
            <ScenarioDelta scenarioVal={d.monthlyWealthCreation} baseVal={b.monthlyWealthCreation} active={scenarioActive} />
          </p>

          {d.wealthBuilt < 0 && (
            <p className="text-xs text-destructive font-medium">Underwater — home value below mortgage balance</p>
          )}

          <div className="border-t border-border my-2" />

          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {/* Equity built */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-0.5 cursor-help">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className={`text-sm font-bold border-b border-dotted border-muted-foreground/30 ${d.wealthBuilt >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(d.wealthBuilt)}
                    </span>
                    <ScenarioDelta scenarioVal={d.wealthBuilt} baseVal={b.wealthBuilt} active={scenarioActive} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">equity built</p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] text-xs">
                Down payment ({formatCurrency(d.downPayment)}) + principal paid ({formatCurrency(d.principalPaid)}) + appreciation ({formatCurrency(d.marketAppreciation)}) + reno value ({formatCurrency(d.totalRenoValueAdded)})
              </TooltipContent>
            </Tooltip>

            {/* Cost of ownership */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-0.5 cursor-help">
                  <span className="text-sm font-bold border-b border-dotted border-muted-foreground/30">{formatCurrency(d.sunkCost)}</span>
                  <p className="text-[11px] text-muted-foreground">cost of ownership</p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] text-xs">
                Interest ({formatCurrency(d.interestPaid)}) + property tax ({formatCurrency(d.totalPropertyTax)}) + net reno cost ({formatCurrency(d.netRenoCost)}) + insurance ({formatCurrency(d.totalInsurance)}) + maintenance ({formatCurrency(d.totalMaintenance)})
              </TooltipContent>
            </Tooltip>

            {/* Return on cash */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-0.5 cursor-help">
                  <span className="text-sm font-bold border-b border-dotted border-muted-foreground/30">
                    {formatPercent(d.returnOnCash)}
                    <ScenarioDelta scenarioVal={d.returnOnCash} baseVal={b.returnOnCash} active={scenarioActive} />
                  </span>
                  <p className="text-[11px] text-muted-foreground">return on cash</p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[320px] text-xs">
                (equity − down payment) ÷ (total cash out − down payment) = ({formatCurrency(d.wealthBuilt)} − {formatCurrency(d.downPayment)}) ÷ ({formatCurrency(d.totalCashOut)} − {formatCurrency(d.downPayment)}) = {formatPercent(d.returnOnCash)}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
