import { HomePLData } from '@/hooks/useHomePL';
import { HomePLConfig } from '@/context/AppContext';
import { RenovationProject, MortgageProfile } from '@/types';

export interface RentInvestResult {
  portfolioValue: number;
  totalRentPaid: number;
  monthlyOwnerCost: number;
  monthlyRent: number;
  monthlySavings: number;
  downPayment: number;
  ownerEquity: number;
  ownerSunkCost: number;
  ownershipMargin: number; // positive = owning wins
  startingRent: number;
}

export function calculateRentInvest(
  annualReturnPct: number,
  monthsOwned: number,
  downPayment: number,
  mortgage: MortgageProfile,
  homePLConfig: HomePLConfig,
  completedProjects: RenovationProject[],
  ownerEquity: number,
  ownerSunkCost: number,
  purchaseDate: string,
  resolvedRent?: number,
  extraMonthlyPrincipal?: number,
): RentInvestResult {
  const extraPrincipal = extraMonthlyPrincipal || 0;
  const monthlyMortgage = mortgage.monthlyPayment;
  const monthlyTax = homePLConfig.annualPropertyTax / 12;
  const monthlyInsurance = homePLConfig.monthlyInsurance;
  const monthlyMaintenance = homePLConfig.annualMaintenance / 12;
  const totalMonthlyOwnerCost = monthlyMortgage + monthlyTax + monthlyInsurance + monthlyMaintenance + homePLConfig.monthlyHOA + extraPrincipal;

  const monthlyRent = resolvedRent || homePLConfig.estimatedMonthlyRent;
  const rentIncreaseRate = (homePLConfig.tax?.annualRentIncrease || 3) / 100;
  const yearsOwned = monthsOwned / 12;

  // Back-calculate what rent was at purchase date
  const startingRent = monthlyRent / Math.pow(1 + rentIncreaseRate, yearsOwned);

  const monthlyReturnRate = Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;

  // Build reno cost by month map
  const renoCostByMonth: Record<string, number> = {};
  completedProjects.forEach(p => {
    if (p.dateCompleted) {
      const m = p.dateCompleted.substring(0, 7);
      renoCostByMonth[m] = (renoCostByMonth[m] || 0) + p.actualCost;
    }
  });

  // Parse purchase date
  const [pYear, pMonth] = purchaseDate.split('-').map(Number);
  const startMonth = pMonth - 1; // 0-indexed

  let portfolio = downPayment;
  let totalRentPaid = 0;
  let currentRent = startingRent;

  for (let i = 1; i <= monthsOwned; i++) {
    const y = pYear + Math.floor((startMonth + i) / 12);
    const m = (startMonth + i) % 12;
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;

    // Increase rent at the start of each new year of tenancy
    if (i > 1 && i % 12 === 1) {
      currentRent = currentRent * (1 + rentIncreaseRate);
    }

    totalRentPaid += currentRent;

    const renoCost = renoCostByMonth[key] || 0;
    const monthlySavingsThisMonth = totalMonthlyOwnerCost - currentRent;
    portfolio = portfolio * (1 + monthlyReturnRate) + monthlySavingsThisMonth + renoCost;
  }

  const monthlySavings = totalMonthlyOwnerCost - monthlyRent; // current month's savings for display

  return {
    portfolioValue: Math.round(portfolio),
    totalRentPaid: Math.round(totalRentPaid),
    monthlyOwnerCost: Math.round(totalMonthlyOwnerCost),
    monthlyRent,
    monthlySavings: Math.round(monthlySavings),
    downPayment,
    ownerEquity,
    ownerSunkCost: Math.round(ownerSunkCost),
    ownershipMargin: Math.round(ownerEquity - portfolio),
    startingRent: Math.round(startingRent),
  };
}

export function calculateSensitivityTable(
  rates: number[],
  monthsOwned: number,
  downPayment: number,
  mortgage: MortgageProfile,
  homePLConfig: HomePLConfig,
  completedProjects: RenovationProject[],
  ownerEquity: number,
  ownerSunkCost: number,
  purchaseDate: string,
) {
  return rates.map(rate => {
    const r = calculateRentInvest(rate, monthsOwned, downPayment, mortgage, homePLConfig, completedProjects, ownerEquity, ownerSunkCost, purchaseDate);
    return { rate, ...r };
  });
}
