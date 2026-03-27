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
    <div className="space-y-2.5 max-w-5xl mx-auto">
      {/* Section 1 — Title bar */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-lg font-medium text-foreground">Home P&L</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {d.monthsOwned} months of ownership · {d.purchaseDate.substring(0, 7)} — present
          </p>
        </div>
        <AssumptionsEditor />
      </div>

      <VerdictHero d={d} />
      <MoneyFlowBar d={d} />
      <EquityComposition d={d} />
      <OwnVsRent d={d} />
      <DetailedBreakdown d={d} />
      <CostEquityChart d={d} />
      <MonthlySnapshot d={d} />
    </div>
  );
}
