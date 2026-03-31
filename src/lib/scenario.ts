import { HomePLData } from '@/hooks/useHomePL';

export interface ScenarioResult extends HomePLData {
  isScenario: boolean;
  scenarioPercent: number;
  modeledHomeValue: number;
  isUnderwater: boolean;
  extraMonthlyPrincipal: number;
  extraPrincipalInterestSaved: number;
  extraPrincipalYearsSaved: number;
  interestSavedPerMonth: number;
  adjustedPayoffMonths: number;
  adjustedTotalInterest: number;
  adjustedSustainableRate: number;
}

export function applyScenario(d: HomePLData, pct: number, extraPrincipal: number = 0): ScenarioResult {
  const modeledHomeValue = pct === 0 ? d.currentHomeValue : Math.round(d.currentHomeValue * (1 + pct / 100));
  const wealthBuilt = modeledHomeValue - d.currentBalance;
  const isUnderwater = wealthBuilt < 0;
  const marketAppreciation = modeledHomeValue - d.purchasePrice - d.totalRenoValueAdded;
  const marketDependentEquity = marketAppreciation + d.totalRenoValueAdded;
  const guaranteedEquity = d.guaranteedEquity;

  const totalCashOut = d.totalCashOut;
  const equityBuildingSpend = d.equityBuildingSpend;
  const sunkCost = d.sunkCost;
  const equityBuildingPct = d.equityBuildingPct;
  const sunkCostPct = d.sunkCostPct;

  const cashBeyondDown = totalCashOut - d.downPayment;
  const netWealthCreated = wealthBuilt - d.downPayment;
  const returnOnCash = cashBeyondDown > 0 ? (netWealthCreated / cashBeyondDown) * 100 : 0;

  const ownershipAdvantage = d.renterSunkCost - d.ownerSunkCost + wealthBuilt;
  const monthlyWealthCreation = d.monthsOwned > 0 ? wealthBuilt / d.monthsOwned : 0;

  const monthlyPrincipalPaydown = d.monthlyPrincipalPaydown;
  const monthlyAppreciationScenario = d.monthsOwned > 0 ? marketAppreciation / d.monthsOwned : 0;
  const monthlyRenoValue = d.monthlyRenoValue;
  const trueMonthlyWealthCreation = monthlyPrincipalPaydown + monthlyAppreciationScenario + monthlyRenoValue;
  const downPaymentMonthlyEquivalent = d.downPaymentMonthlyEquivalent;

  // Sustainable rate with assumed appreciation on modeled value
  const assumedAppreciation = d.assumedAppreciation || 2;
  const sustainableMonthlyAppreciation = (modeledHomeValue * (assumedAppreciation / 100)) / 12;
  const basePrincipalComponent = d.sustainableMonthlyRate - (d.currentHomeValue * (assumedAppreciation / 100)) / 12;
  const sustainableMonthlyRate = basePrincipalComponent + extraPrincipal + sustainableMonthlyAppreciation;

  // Extra principal impact calculation
  let extraPrincipalInterestSaved = 0;
  let extraPrincipalYearsSaved = 0;
  let adjustedPayoffMonths = 0;
  let adjustedTotalInterest = 0;

  if (extraPrincipal > 0 && d.interestRate > 0 && d.monthlyPayment > 0) {
    const rate = d.interestRate / 100 / 12;
    let balanceBase = d.currentBalance;
    let balanceExtra = d.currentBalance;
    let baseMonths = 0;
    let extraMonths = 0;
    let baseInterest = 0;
    let extraInterest = 0;
    const monthlyPI = d.monthlyPayment;

    while (balanceBase > 0 && baseMonths < 360) {
      const interest = balanceBase * rate;
      const totalPayment = monthlyPI;
      const principal = Math.min(totalPayment - interest, balanceBase);
      balanceBase = Math.max(0, balanceBase - principal);
      baseInterest += interest;
      baseMonths++;
    }

    while (balanceExtra > 0 && extraMonths < 360) {
      const interest = balanceExtra * rate;
      const totalPayment = monthlyPI + extraPrincipal;
      const principal = Math.min(totalPayment - interest, balanceExtra);
      balanceExtra = Math.max(0, balanceExtra - principal);
      extraInterest += interest;
      extraMonths++;
    }

    adjustedPayoffMonths = extraMonths;
    adjustedTotalInterest = extraInterest;
    extraPrincipalInterestSaved = baseInterest - extraInterest;
    extraPrincipalYearsSaved = Math.round((baseMonths - extraMonths) / 12 * 10) / 10;
  }

  const baseMonthlyInterest = extraPrincipal > 0 && d.interestRate > 0 ? (function() {
    const rate = d.interestRate / 100 / 12;
    let bal = d.currentBalance; let months = 0; let totalInt = 0;
    while (bal > 0 && months < 360) { const i = bal * rate; const p = Math.min(d.monthlyPayment - i, bal); bal = Math.max(0, bal - p); totalInt += i; months++; }
    return months > 0 ? totalInt / months : 0;
  })() : 0;
  const extraMonthlyInterest = adjustedPayoffMonths > 0 ? adjustedTotalInterest / adjustedPayoffMonths : 0;
  const interestSavedPerMonth = baseMonthlyInterest - extraMonthlyInterest;

  const adjustedSustainableRate = sustainableMonthlyRate;

  const isScenario = pct !== 0 || extraPrincipal > 0;

  return {
    ...d,
    currentHomeValue: pct === 0 ? d.currentHomeValue : modeledHomeValue,
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
    isScenario,
    scenarioPercent: pct,
    modeledHomeValue,
    isUnderwater,
    extraMonthlyPrincipal: extraPrincipal,
    extraPrincipalInterestSaved,
    extraPrincipalYearsSaved,
    interestSavedPerMonth,
    adjustedPayoffMonths,
    adjustedTotalInterest,
    adjustedSustainableRate,
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
