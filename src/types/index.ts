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
