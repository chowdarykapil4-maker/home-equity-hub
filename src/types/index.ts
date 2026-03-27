export type ValueSource = 'Zillow' | 'Redfin' | 'Appraisal' | 'Manual';

export type ProjectStatus = 'Complete' | 'In Progress' | 'Planned 2026' | 'Planned 2027' | 'Wishlist';

export type ProjectCategory =
  | 'Structural' | 'HVAC & Mechanical' | 'Insulation & Envelope'
  | 'Windows & Doors' | 'Interior Finish' | 'Kitchen & Bath'
  | 'Exterior' | 'Electrical' | 'Plumbing' | 'Landscaping' | 'Other';

export type LoanType = '30yr Fixed' | '15yr Fixed' | '10yr ARM' | '7yr ARM' | '5yr ARM';

export type ROICategory = 'High 75%' | 'Medium 60%' | 'Low 35%' | 'Maintenance 10%' | 'Custom';

export const ROI_PERCENTAGES: Record<ROICategory, number> = {
  'High 75%': 75,
  'Medium 60%': 60,
  'Low 35%': 35,
  'Maintenance 10%': 10,
  'Custom': 0,
};

export interface PropertyProfile {
  address: string;
  purchasePrice: number;
  purchaseDate: string;
  closingCosts: number;
  currentEstimatedValue: number;
  valueLastUpdated: string;
  valueSource: ValueSource;
  yearBuilt: number;
  squareFootage: number;
  mortgageBalance: number;
}

export interface RenovationProject {
  id: string;
  projectName: string;
  status: ProjectStatus;
  category: ProjectCategory;
  dateCompleted: string;
  estimateLow: number;
  estimateHigh: number;
  actualCost: number;
  vendorName: string;
  roiCategory: ROICategory;
  customROIPercentage: number;
  notes: string;
}

export function getROIPercentage(project: RenovationProject): number {
  if (project.roiCategory === 'Custom') return project.customROIPercentage;
  return ROI_PERCENTAGES[project.roiCategory];
}

export function getEstimateMidpoint(project: RenovationProject): number {
  return (project.estimateLow + project.estimateHigh) / 2;
}

export function getEstimatedValueAdded(project: RenovationProject): number {
  const roi = getROIPercentage(project) / 100;
  const cost = project.status === 'Complete' ? project.actualCost : getEstimateMidpoint(project);
  return cost * roi;
}

export function getCostVariance(project: RenovationProject): number | null {
  if (project.status !== 'Complete') return null;
  return project.actualCost - getEstimateMidpoint(project);
}

export interface MortgageProfile {
  originalLoanAmount: number;
  loanStartDate: string;
  interestRate: number;
  loanType: LoanType;
  armResetDate: string;
  loanTermYears: number;
  monthlyPayment: number;
  estimatedMarketRate: number;
}

export interface MortgagePayment {
  id: string;
  paymentDate: string;
  paymentAmount: number;
  principalPortion: number;
  interestPortion: number;
  extraPrincipal: number;
  remainingBalance: number;
  notes: string;
}

export function isARM(loanType: LoanType): boolean {
  return loanType.includes('ARM');
}

export function calculateMonthlyInterest(balance: number, annualRate: number): number {
  return (balance * (annualRate / 100)) / 12;
}

export function calculatePaymentSplit(balance: number, annualRate: number, paymentAmount: number, extraPrincipal: number = 0) {
  const interest = calculateMonthlyInterest(balance, annualRate);
  const principal = paymentAmount - interest;
  const newBalance = Math.max(0, balance - principal - extraPrincipal);
  return { interest: Math.round(interest * 100) / 100, principal: Math.round(principal * 100) / 100, newBalance: Math.round(newBalance * 100) / 100 };
}

export function calculateMonthsRemaining(balance: number, annualRate: number, monthlyPayment: number): number {
  if (balance <= 0 || monthlyPayment <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return Math.ceil(balance / monthlyPayment);
  const interest = balance * monthlyRate;
  if (monthlyPayment <= interest) return Infinity;
  return Math.ceil(-Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate));
}
