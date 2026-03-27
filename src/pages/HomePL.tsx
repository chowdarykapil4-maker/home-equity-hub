import { useState } from 'react';
import { useHomePL } from '@/hooks/useHomePL';
import { applyScenario } from '@/lib/scenario';
import AssumptionsEditor from '@/components/homepl/AssumptionsEditor';
import RefreshStatus from '@/components/homepl/RefreshStatus';
import ScenarioBanner from '@/components/homepl/ScenarioBanner';
import ValueSensitivitySlider from '@/components/homepl/ValueSensitivitySlider';
import VerdictHero from '@/components/homepl/VerdictHero';
import MoneyFlowBar from '@/components/homepl/MoneyFlowBar';
import EquityComposition from '@/components/homepl/EquityComposition';
import OwnVsRent from '@/components/homepl/OwnVsRent';
import RentVsInvest from '@/components/homepl/RentVsInvest';
import DetailedBreakdown from '@/components/homepl/DetailedBreakdown';
import CostEquityChart from '@/components/homepl/CostEquityChart';
import MonthlySnapshot from '@/components/homepl/MonthlySnapshot';

export default function HomePL() {
  const baseD = useHomePL();
  const [scenarioPercent, setScenarioPercent] = useState(0);

  const scenario = applyScenario(baseD, scenarioPercent);
  const scenarioActive = scenarioPercent !== 0;

  return (
    <div className="space-y-2.5 max-w-5xl mx-auto">
      {/* Section 1 — Title bar */}
      <div className="flex items-center justify-between mb-1">
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

      {/* Scenario banner */}
      <ScenarioBanner scenarioPercent={scenarioPercent} onReset={() => setScenarioPercent(0)} />

      <VerdictHero d={scenario} baseD={baseD} scenarioActive={scenarioActive} />

      {/* Value Sensitivity Slider */}
      <ValueSensitivitySlider
        scenarioPercent={scenarioPercent}
        onChange={setScenarioPercent}
        modeledValue={scenario.currentHomeValue}
        baseValue={baseD.currentHomeValue}
      />

      <MoneyFlowBar d={scenario} />
      <EquityComposition d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
      <OwnVsRent d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
      <RentVsInvest d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
      <DetailedBreakdown d={scenario} />
      <CostEquityChart d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
      <MonthlySnapshot d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
    </div>
  );
}
