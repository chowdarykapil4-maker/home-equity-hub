import { HomePLData } from '@/hooks/useHomePL';

export interface ScenarioResult extends HomePLData {
  isScenario: boolean;
  scenarioPercent: number;
  modeledHomeValue: number;
  isUnderwater: boolean;
}

export function applyScenario(d: HomePLData, pct: number): ScenarioResult {
  if (pct === 0) {
    return {
      ...d,
      isScenario: false,
      scenarioPercent: 0,
      modeledHomeValue: d.currentHomeValue,
      isUnderwater: false,
    };
  }

  const modeledHomeValue = Math.round(d.currentHomeValue * (1 + pct / 100));
  const wealthBuilt = modeledHomeValue - d.currentBalance;
  const isUnderwater = wealthBuilt < 0;
  const marketAppreciation = modeledHomeValue - d.purchasePrice - d.totalRenoValueAdded;
  const marketDependentEquity = marketAppreciation + d.totalRenoValueAdded;
  const guaranteedEquity = d.guaranteedEquity; // unchanged

  // Recalculate downstream values
  const totalCashOut = d.totalCashOut; // unchanged - actual spend
  const equityBuildingSpend = d.equityBuildingSpend; // unchanged
  const sunkCost = d.sunkCost; // unchanged
  const equityBuildingPct = d.equityBuildingPct; // unchanged
  const sunkCostPct = d.sunkCostPct; // unchanged

  const cashBeyondDown = totalCashOut - d.downPayment;
  const netWealthCreated = wealthBuilt - d.downPayment;
  const returnOnCash = cashBeyondDown > 0 ? (netWealthCreated / cashBeyondDown) * 100 : 0;

  const ownershipAdvantage = d.renterSunkCost - d.ownerSunkCost + wealthBuilt;
  const monthlyWealthCreation = d.monthsOwned > 0 ? wealthBuilt / d.monthsOwned : 0;

  // Decomposed monthly metrics
  const monthlyPrincipalPaydown = d.monthlyPrincipalPaydown; // unchanged
  const monthlyAppreciationScenario = d.monthsOwned > 0 ? marketAppreciation / d.monthsOwned : 0;
  const monthlyRenoValue = d.monthlyRenoValue; // unchanged
  const trueMonthlyWealthCreation = monthlyPrincipalPaydown + monthlyAppreciationScenario + monthlyRenoValue;
  const downPaymentMonthlyEquivalent = d.downPaymentMonthlyEquivalent; // unchanged

  // Sustainable rate recalculates with modeled appreciation
  const assumedAppreciation = 3;
  const sustainableMonthlyAppreciation = (modeledHomeValue * (assumedAppreciation / 100)) / 12;
  const sustainableMonthlyRate = d.monthlyPrincipalPaydown + sustainableMonthlyAppreciation;

  return {
    ...d,
    currentHomeValue: modeledHomeValue,
    wealthBuilt,
    marketAppreciation,
    marketDependentEquity,
    guaranteedEquity,
    returnOnCash,
    netWealthCreated,
    ownershipAdvantage,
    monthlyWealthCreation,
    monthlyPrincipalPaydown,
    monthlyAppreciation: monthlyAppreciationScenario,
    monthlyRenoValue,
    trueMonthlyWealthCreation,
    downPaymentMonthlyEquivalent,
    sustainableMonthlyRate,
    isScenario: true,
    scenarioPercent: pct,
    modeledHomeValue,
    isUnderwater,
  };
}

export function formatDelta(scenarioVal: number, baseVal: number): { text: string; color: string } | null {
  const diff = scenarioVal - baseVal;
  if (Math.abs(diff) < 1) return null;
  const absDiff = Math.abs(diff);
  const formatted = absDiff >= 1000
    ? `$${(absDiff / 1000).toFixed(0)}K`
    : `$${absDiff.toFixed(0)}`;
  if (diff > 0) return { text: `↑${formatted}`, color: 'text-success' };
  return { text: `↓${formatted}`, color: 'text-destructive' };
}
