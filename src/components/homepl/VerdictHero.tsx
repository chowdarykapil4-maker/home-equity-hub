import { formatCurrency, formatPercent } from '@/lib/format';
import { TrendingUp } from 'lucide-react';
import { HomePLData } from '@/hooks/useHomePL';
import { useAppContext } from '@/context/AppContext';
import ScenarioDelta from './ScenarioDelta';
import AdvantageBreakdown from './AdvantageBreakdown';
import { HelpTip } from './HelpTip';
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
  const { homePLConfig } = useAppContext();

  const assumedAppreciation = homePLConfig.tax?.annualAppreciation || 2;
  const sustainableMonthlyAppreciation = (d.currentHomeValue * (assumedAppreciation / 100)) / 12;
  const currentMonthlyPrincipal = d.sustainableMonthlyRate - sustainableMonthlyAppreciation;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="px-4 pt-3 pb-0">
        <div className="text-center space-y-0.5">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            Ownership advantage over renting
          </p>
          <div className="flex items-center justify-center gap-1">
            <AdvantageBreakdown d={d} scenarioActive={scenarioActive} />
            <ScenarioDelta scenarioVal={d.ownershipAdvantage} baseVal={b.ownershipAdvantage} active={scenarioActive} />
          </div>

          {d.wealthBuilt < 0 && (
            <p className="text-xs text-destructive font-medium">Underwater — home value below mortgage balance</p>
          )}

          <div className="mx-auto w-[60px] h-[2px] bg-success/40 my-2" />

          <div className="flex items-center justify-center gap-6">
            {/* Equity built */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-0.5 cursor-help">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className={`text-[13px] font-bold border-b border-dotted border-muted-foreground/30 ${d.wealthBuilt >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(d.wealthBuilt)}
                    </span>
                    <ScenarioDelta scenarioVal={d.wealthBuilt} baseVal={b.wealthBuilt} active={scenarioActive} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">equity built</p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] text-xs">
                <p>If you sold today and paid off the mortgage, this is what you'd walk away with</p>
                <p className="text-muted-foreground mt-0.5">Down payment ({formatCurrency(d.downPayment)}) + principal paid ({formatCurrency(d.principalPaid)}) + appreciation ({formatCurrency(d.marketAppreciation)}) + reno value ({formatCurrency(d.totalRenoValueAdded)})</p>
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-8 bg-border" />

            {/* Cost of ownership */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-0.5 cursor-help">
                  <span className="text-[13px] font-bold border-b border-dotted border-muted-foreground/30">{formatCurrency(d.sunkCost)}</span>
                  <p className="text-[11px] text-muted-foreground">cost of ownership</p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] text-xs">
                <p>Total money spent that you can never recover</p>
                <p className="text-muted-foreground mt-0.5">Interest ({formatCurrency(d.interestPaid)}) + property tax ({formatCurrency(d.totalPropertyTax)}) + net reno cost ({formatCurrency(d.netRenoCost)}) + insurance ({formatCurrency(d.totalInsurance)}) + maintenance ({formatCurrency(d.totalMaintenance)})</p>
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-8 bg-border" />

            {/* Return on cash */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-0.5 cursor-help">
                  <span className="text-[13px] font-bold border-b border-dotted border-muted-foreground/30">
                    {formatPercent(d.returnOnCash)}
                    <ScenarioDelta scenarioVal={d.returnOnCash} baseVal={b.returnOnCash} active={scenarioActive} />
                  </span>
                  <p className="text-[11px] text-muted-foreground">return on cash</p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[320px] text-xs">
                <p>For every dollar you put into this house beyond the down payment, you got back {d.returnOnCash.toFixed(0)} cents in equity growth</p>
                <p className="text-muted-foreground mt-0.5">(equity − down payment) ÷ (total cash out − down payment) = ({formatCurrency(d.wealthBuilt)} − {formatCurrency(d.downPayment)}) ÷ ({formatCurrency(d.totalCashOut)} − {formatCurrency(d.downPayment)}) = {formatPercent(d.returnOnCash)}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* NEW: How you're building wealth — decomposition */}
          <div className="mt-3 pt-3 border-t border-success/20">
            {/* Row 1: Sustainable rate headline */}
            <p className="text-sm text-foreground">
              <HelpTip
                plain={`Conservative forward-looking rate: your current principal paydown (${formatCurrency(currentMonthlyPrincipal)}/mo) plus assumed ${assumedAppreciation}% annual appreciation (${formatCurrency(sustainableMonthlyAppreciation)}/mo). Excludes episodic renovation value.`}
                math={`Principal (~${formatCurrency(currentMonthlyPrincipal)}) + appreciation (~${formatCurrency(sustainableMonthlyAppreciation)}) = ${formatCurrency(d.sustainableMonthlyRate)}/mo`}
              >
                <span className="text-lg font-bold text-success">{formatCurrency(d.sustainableMonthlyRate)}/mo</span>
              </HelpTip>
              {' '}
              <span className="text-muted-foreground">sustainable wealth creation</span>
              <ScenarioDelta scenarioVal={d.sustainableMonthlyRate} baseVal={b.sustainableMonthlyRate} active={scenarioActive} />
            </p>

            {/* Row 2: Decomposition strip */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="text-center">
                <p className="text-[13px] font-semibold text-success tabular-nums">{formatCurrency(d.monthlyPrincipalPaydown)}/mo</p>
                <p className="text-[10px] text-muted-foreground">principal paydown</p>
              </div>
              <div className="text-center">
                <p className="text-[13px] font-semibold tabular-nums">{formatCurrency(d.monthlyAppreciation)}/mo</p>
                <p className="text-[10px] text-muted-foreground">appreciation (historical)</p>
              </div>
              <div className="text-center">
                <p className="text-[13px] font-semibold tabular-nums">{formatCurrency(d.monthlyRenoValue)}/mo</p>
                <p className="text-[10px] text-muted-foreground">reno value (to date)</p>
              </div>
            </div>

            {/* Row 3: Context line */}
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Historical avg: {formatCurrency(d.trueMonthlyWealthCreation)}/mo · includes {formatCurrency(d.monthlyAppreciation)}/mo market tailwind + {formatCurrency(d.monthlyRenoValue)}/mo renovation value
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
