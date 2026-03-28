import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';
import { useAppContext } from '@/context/AppContext';
import ScenarioDelta from './ScenarioDelta';
import { HelpTip } from './HelpTip';

interface Props {
  d: HomePLData;
  baseD?: HomePLData;
  scenarioActive?: boolean;
}

export default function MonthlySnapshot({ d, baseD, scenarioActive = false }: Props) {
  const b = baseD || d;
  const { homePLConfig } = useAppContext();

  const monthlyNetGain = d.trueMonthlyWealthCreation - d.monthlyCostOfOwnership;
  const baseNetGain = b.trueMonthlyWealthCreation - b.monthlyCostOfOwnership;

  return (
    <div className="border-t border-border/30 bg-muted/20 py-1.5 px-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold tabular-nums">
            <HelpTip
              plain="True monthly cost — only money gone forever (interest, tax, insurance, maintenance)"
              math={`Total sunk cost (${formatCurrency(d.sunkCost)}) ÷ months (${d.monthsOwned}) = ${formatCurrency(d.monthlyCostOfOwnership)}/mo`}
              context="Does NOT include principal payments since those build equity"
            >
              {formatCurrency(d.monthlyCostOfOwnership)}
            </HelpTip>
            <ScenarioDelta scenarioVal={d.monthlyCostOfOwnership} baseVal={b.monthlyCostOfOwnership} active={scenarioActive} />
          </p>
          <p className="text-[10px] text-muted-foreground">Monthly housing cost</p>
        </div>

        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold tabular-nums text-success">
            <HelpTip
              plain="Actual new wealth generated monthly, excluding your down payment transfer"
              math={`Principal (${formatCurrency(d.monthlyPrincipalPaydown)}) + appreciation (${formatCurrency(d.monthlyAppreciation)}) + reno value (${formatCurrency(d.monthlyRenoValue)}) = ${formatCurrency(d.trueMonthlyWealthCreation)}/mo`}
            >
              {formatCurrency(d.trueMonthlyWealthCreation)}
            </HelpTip>
            <ScenarioDelta scenarioVal={d.trueMonthlyWealthCreation} baseVal={b.trueMonthlyWealthCreation} active={scenarioActive} />
          </p>
          <p className="text-[10px] text-muted-foreground">Monthly wealth creation</p>
        </div>

        <div className="text-center space-y-0.5">
          <p className={`text-sm font-bold tabular-nums ${monthlyNetGain >= 0 ? 'text-success' : 'text-destructive'}`}>
            <HelpTip
              plain={monthlyNetGain >= 0
                ? `After subtracting housing costs, you still gain ${formatCurrency(monthlyNetGain)} monthly.`
                : `Housing costs exceed true wealth creation by ${formatCurrency(Math.abs(monthlyNetGain))}/mo — but this gap narrows each year as more mortgage goes to principal.`}
              math={`Wealth creation (${formatCurrency(d.trueMonthlyWealthCreation)}) − housing cost (${formatCurrency(d.monthlyCostOfOwnership)}) = ${monthlyNetGain >= 0 ? '+' : ''}${formatCurrency(monthlyNetGain)}`}
            >
              {monthlyNetGain >= 0 ? '+' : ''}{formatCurrency(monthlyNetGain)}
            </HelpTip>
            <ScenarioDelta scenarioVal={monthlyNetGain} baseVal={baseNetGain} active={scenarioActive} />
          </p>
          <p className="text-[10px] text-muted-foreground">Net monthly gain</p>
        </div>

        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold tabular-nums text-muted-foreground">
            <HelpTip plain="What a comparable home costs to rent. A renter pays this with $0 equity to show for it.">
              {formatCurrency(homePLConfig.estimatedMonthlyRent)}
            </HelpTip>
          </p>
          <p className="text-[10px] text-muted-foreground">Equivalent rent</p>
        </div>

        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold tabular-nums text-muted-foreground">
            <HelpTip
              plain="Estimated ongoing monthly wealth creation based on your current principal paydown rate and assumed annual appreciation — excludes renovation value since projects are episodic"
              math={`Current principal (~${formatCurrency(d.sustainableMonthlyRate - ((d.sustainableMonthlyRate - d.monthlyPrincipalPaydown) || 0))}/mo) + appreciation (~${formatCurrency(d.sustainableMonthlyRate - d.monthlyPrincipalPaydown > 0 ? d.sustainableMonthlyRate - d.monthlyPrincipalPaydown : 0)}/mo) = ${formatCurrency(d.sustainableMonthlyRate)}/mo`}
            >
              {formatCurrency(d.sustainableMonthlyRate)}
            </HelpTip>
            <ScenarioDelta scenarioVal={d.sustainableMonthlyRate} baseVal={b.sustainableMonthlyRate} active={scenarioActive} />
          </p>
          <p className="text-[10px] text-muted-foreground">Sustainable rate</p>
        </div>
      </div>
    </div>
  );
}
