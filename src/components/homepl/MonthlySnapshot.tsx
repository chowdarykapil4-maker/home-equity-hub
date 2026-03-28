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

  const monthlyNetGain = d.monthlyWealthCreation - d.monthlyCostOfOwnership;
  const baseNetGain = b.monthlyWealthCreation - b.monthlyCostOfOwnership;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-2.5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Monthly housing cost */}
        <div className="text-center space-y-0.5">
          <p className="text-base font-bold tabular-nums">
            <HelpTip
              plain="Your true monthly cost of living in this home — only counting money that's gone forever"
              math={`Total sunk cost (${formatCurrency(d.sunkCost)}) ÷ months owned (${d.monthsOwned}) = ${formatCurrency(d.monthlyCostOfOwnership)}/mo`}
              context="This does NOT include principal payments because those build your equity"
            >
              {formatCurrency(d.monthlyCostOfOwnership)}
            </HelpTip>
            <ScenarioDelta scenarioVal={d.monthlyCostOfOwnership} baseVal={b.monthlyCostOfOwnership} active={scenarioActive} />
          </p>
          <p className="text-[11px] text-muted-foreground">Monthly housing cost</p>
        </div>

        {/* Monthly wealth creation */}
        <div className="text-center space-y-0.5">
          <p className="text-base font-bold tabular-nums text-success">
            <HelpTip
              plain="Your net worth grows by this much every month on average from owning this home"
              math={`Total equity (${formatCurrency(d.wealthBuilt)}) ÷ months owned (${d.monthsOwned}) = ${formatCurrency(d.monthlyWealthCreation)}/mo`}
              context="Includes appreciation, principal paydown, and renovation value — all forms of wealth building"
            >
              {formatCurrency(d.monthlyWealthCreation)}
            </HelpTip>
            <ScenarioDelta scenarioVal={d.monthlyWealthCreation} baseVal={b.monthlyWealthCreation} active={scenarioActive} />
          </p>
          <p className="text-[11px] text-muted-foreground">Monthly wealth creation</p>
        </div>

        {/* Net monthly gain */}
        <div className="text-center space-y-0.5">
          <p className={`text-base font-bold tabular-nums ${monthlyNetGain >= 0 ? 'text-success' : 'text-destructive'}`}>
            <HelpTip
              plain={monthlyNetGain >= 0
                ? `After subtracting your monthly housing costs, you're still gaining ${formatCurrency(monthlyNetGain)} in net wealth every month`
                : `Your monthly housing costs exceed your wealth creation by ${formatCurrency(Math.abs(monthlyNetGain))}`}
              math={`Monthly wealth creation (${formatCurrency(d.monthlyWealthCreation)}) − monthly housing cost (${formatCurrency(d.monthlyCostOfOwnership)}) = ${monthlyNetGain >= 0 ? '+' : ''}${formatCurrency(monthlyNetGain)}`}
            >
              {monthlyNetGain >= 0 ? '+' : ''}{formatCurrency(monthlyNetGain)}
            </HelpTip>
            <ScenarioDelta scenarioVal={monthlyNetGain} baseVal={baseNetGain} active={scenarioActive} />
          </p>
          <p className="text-[11px] text-muted-foreground">Net monthly gain</p>
        </div>

        {/* Equivalent rent */}
        <div className="text-center space-y-0.5">
          <p className="text-base font-bold tabular-nums text-muted-foreground">
            <HelpTip
              plain="What a comparable home would cost to rent. A renter pays this amount with $0 equity to show for it."
            >
              {formatCurrency(homePLConfig.estimatedMonthlyRent)}
            </HelpTip>
          </p>
          <p className="text-[11px] text-muted-foreground">Equivalent rent</p>
        </div>
      </div>
    </div>
  );
}
