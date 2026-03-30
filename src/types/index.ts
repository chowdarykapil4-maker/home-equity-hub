export type ValueSource = 'Zillow' | 'Redfin' | 'Appraisal' | 'Manual';

export type ProjectStatus = 'Complete' | 'In Progress' | 'Planned 2026' | 'Planned 2027' | 'Wishlist';

export type ProjectCategory =
  | 'Structural' | 'HVAC & Mechanical' | 'Insulation & Envelope'
  | 'Windows & Doors' | 'Interior Finish' | 'Kitchen & Bath'
  | 'Exterior' | 'Electrical' | 'Plumbing' | 'Landscaping' | 'Other';

export type LoanType = '30yr Fixed' | '15yr Fixed' | '10yr ARM' | '7yr ARM' | '5yr ARM';

export type ROICategory = 'High 75%' | 'Medium 60%' | 'Low 35%' | 'Maintenance 10%' | 'Custom';

export type PlannedSubStatus = 'Researching' | 'Getting Quotes' | 'Vendor Selected' | 'Scheduled' | 'Ready to Start';

export const ROI_PERCENTAGES: Record<ROICategory, number> = {
  'High 75%': 75,
  'Medium 60%': 60,
  'Low 35%': 35,
  'Maintenance 10%': 10,
  'Custom': 0,
};

export const CATEGORY_COLORS: Record<ProjectCategory, string> = {
  'Structural': 'hsl(0, 72%, 51%)',
  'HVAC & Mechanical': 'hsl(217, 91%, 50%)',
  'Insulation & Envelope': 'hsl(262, 52%, 47%)',
  'Windows & Doors': 'hsl(38, 92%, 50%)',
  'Interior Finish': 'hsl(142, 71%, 45%)',
  'Kitchen & Bath': 'hsl(330, 70%, 55%)',
  'Exterior': 'hsl(190, 70%, 45%)',
  'Electrical': 'hsl(45, 93%, 47%)',
  'Plumbing': 'hsl(199, 89%, 48%)',
  'Landscaping': 'hsl(120, 40%, 45%)',
  'Other': 'hsl(215, 16%, 47%)',
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
  // New planning fields
  planningColumn?: string;
  subStatus?: PlannedSubStatus;
  dependencies?: string[]; // project IDs
  dateAddedToWishlist?: string;
  datePromotedToPlanned?: string;
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

// Value History
export type ValueHistorySource = 'RentCast AVM' | 'Zillow' | 'Redfin' | 'Appraisal' | 'Manual';

export interface ValueEntry {
  id: string;
  date: string;
  estimatedValue: number;
  source: ValueHistorySource;
  notes: string;
}

export const VALUE_SOURCE_COLORS: Record<ValueHistorySource, string> = {
  'RentCast AVM': 'hsl(270, 60%, 55%)',
  'Zillow': 'hsl(217, 91%, 50%)',
  'Redfin': 'hsl(0, 84%, 60%)',
  'Appraisal': 'hsl(142, 71%, 45%)',
  'Manual': 'hsl(215, 16%, 47%)',
};

export function calculateBlendedValue(entries: ValueEntry[]): { value: number; sourceCount: number } {
  const latestBySource: Record<string, ValueEntry> = {};
  entries.forEach(e => {
    if (!latestBySource[e.source] || e.date > latestBySource[e.source].date) {
      latestBySource[e.source] = e;
    }
  });
  const sources = Object.values(latestBySource);
  if (sources.length === 0) return { value: 0, sourceCount: 0 };
  let totalWeight = 0;
  let weightedSum = 0;
  sources.forEach(s => {
    const weight = s.source === 'Appraisal' ? 2 : 1;
    weightedSum += s.estimatedValue * weight;
    totalWeight += weight;
  });
  return { value: Math.round(weightedSum / totalWeight), sourceCount: sources.length };
}

export function resolveHomeValue(valueEntries: ValueEntry[], property: PropertyProfile): number {
  const { value: blended } = calculateBlendedValue(valueEntries);
  return blended > 0 ? blended : property.currentEstimatedValue;
}

// Renovation Financing
export type FinancingType = '0% Promo' | 'HELOC Draw' | 'Cash';

export interface FinancingEntry {
  id: string;
  type: FinancingType;
  sourceName: string;
  amount: number;
  termMonths: number;
  monthlyPayment: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  remainingBalance: number;
  linkedRenovationId: string;
  notes: string;
}

export interface HELOCConfig {
  totalCapacity: number;
}

export interface BudgetConfig {
  [year: string]: number;
}

export interface PlanningColumnsConfig {
  columns: string[];
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
