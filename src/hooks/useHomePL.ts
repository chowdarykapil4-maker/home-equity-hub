import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getEstimatedValueAdded, calculateBlendedValue } from '@/types';

export interface HomePLData {
  // Inputs
  purchasePrice: number;
  loanAmount: number;
  downPayment: number;
  monthsOwned: number;
  yearsOwned: number;
  purchaseDate: string;
  currentHomeValue: number;
  currentBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalRenoSpend: number;
  totalRenoValueAdded: number;
  netRenoCost: number;
  renoRecoveryPct: number;

  // Ownership costs
  totalPropertyTax: number;
  totalInsurance: number;
  totalHOA: number;
  totalMaintenance: number;

  // Section 1 — Big picture
  totalCashInvested: number;
  wealthBuilt: number; // equity
  returnOnCash: number; // pct
  netWealthCreated: number;

  // Section 2 — Money out
  totalCashOut: number;
  equityBuildingSpend: number;
  sunkCost: number;
  equityBuildingPct: number;
  sunkCostPct: number;

  // Section 3 — Wealth built / Equity
  marketAppreciation: number;
  guaranteedEquity: number;
  marketDependentEquity: number;

  // Section 4 — Sunk cost ledger
  monthlyCostOfOwnership: number;

  // Section 5 — vs renting
  totalRentWouldHavePaid: number;
  ownerSunkCost: number;
  renterSunkCost: number;
  ownershipAdvantage: number;
  monthlyWealthCreation: number;
  sunkCostDiff: number;

  // Chart data
  chartData: { month: string; sunkCost: number; equity: number; rent: number }[];
  crossoverMonth: string | null;
}

export function useHomePL(): HomePLData {
  const { property, projects, mortgage, mortgagePayments, valueEntries, homePLConfig } = useAppContext();

  return useMemo(() => {
    const purchasePrice = property.purchasePrice;
    const loanAmount = mortgage.originalLoanAmount;
    const downPayment = purchasePrice - loanAmount;
    const purchaseDate = property.purchaseDate;

    const now = new Date();
    // Parse purchase date parts directly to avoid timezone issues with Date constructor
    const [pYear, pMonth] = purchaseDate.split('-').map(Number);
    const monthsOwned = Math.max(0, (now.getFullYear() - pYear) * 12 + (now.getMonth() + 1 - pMonth));
    const yearsOwned = monthsOwned / 12;

    // Home value
    const { value: blendedValue } = calculateBlendedValue(valueEntries);
    const currentHomeValue = blendedValue > 0 ? blendedValue : property.currentEstimatedValue;

    // Mortgage
    const sorted = [...mortgagePayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
    const currentBalance = sorted.length > 0 ? sorted[sorted.length - 1].remainingBalance : mortgage.originalLoanAmount;
    const principalPaid = sorted.reduce((s, p) => s + p.principalPortion + p.extraPrincipal, 0);
    const interestPaid = sorted.reduce((s, p) => s + p.interestPortion, 0);

    // Renovations
    const completeProjects = projects.filter(p => p.status === 'Complete');
    const totalRenoSpend = completeProjects.reduce((s, p) => s + p.actualCost, 0);
    const totalRenoValueAdded = completeProjects.reduce((s, p) => s + getEstimatedValueAdded(p), 0);
    const netRenoCost = totalRenoSpend - totalRenoValueAdded;
    const renoRecoveryPct = totalRenoSpend > 0 ? (totalRenoValueAdded / totalRenoSpend) * 100 : 0;

    // Ownership costs (rolling months)
    const totalPropertyTax = homePLConfig.annualPropertyTax * yearsOwned;
    const totalInsurance = homePLConfig.monthlyInsurance * monthsOwned;
    const totalHOA = homePLConfig.monthlyHOA * monthsOwned;
    const totalMaintenance = homePLConfig.annualMaintenance * yearsOwned;

    // Section 1
    const totalCashInvested = downPayment + principalPaid + totalRenoSpend + totalPropertyTax + totalInsurance + totalMaintenance + totalHOA + interestPaid;
    const wealthBuilt = currentHomeValue - currentBalance;
    const cashBeyondDown = totalCashInvested - downPayment;
    const netWealthCreated = wealthBuilt - downPayment;
    const returnOnCash = cashBeyondDown > 0 ? (netWealthCreated / cashBeyondDown) * 100 : 0;

    // Section 2
    const totalCashOut = totalCashInvested;
    const equityBuildingSpend = downPayment + principalPaid + totalRenoValueAdded;
    const sunkCost = interestPaid + totalPropertyTax + totalInsurance + totalHOA + totalMaintenance + netRenoCost;
    const equityBuildingPct = totalCashOut > 0 ? (equityBuildingSpend / totalCashOut) * 100 : 0;
    const sunkCostPct = totalCashOut > 0 ? (sunkCost / totalCashOut) * 100 : 0;

    // Section 3
    const marketAppreciation = currentHomeValue - purchasePrice - totalRenoValueAdded;
    const guaranteedEquity = downPayment + principalPaid;
    const marketDependentEquity = marketAppreciation + totalRenoValueAdded;

    // Section 4
    const monthlyCostOfOwnership = paidMonthsOwned > 0 ? sunkCost / paidMonthsOwned : 0;

    // Section 5
    const totalRentWouldHavePaid = homePLConfig.estimatedMonthlyRent * monthsOwned;
    const ownerSunkCost = sunkCost;
    const renterSunkCost = totalRentWouldHavePaid;
    const sunkCostDiff = ownerSunkCost - renterSunkCost;
    const ownershipAdvantage = renterSunkCost - ownerSunkCost + wealthBuilt;
    const monthlyWealthCreation = monthsOwned > 0 ? wealthBuilt / monthsOwned : 0;

    // Chart data — month by month cumulative
    const chartData: { month: string; sunkCost: number; equity: number; rent: number }[] = [];
    let crossoverMonth: string | null = null;

    const monthlyTax = homePLConfig.annualPropertyTax / 12;
    const monthlyMaint = homePLConfig.annualMaintenance / 12;
    const monthlyRent = homePLConfig.estimatedMonthlyRent;
    const monthlyIns = homePLConfig.monthlyInsurance;
    const monthlyHoa = homePLConfig.monthlyHOA;

    let cumSunk = 0;
    let cumRent = 0;
    // Build a map of payments by month
    const paymentMap: Record<string, { interest: number; principal: number }> = {};
    sorted.forEach(p => {
      const m = p.paymentDate.substring(0, 7);
      if (!paymentMap[m]) paymentMap[m] = { interest: 0, principal: 0 };
      paymentMap[m].interest += p.interestPortion;
      paymentMap[m].principal += p.principalPortion + p.extraPrincipal;
    });

    // Reno spend by completion month
    const renoSunkByMonth: Record<string, number> = {};
    completeProjects.forEach(p => {
      const m = p.dateCompleted.substring(0, 7);
      const sunk = p.actualCost - getEstimatedValueAdded(p);
      renoSunkByMonth[m] = (renoSunkByMonth[m] || 0) + sunk;
    });

    let cumPrincipal = 0;
    const startYear = pYear;
    const startMonth = pMonth - 1; // 0-indexed for chart loop

    for (let i = 0; i <= monthsOwned; i++) {
      const y = startYear + Math.floor((startMonth + i) / 12);
      const m = (startMonth + i) % 12;
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;

      const pm = paymentMap[key];
      if (pm) {
        cumSunk += pm.interest;
        cumPrincipal += pm.principal;
      }
      if (i <= paidMonthsOwned) {
        cumSunk += monthlyTax + monthlyIns + monthlyHoa + monthlyMaint;
      }
      cumSunk += (renoSunkByMonth[key] || 0);
      cumRent += monthlyRent;

      const equity = downPayment + cumPrincipal + ((marketAppreciation + totalRenoValueAdded) * (i / monthsOwned));

      chartData.push({ month: key, sunkCost: Math.round(cumSunk), equity: Math.round(equity), rent: Math.round(cumRent) });

      if (!crossoverMonth && equity > cumSunk) crossoverMonth = key;
    }

    return {
      purchasePrice, loanAmount, downPayment, monthsOwned, yearsOwned, purchaseDate,
      currentHomeValue, currentBalance, principalPaid, interestPaid,
      totalRenoSpend, totalRenoValueAdded, netRenoCost, renoRecoveryPct,
      totalPropertyTax, totalInsurance, totalHOA, totalMaintenance,
      totalCashInvested, wealthBuilt, returnOnCash, netWealthCreated,
      totalCashOut, equityBuildingSpend, sunkCost, equityBuildingPct, sunkCostPct,
      marketAppreciation, guaranteedEquity, marketDependentEquity,
      monthlyCostOfOwnership,
      totalRentWouldHavePaid, ownerSunkCost, renterSunkCost, ownershipAdvantage,
      monthlyWealthCreation, sunkCostDiff,
      chartData, crossoverMonth,
    };
  }, [property, projects, mortgage, mortgagePayments, valueEntries, homePLConfig, prorated]);
}
