import { formatCurrency } from '@/lib/format';
import { useMemo } from 'react';
import { HomePLData } from '@/hooks/useHomePL';
import { useAppContext } from '@/context/AppContext';
import { generateAmortizationSchedule } from '@/lib/amortization';
import ScenarioDelta from './ScenarioDelta';
import { HelpTip } from './HelpTip';
import { Link } from 'react-router-dom';

interface Props {
  d: HomePLData;
  baseD?: HomePLData;
  scenarioActive?: boolean;
}

export default function MonthlySnapshot({ d, baseD, scenarioActive = false }: Props) {
  const b = baseD || d;
  const { homePLConfig, mortgagePayments } = useAppContext();

  const netMonthly = d.sustainableMonthlyRate - d.monthlyCostOfOwnership;
  const baseNetMonthly = b.sustainableMonthlyRate - b.monthlyCostOfOwnership;

  const { mortgage } = useAppContext();

  // Current month's principal from latest payment
  const sorted = [...mortgagePayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  const currentPrincipal = sorted.length > 0 ? sorted[sorted.length - 1].principalPortion + sorted[sorted.length - 1].extraPrincipal : 0;

  // Forward projection for tooltip
  const projections = useMemo(() => {
    const amortRows = generateAmortizationSchedule(mortgage, sorted);
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentIdx = amortRows.findIndex(r => r.date === currentYM);
    const baseIdx = currentIdx >= 0 ? currentIdx : amortRows.findIndex(r => !r.isPast && !r.isCurrentMonth) - 1;
    const getPrincipalAt = (monthsAhead: number) => {
      const idx = baseIdx + monthsAhead;
      return (idx >= 0 && idx < amortRows.length) ? amortRows[idx].principalPortion : 0;
    };
    const firstPrincipal = sorted.length > 0 ? sorted[0].principalPortion + sorted[0].extraPrincipal : (amortRows.length > 0 ? amortRows[0].principalPortion : 0);
    return { principalIn5yr: getPrincipalAt(60), firstPrincipal };
  }, [mortgage, sorted]);

  // RentCast check
  const hasRentCast = (() => {
    try {
      const s = localStorage.getItem('casakat_rentcast_data');
      return s && JSON.parse(s)?.rentEstimate?.rent > 0;
    } catch { return false; }
  })();

  const assumedAppreciation = homePLConfig.tax?.annualAppreciation || 2;

  return (
    <div className="border-t border-border/30 bg-muted/20 py-1.5 px-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* 1. Housing cost/mo */}
        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold tabular-nums">
            <HelpTip
              plain="True monthly cost — only money gone forever (interest, tax, insurance, maintenance). Does NOT include principal since that builds equity."
              math={`Total sunk cost (${formatCurrency(d.sunkCost)}) ÷ months (${d.monthsOwned}) = ${formatCurrency(d.monthlyCostOfOwnership)}/mo`}
            >
              {formatCurrency(d.monthlyCostOfOwnership)}
            </HelpTip>
            <ScenarioDelta scenarioVal={d.monthlyCostOfOwnership} baseVal={b.monthlyCostOfOwnership} active={scenarioActive} />
          </p>
          <p className="text-[10px] text-muted-foreground">Housing cost/mo</p>
        </div>

        {/* 2. Principal this month */}
        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold tabular-nums text-success">
            <HelpTip
              plain={`This month's actual principal payment. Growing each month — was ~${formatCurrency(projections.firstPrincipal)}/mo at start, now ${formatCurrency(currentPrincipal)}/mo. By year 5: ~${formatCurrency(projections.principalIn5yr)}/mo.`}
            >
              {formatCurrency(currentPrincipal)}
            </HelpTip>
            <span className="text-[9px] text-success ml-0.5">↑</span>
          </p>
          <p className="text-[10px] text-muted-foreground">Principal this month</p>
          <p className="text-[9px] text-success">builds equity</p>
        </div>

        {/* 3. Net monthly */}
        <div className="text-center space-y-0.5">
          <p className={`text-sm font-bold tabular-nums ${netMonthly >= 0 ? 'text-success' : 'text-destructive'}`}>
            <HelpTip
              plain={netMonthly >= 0
                ? `After subtracting housing costs from your sustainable wealth creation rate, you're still gaining each month.`
                : `Housing costs exceed your sustainable wealth creation — but this gap narrows each year as more mortgage goes to principal.`}
              math={`Sustainable rate (${formatCurrency(d.sustainableMonthlyRate)}) − housing cost (${formatCurrency(d.monthlyCostOfOwnership)}) = ${netMonthly >= 0 ? '+' : ''}${formatCurrency(netMonthly)}`}
            >
              {netMonthly >= 0 ? '+' : ''}{formatCurrency(netMonthly)}
            </HelpTip>
            <ScenarioDelta scenarioVal={netMonthly} baseVal={baseNetMonthly} active={scenarioActive} />
          </p>
          <p className="text-[10px] text-muted-foreground">Net monthly</p>
        </div>

        {/* 4. Comparable rent */}
        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold tabular-nums text-muted-foreground">
            <HelpTip
              plain={hasRentCast
                ? "Monthly rent estimate from RentCast, based on comparable rentals in your area. Used in all rent-vs-own calculations."
                : "Manual rent estimate — connect RentCast for automatic market-based estimates."}
            >
              {formatCurrency(d.resolvedRent)}
            </HelpTip>
          </p>
          <p className="text-[10px] text-muted-foreground">Comparable rent</p>
          <p className="text-[9px] text-muted-foreground">{hasRentCast ? '(RentCast)' : '(manual)'}</p>
        </div>

        {/* 5. Appreciation */}
        <div className="text-center space-y-0.5">
          <Link to="/property#settings" className="text-sm font-bold tabular-nums text-muted-foreground hover:text-foreground transition-colors">
            <HelpTip
              plain="Conservative annual appreciation rate used for all forward projections (sustainable rate, breakeven, sell scenarios). Historical appreciation may differ. Change in My Property → Settings."
            >
              {assumedAppreciation}%/yr
            </HelpTip>
          </Link>
          <p className="text-[10px] text-muted-foreground">Appreciation</p>
        </div>
      </div>
    </div>
  );
}
