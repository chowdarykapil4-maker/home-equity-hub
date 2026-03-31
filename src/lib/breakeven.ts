import { HomePLConfig, TaxConfig } from '@/context/AppContext';
import { MortgageProfile } from '@/types';
import { calculateMonthlyInterest } from '@/types';

export interface BreakevenYearData {
  year: number;
  ownerEquity: number;
  ownerSunkCost: number;
  ownerTaxSavings: number;
  ownerAfterTaxWealth: number;
  renterPortfolio: number;
  renterTaxDrag: number;
  renterAfterTaxWealth: number;
  winner: 'Own' | 'Rent';
  margin: number;
}

export interface BreakevenResult {
  yearlyData: BreakevenYearData[];
  crossoverYear: number | null;
  chartData: { year: number; owner: number; renter: number }[];
}

export function calculateBreakevenTimeline(
  downPayment: number,
  purchasePrice: number,
  mortgage: MortgageProfile,
  config: HomePLConfig,
  tax: TaxConfig,
  annualReturnPct: number,
  totalRenoValueAdded: number,
  yearsToProject: number = 15,
  resolvedRent?: number,
  extraMonthlyPrincipal?: number,
): BreakevenResult {
  const extraPrincipal = extraMonthlyPrincipal || 0;
  const combinedRate = (tax.federalRate + tax.stateRate) / 100;
  const combinedCapGains = (tax.capitalGainsRate + tax.stateCapGainsRate) / 100;
  const monthlyReturnRate = Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;
  const monthlyMortgage = mortgage.monthlyPayment;
  const monthlyTax = config.annualPropertyTax / 12;
  const monthlyInsurance = config.monthlyInsurance;
  const monthlyMaint = config.annualMaintenance / 12;
  const monthlyHOA = config.monthlyHOA;
  const totalMonthlyOwnerCost = monthlyMortgage + monthlyTax + monthlyInsurance + monthlyMaint + monthlyHOA + extraPrincipal;
  const appreciationRate = (tax.annualAppreciation || 3) / 100;
  const rentIncreaseRate = (tax.annualRentIncrease || 3) / 100;
  const exclusionLimit = tax.filingStatus === 'Single' ? 250000 : 500000;

  const yearlyData: BreakevenYearData[] = [];
  const chartData: { year: number; owner: number; renter: number }[] = [];
  let crossoverYear: number | null = null;

  // Simulate year by year
  let mortgageBalance = mortgage.originalLoanAmount;
  let cumPrincipal = 0;
  let cumInterest = 0;
  let cumTaxSavings = 0;
  let renterPortfolio = downPayment;
  let cumRenterContributions = downPayment;
  let currentRent = resolvedRent || config.estimatedMonthlyRent;

  for (let y = 1; y <= yearsToProject; y++) {
    let yearInterest = 0;
    let yearPrincipal = 0;

    // Month-by-month for this year
    for (let m = 0; m < 12; m++) {
      // Mortgage amortization
      const monthInterest = calculateMonthlyInterest(mortgageBalance, mortgage.interestRate);
      const monthPrincipal = monthlyMortgage - monthInterest;
      if (mortgageBalance > 0) {
        mortgageBalance = Math.max(0, mortgageBalance - monthPrincipal);
        yearInterest += monthInterest;
        yearPrincipal += monthPrincipal;
      }

      // Renter portfolio
      const monthlySavings = totalMonthlyOwnerCost - currentRent;
      renterPortfolio = renterPortfolio * (1 + monthlyReturnRate) + monthlySavings;
      cumRenterContributions += monthlySavings;
    }

    cumPrincipal += yearPrincipal;
    cumInterest += yearInterest;

    // Owner tax savings this year
    const deductiblePropertyTax = Math.min(config.annualPropertyTax, tax.saltCap);
    const yearTaxSavings = tax.itemizeDeductions
      ? (yearInterest * combinedRate) + (deductiblePropertyTax * combinedRate)
      : 0;
    cumTaxSavings += yearTaxSavings;

    // Owner equity
    const homeValue = purchasePrice * Math.pow(1 + appreciationRate, y) + totalRenoValueAdded;
    const ownerEquity = homeValue - mortgageBalance;
    const appreciation = homeValue - purchasePrice;
    const capGainsBenefit = Math.round(Math.min(Math.max(0, appreciation), exclusionLimit) * combinedCapGains);
    const ownerAfterTaxWealth = Math.round(ownerEquity + cumTaxSavings);

    // Owner sunk cost
    const ownerSunkCost = Math.round(cumInterest + config.annualPropertyTax * y + config.monthlyInsurance * y * 12 + config.annualMaintenance * y - cumTaxSavings);

    // Renter after-tax
    const renterGains = Math.max(0, renterPortfolio - cumRenterContributions);
    const renterCapGainsTax = Math.round(renterGains * combinedCapGains);
    const avgPortfolio = (downPayment + renterPortfolio) / 2;
    const renterDividendDrag = Math.round(avgPortfolio * 0.015 * combinedCapGains * y);
    const renterTaxDrag = renterCapGainsTax + renterDividendDrag;
    const renterAfterTaxWealth = Math.round(renterPortfolio - renterTaxDrag);

    const margin = ownerAfterTaxWealth - renterAfterTaxWealth;
    const winner: 'Own' | 'Rent' = margin >= 0 ? 'Own' : 'Rent';

    if (crossoverYear === null && margin >= 0 && y > 1) {
      crossoverYear = y;
    }

    yearlyData.push({
      year: y,
      ownerEquity: Math.round(ownerEquity),
      ownerSunkCost,
      ownerTaxSavings: Math.round(cumTaxSavings),
      ownerAfterTaxWealth,
      renterPortfolio: Math.round(renterPortfolio),
      renterTaxDrag,
      renterAfterTaxWealth,
      winner,
      margin: Math.round(margin),
    });

    chartData.push({
      year: y,
      owner: ownerAfterTaxWealth,
      renter: renterAfterTaxWealth,
    });

    // Increase rent for next year
    currentRent = currentRent * (1 + rentIncreaseRate);
  }

  // Check if year 1 already wins
  if (yearlyData.length > 0 && yearlyData[0].margin >= 0 && crossoverYear === null) {
    crossoverYear = 1;
  }

  return { yearlyData, crossoverYear, chartData };
}
