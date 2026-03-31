import { formatCurrency, formatPercent } from '@/lib/format';
import { TrendingUp } from 'lucide-react';
import { HomePLData } from '@/hooks/useHomePL';
import { useAppContext } from '@/context/AppContext';
import { useMemo } from 'react';
import ScenarioDelta from './ScenarioDelta';
import AdvantageBreakdown from './AdvantageBreakdown';
import { HelpTip } from './HelpTip';
import { generateAmortizationSchedule } from '@/lib/amortization';
import { isARM } from '@/types';
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
  const { homePLConfig, mortgage, mortgagePayments } = useAppContext();

  const assumedAppreciation = homePLConfig.tax?.annualAppreciation || 2;
  const sustainableMonthlyAppreciation = (d.currentHomeValue * (assumedAppreciation / 100)) / 12;
  const currentMonthlyPrincipal = d.sustainableMonthlyRate - sustainableMonthlyAppreciation;

  // Generate amortization schedule for forward projections
  const projections = useMemo(() => {
    const sorted = [...mortgagePayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
    const amortRows = generateAmortizationSchedule(mortgage, sorted);

    // Find current month row index
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentIdx = amortRows.findIndex(r => r.date === currentYM);
    const baseIdx = currentIdx >= 0 ? currentIdx : amortRows.findIndex(r => !r.isPast && !r.isCurrentMonth) - 1;

    const getPrincipalAt = (monthsAhead: number) => {
      const idx = baseIdx + monthsAhead;
      if (idx >= 0 && idx < amortRows.length) {
        return amortRows[idx].principalPortion;
      }
      return 0;
    };

    const firstPrincipal = sorted.length > 0 ? sorted[0].principalPortion + sorted[0].extraPrincipal : (amortRows.length > 0 ? amortRows[0].principalPortion : 0);

    return {
      principalIn1yr: getPrincipalAt(12),
      principalIn3yr: getPrincipalAt(36),
      principalIn5yr: getPrincipalAt(60),
      firstPrincipal,
    };
  }, [mortgage, mortgagePayments]);

  const sustainableIn1yr = projections.principalIn1yr + sustainableMonthlyAppreciation;
  const sustainableIn3yr = projections.principalIn3yr + sustainableMonthlyAppreciation;
  const sustainableIn5yr = projections.principalIn5yr + sustainableMonthlyAppreciation;

  const armNote = isARM(mortgage.loanType) && mortgage.armResetDate
    ? `\nNote: projections beyond ${mortgage.armResetDate} depend on your ARM reset rate.`
    : '';

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

          {/* How you're building wealth — decomposition */}
          <div className="mt-3 pt-3 border-t border-success/20">
            {/* Row 1: Sustainable rate headline */}
            <p className="text-sm text-foreground">
              <HelpTip
                plain={`Monthly wealth you can count on — and it grows every month. As your mortgage amortizes, more of each payment goes to principal and less to interest.${armNote}`}
                math={`Today: ${formatCurrency(d.sustainableMonthlyRate)}/mo (${formatCurrency(currentMonthlyPrincipal)} principal + ${formatCurrency(sustainableMonthlyAppreciation)} appreciation)\nIn 1 year: ~${formatCurrency(sustainableIn1yr)}/mo\nIn 3 years: ~${formatCurrency(sustainableIn3yr)}/mo\nIn 5 years: ~${formatCurrency(sustainableIn5yr)}/mo`}
              >
                <span className="text-lg font-bold text-success">{formatCurrency(d.sustainableMonthlyRate)}/mo</span>
              </HelpTip>
              {' '}
              <span className="text-muted-foreground">sustainable wealth creation</span>
              <span className="text-[11px] text-success ml-1">↑ growing</span>
              <ScenarioDelta scenarioVal={d.sustainableMonthlyRate} baseVal={b.sustainableMonthlyRate} active={scenarioActive} />
            </p>

            {/* Row 2: Decomposition strip */}
            <div className="grid grid-cols-3 text-center gap-2 mt-2">
              <div className="text-center">
                <HelpTip
                  plain={`Your principal payment grows every month due to amortization. Started at ~${formatCurrency(projections.firstPrincipal)}/mo, now ${formatCurrency(currentMonthlyPrincipal)}/mo. In 1 year: ~${formatCurrency(projections.principalIn1yr)}/mo, in 3 years: ~${formatCurrency(projections.principalIn3yr)}/mo.${armNote}`}
                >
                  <p className="text-[13px] font-semibold text-success tabular-nums">{formatCurrency(d.monthlyPrincipalPaydown)}/mo</p>
                </HelpTip>
                <p className="text-[10px] text-muted-foreground">principal paydown ↑</p>
              </div>
              <div className="text-center">
                <HelpTip
                  plain={`Average monthly home value increase based on actual appreciation since purchase. Past performance — forward projections use a conservative ${assumedAppreciation}%/yr.`}
                >
                  <p className="text-[13px] font-semibold text-amber-500 tabular-nums">{formatCurrency(d.monthlyAppreciation)}/mo</p>
                </HelpTip>
                <p className="text-[10px] text-muted-foreground">appreciation (historical)</p>
              </div>
              <div className="text-center">
                <HelpTip
                  plain="Value recovered from completed renovation projects, averaged over months owned. Only counts finished projects with actual costs — no projections from planned work."
                >
                  <p className="text-[13px] font-semibold text-teal-500 tabular-nums">{formatCurrency(d.monthlyRenoValue)}/mo</p>
                </HelpTip>
                <p className="text-[10px] text-muted-foreground">reno value (to date)</p>
              </div>
            </div>

            {/* Row 3: Context line */}
            <p className="text-[10px] text-muted-foreground mt-1">
              Historical avg: {formatCurrency(d.trueMonthlyWealthCreation)}/mo · includes {formatCurrency(d.monthlyAppreciation)}/mo market tailwind + {formatCurrency(d.monthlyRenoValue)}/mo renovation value
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
