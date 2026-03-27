import { useHomePL } from '@/hooks/useHomePL';
import AssumptionsEditor from '@/components/homepl/AssumptionsEditor';
import VerdictHero from '@/components/homepl/VerdictHero';
import MoneyFlowBar from '@/components/homepl/MoneyFlowBar';
import EquityComposition from '@/components/homepl/EquityComposition';
import OwnVsRent from '@/components/homepl/OwnVsRent';
import DetailedBreakdown from '@/components/homepl/DetailedBreakdown';
import CostEquityChart from '@/components/homepl/CostEquityChart';
import MonthlySnapshot from '@/components/homepl/MonthlySnapshot';

export default function HomePL() {
  const d = useHomePL();

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Section 1 — Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">Home P&L</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {d.monthsOwned} months of ownership · {d.purchaseDate.substring(0, 7)} — present
          </p>
        </div>
        <AssumptionsEditor />
      </div>

      {/* Section 2 — Verdict hero */}
      <VerdictHero d={d} />

      {/* Section 3 — Money flow */}
      <MoneyFlowBar d={d} />

      {/* Section 4 — Equity composition */}
      <EquityComposition d={d} />

      {/* Section 5 — Own vs rent */}
      <OwnVsRent d={d} />

      {/* Section 6 — Collapsible detail */}
      <DetailedBreakdown d={d} />

      {/* Section 7 — Chart */}
      <CostEquityChart d={d} />

      {/* Section 8 — Monthly snapshot */}
      <MonthlySnapshot d={d} />
    </div>
  );
}
