import { useState } from 'react';
import { useHomePL } from '@/hooks/useHomePL';
import { applyScenario } from '@/lib/scenario';
import { TooltipProvider } from '@/components/ui/tooltip';
import AssumptionsEditor from '@/components/homepl/AssumptionsEditor';
import RefreshStatus from '@/components/homepl/RefreshStatus';
import ScenarioBanner from '@/components/homepl/ScenarioBanner';
import ValueSensitivitySlider from '@/components/homepl/ValueSensitivitySlider';
import VerdictHero from '@/components/homepl/VerdictHero';
import FinancialFlow from '@/components/homepl/FinancialFlow';
import CostEquityChart from '@/components/homepl/CostEquityChart';
import UnifiedComparison from '@/components/homepl/UnifiedComparison';
import DetailedBreakdown from '@/components/homepl/DetailedBreakdown';
import MonthlySnapshot from '@/components/homepl/MonthlySnapshot';
import IfYouSoldToday from '@/components/homepl/IfYouSoldToday';

export default function HomePL() {
  const baseD = useHomePL();
  const [scenarioPercent, setScenarioPercent] = useState(0);

  const scenario = applyScenario(baseD, scenarioPercent);
  const scenarioActive = scenarioPercent !== 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-5xl mx-auto">
        {/* Section 1 — Title bar */}
        <div className="flex items-center justify-between mb-1 px-1">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-foreground">Home P&L</h2>
              <RefreshStatus />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {baseD.monthsOwned} months of ownership · {baseD.purchaseDate.substring(0, 7)} — present
            </p>
          </div>
          <AssumptionsEditor />
        </div>

        {/* Section 2 — Scenario banner */}
        <div className="mb-2">
          <ScenarioBanner scenarioPercent={scenarioPercent} onReset={() => setScenarioPercent(0)} />
        </div>

        {/* Act 1: Headline */}
        <div className="space-y-2">
          <VerdictHero d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
          <ValueSensitivitySlider
            scenarioPercent={scenarioPercent}
            onChange={setScenarioPercent}
            modeledValue={scenario.currentHomeValue}
            baseValue={baseD.currentHomeValue}
          />
        </div>

        {/* Act 2: Proof — 20px gap */}
        <div className="mt-5 space-y-2">
          <FinancialFlow d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
          <CostEquityChart d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
        </div>

        {/* Act 3: Context — 20px gap */}
        <div className="mt-5">
          <UnifiedComparison d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
        </div>

        {/* Act 4: Deep dive — 20px gap */}
        <div className="mt-5 space-y-2">
          <DetailedBreakdown d={scenario} />
          <MonthlySnapshot d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
        </div>
      </div>
    </TooltipProvider>
  );
}
