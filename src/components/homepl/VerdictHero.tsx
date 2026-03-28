import { formatCurrency, formatPercent } from '@/lib/format';
import { TrendingUp } from 'lucide-react';
import { HomePLData } from '@/hooks/useHomePL';
import ScenarioDelta from './ScenarioDelta';
import AdvantageBreakdown from './AdvantageBreakdown';
import { HelpTip } from './HelpTip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-success/20 bg-success/[0.04] px-4 pt-3 pb-2">
        <div className="text-center space-y-0.5">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            Ownership advantage over renting
          </p>
          <div className="flex items-center justify-center gap-1">
            <AdvantageBreakdown d={d} scenarioActive={scenarioActive} />
            <ScenarioDelta scenarioVal={d.ownershipAdvantage} baseVal={b.ownershipAdvantage} active={scenarioActive} />
          </div>
          <p className="text-sm text-muted-foreground">
            You're building{' '}
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline cursor-help border-b border-dotted border-muted-foreground/30 hover:border-muted-foreground transition-colors">
                  <span className="font-semibold text-foreground">{formatCurrency(d.trueMonthlyWealthCreation)}/mo</span>
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="center" className="w-[360px] p-3 rounded-xl shadow-md z-[100]">
                <div className="space-y-2">
                  <p className="text-xs font-medium">Monthly Wealth Creation Breakdown</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Actual wealth generated each month on average — excludes your down payment which was a transfer of existing cash, not new wealth creation.
                  </p>
                  <div className="border-t border-border pt-1.5 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal paydown</span>
                      <span className="tabular-nums text-success">{formatCurrency(d.monthlyPrincipalPaydown)}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Appreciation</span>
                      <span className="tabular-nums">{formatCurrency(d.monthlyAppreciation)}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reno value</span>
                      <span className="tabular-nums">{formatCurrency(d.monthlyRenoValue)}/mo</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-border pt-1">
                      <span>True wealth creation</span>
                      <span className="tabular-nums text-success">{formatCurrency(d.trueMonthlyWealthCreation)}/mo</span>
                    </div>
                  </div>
                  <div className="bg-accent/50 rounded px-2 py-1.5 text-[10px] text-muted-foreground leading-relaxed">
                    Note: Your {formatCurrency(d.downPayment)} down payment adds {formatCurrency(d.downPaymentMonthlyEquivalent)}/mo when averaged, but that was existing cash moved into the home — not new wealth.
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {' '}in wealth that a renter never would
            <ScenarioDelta scenarioVal={d.trueMonthlyWealthCreation} baseVal={b.trueMonthlyWealthCreation} active={scenarioActive} />
          </p>

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
        </div>
      </div>
    </TooltipProvider>
  );
}
