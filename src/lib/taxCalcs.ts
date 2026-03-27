import { HomePLConfig, TaxConfig } from '@/context/AppContext';
import { HomePLData } from '@/hooks/useHomePL';
import { RentInvestResult } from './rentInvest';

export interface TaxAdjustedOwner {
  interestDeductionSavings: number;
  propertyTaxDeductionSavings: number;
  totalTaxSavingsRealized: number;
  capGainsExclusionBenefit: number;
  afterTaxSunkCost: number;
  effectiveNetWealth: number;
  homeSaleExclusionLimit: number;
}

export interface TaxAdjustedRenter {
  totalContributions: number;
  portfolioGains: number;
  capitalGainsTax: number;
  dividendTaxDrag: number;
  afterTaxPortfolio: number;
  afterTaxNetWealth: number;
}

export interface TaxAdjustedComparison {
  owner: TaxAdjustedOwner;
  renter: TaxAdjustedRenter;
  afterTaxMargin: number; // positive = owning wins
}

export function calculateTaxAdjusted(
  d: HomePLData,
  ri: RentInvestResult,
  tax: TaxConfig,
): TaxAdjustedComparison {
  const combinedRate = (tax.federalRate + tax.stateRate) / 100;
  const combinedCapGains = (tax.capitalGainsRate + tax.stateCapGainsRate) / 100;

  // Owner tax benefits
  const interestDeductionSavings = tax.itemizeDeductions
    ? Math.round(d.interestPaid * combinedRate)
    : 0;

  const deductiblePropertyTax = Math.min(d.totalPropertyTax, tax.saltCap * d.yearsOwned);
  const propertyTaxDeductionSavings = tax.itemizeDeductions
    ? Math.round(deductiblePropertyTax * combinedRate)
    : 0;

  const totalTaxSavingsRealized = interestDeductionSavings + propertyTaxDeductionSavings;

  // Cap gains exclusion
  const homeSaleExclusionLimit = tax.filingStatus === 'Single' ? 250000 : 500000;
  const appreciation = Math.max(0, d.marketAppreciation + d.totalRenoValueAdded);
  const taxableGain = Math.max(0, appreciation - homeSaleExclusionLimit);
  const capGainsExclusionBenefit = Math.round(
    Math.min(appreciation, homeSaleExclusionLimit) * combinedCapGains
  );

  const afterTaxSunkCost = Math.round(d.sunkCost - totalTaxSavingsRealized);
  const effectiveNetWealth = Math.round(d.wealthBuilt + totalTaxSavingsRealized);

  // Renter tax drag
  const totalContributions = ri.downPayment + ri.monthlySavings * d.monthsOwned;
  // Add reno costs avoided
  const portfolioGains = Math.max(0, ri.portfolioValue - totalContributions);
  const capitalGainsTax = Math.round(portfolioGains * combinedCapGains);

  // Dividend tax drag estimate: avg portfolio * 1.5% yield * cap gains rate * years
  const avgPortfolio = (ri.downPayment + ri.portfolioValue) / 2;
  const dividendTaxDrag = Math.round(avgPortfolio * 0.015 * combinedCapGains * d.yearsOwned);

  const afterTaxPortfolio = Math.round(ri.portfolioValue - capitalGainsTax - dividendTaxDrag);
  const afterTaxNetWealth = afterTaxPortfolio;

  const afterTaxMargin = effectiveNetWealth - afterTaxNetWealth;

  return {
    owner: {
      interestDeductionSavings,
      propertyTaxDeductionSavings,
      totalTaxSavingsRealized,
      capGainsExclusionBenefit,
      afterTaxSunkCost,
      effectiveNetWealth,
      homeSaleExclusionLimit,
    },
    renter: {
      totalContributions,
      portfolioGains,
      capitalGainsTax,
      dividendTaxDrag,
      afterTaxPortfolio,
      afterTaxNetWealth,
    },
    afterTaxMargin,
  };
}

export function calculateTaxAdjustedSensitivity(
  rates: number[],
  d: HomePLData,
  calculateRentInvestFn: (rate: number) => RentInvestResult,
  tax: TaxConfig,
) {
  return rates.map(rate => {
    const ri = calculateRentInvestFn(rate);
    const adj = calculateTaxAdjusted(d, ri, tax);
    return { rate, preTax: ri, afterTax: adj };
  });
}
