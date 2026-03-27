import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PropertyProfile, RenovationProject, MortgageProfile, MortgagePayment, ValueEntry, FinancingEntry, HELOCConfig, BudgetConfig, PlanningColumnsConfig, calculatePaymentSplit } from '@/types';

export type FilingStatus = 'Married Filing Jointly' | 'Single' | 'Head of Household';

export interface TaxConfig {
  federalRate: number;
  stateRate: number;
  filingStatus: FilingStatus;
  itemizeDeductions: boolean;
  capitalGainsRate: number;
  stateCapGainsRate: number;
  saltCap: number;
  annualAppreciation: number;
  annualRentIncrease: number;
}

export interface HomePLConfig {
  annualPropertyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  estimatedMonthlyRent: number;
  annualMaintenance: number;
  tax: TaxConfig;
}

interface AppState {
  property: PropertyProfile;
  projects: RenovationProject[];
  mortgage: MortgageProfile;
  mortgagePayments: MortgagePayment[];
  valueEntries: ValueEntry[];
  financingEntries: FinancingEntry[];
  helocConfig: HELOCConfig;
  cashBudget: number;
  budgetConfig: BudgetConfig;
  planningColumns: PlanningColumnsConfig;
  homePLConfig: HomePLConfig;
  setProperty: (p: PropertyProfile) => void;
  setProjects: (p: RenovationProject[]) => void;
  addProject: (p: RenovationProject) => void;
  updateProject: (p: RenovationProject) => void;
  deleteProject: (id: string) => void;
  setMortgage: (m: MortgageProfile) => void;
  setMortgagePayments: (p: MortgagePayment[]) => void;
  addMortgagePayment: (p: MortgagePayment) => void;
  updateMortgagePayment: (p: MortgagePayment) => void;
  deleteMortgagePayment: (id: string) => void;
  setValueEntries: (v: ValueEntry[]) => void;
  addValueEntry: (v: ValueEntry) => void;
  updateValueEntry: (v: ValueEntry) => void;
  deleteValueEntry: (id: string) => void;
  setFinancingEntries: (f: FinancingEntry[]) => void;
  addFinancingEntry: (f: FinancingEntry) => void;
  updateFinancingEntry: (f: FinancingEntry) => void;
  deleteFinancingEntry: (id: string) => void;
  setHelocConfig: (h: HELOCConfig) => void;
  setCashBudget: (n: number) => void;
  setBudgetConfig: (b: BudgetConfig) => void;
  setPlanningColumns: (p: PlanningColumnsConfig) => void;
  setHomePLConfig: (c: HomePLConfig) => void;
}

const defaultProperty: PropertyProfile = {
  address: '5269 Bristol Pl, Newark, CA 94560',
  purchasePrice: 1355000,
  purchaseDate: '2022-10-01',
  closingCosts: 15000,
  currentEstimatedValue: 1660000,
  valueLastUpdated: '2026-03-01',
  valueSource: 'Zillow',
  yearBuilt: 1969,
  squareFootage: 1800,
  mortgageBalance: 0,
};

const defaultProjects: RenovationProject[] = [
  // COMPLETED (21)
  { id: 'rp-001', projectName: 'Pre-purchase inspections', status: 'Complete', category: 'Other', dateCompleted: '2022-10-15', estimateLow: 1500, estimateHigh: 2000, actualCost: 1700, vendorName: '', roiCategory: 'Maintenance 10%', customROIPercentage: 0, notes: 'Home inspection ($500), foundation inspection ($875), termite inspection ($200), roof inspection ($125). All paid via Costco card or cash. Required for purchase due diligence.' },
  { id: 'rp-002', projectName: 'Termite treatment', status: 'Complete', category: 'Structural', dateCompleted: '2022-11-15', estimateLow: 4000, estimateHigh: 6000, actualCost: 4650, vendorName: 'Herby', roiCategory: 'Maintenance 10%', customROIPercentage: 0, notes: 'Full termite treatment. Paid cash. Essential for home protection — prevents value loss but does not add value.' },
  { id: 'rp-003', projectName: 'Engineered hardwood flooring — whole house', status: 'Complete', category: 'Interior Finish', dateCompleted: '2022-11-20', estimateLow: 9000, estimateHigh: 12000, actualCost: 10760, vendorName: '', roiCategory: 'Custom', customROIPercentage: 70, notes: 'Engineered hardwood from Home Depot. Breakdown — flooring material ($5,810), extra material ($900), Floor & Decor material ($600), floor registers from Amazon ($250), installation labor ($3,200 cash). Major quality-of-life and resale upgrade.' },
  { id: 'rp-004', projectName: 'Tile work — guest bedroom, bath, and entryway', status: 'Complete', category: 'Interior Finish', dateCompleted: '2022-11-25', estimateLow: 2000, estimateHigh: 3000, actualCost: 2400, vendorName: '', roiCategory: 'Medium 60%', customROIPercentage: 0, notes: 'Tile replacement in guest BR/bath and outside entryway. Labor $1,650 (cash) + material $750 (Costco card).' },
  { id: 'rp-005', projectName: 'Interior paint — first floor', status: 'Complete', category: 'Interior Finish', dateCompleted: '2022-11-28', estimateLow: 2500, estimateHigh: 4000, actualCost: 3150, vendorName: '', roiCategory: 'Custom', customROIPercentage: 65, notes: 'Full first floor interior repaint. Material $1,150 (Costco card/cash) + labor $2,000 (cash).' },
  { id: 'rp-006', projectName: 'Electrical upgrade — whole house', status: 'Complete', category: 'Electrical', dateCompleted: '2022-12-15', estimateLow: 6000, estimateHigh: 8000, actualCost: 7100, vendorName: '', roiCategory: 'Custom', customROIPercentage: 45, notes: 'Three-phase project. Smart/Lutron switches and plugs for entire house via Home Depot ($1,000), electrical labor for switches, lights, plugs ($3,500 cash), Stanford Electrical for lighting ($2,600 card). Full modernization of electrical throughout the home.' },
  { id: 'rp-007', projectName: 'Loft bathroom — toilet and bidet', status: 'Complete', category: 'Kitchen & Bath', dateCompleted: '2022-11-15', estimateLow: 600, estimateHigh: 1000, actualCost: 780, vendorName: '', roiCategory: 'Custom', customROIPercentage: 65, notes: 'New toilet and bidet for loft bathroom. Costco card.' },
  { id: 'rp-008', projectName: 'Gas line and external vents', status: 'Complete', category: 'Plumbing', dateCompleted: '2022-11-15', estimateLow: 2000, estimateHigh: 3000, actualCost: 2340, vendorName: 'Herby', roiCategory: 'Maintenance 10%', customROIPercentage: 0, notes: 'Gas line work and external vent installation. Cash. Infrastructure/safety work.' },
  { id: 'rp-009', projectName: 'Smart locks — Nest Yale x2', status: 'Complete', category: 'Electrical', dateCompleted: '2022-11-15', estimateLow: 350, estimateHigh: 550, actualCost: 440, vendorName: '', roiCategory: 'Low 35%', customROIPercentage: 0, notes: 'Two Nest Yale smart locks for front and side doors. Smart home security upgrade.' },
  { id: 'rp-010', projectName: 'Window coverings — whole house', status: 'Complete', category: 'Interior Finish', dateCompleted: '2022-12-20', estimateLow: 7500, estimateHigh: 10000, actualCost: 9000, vendorName: '', roiCategory: 'Medium 60%', customROIPercentage: 0, notes: 'Costco blinds for whole house ($7,500, received $800 Costco gift card back — net $6,700) + curtains/drapes from India ($1,500 including $300 shipping). Gross cost tracked as $9,000; effective net ~$8,200 after gift card.' },
  { id: 'rp-011', projectName: 'EV charging — garage electrical', status: 'Complete', category: 'Electrical', dateCompleted: '2023-01-15', estimateLow: 800, estimateHigh: 1500, actualCost: 1000, vendorName: '', roiCategory: 'Medium 60%', customROIPercentage: 0, notes: 'Electrical work in garage for EV charging port installation. Growing buyer demand for EV-ready homes supports moderate ROI.' },
  { id: 'rp-012', projectName: 'Garage epoxy flooring and painting', status: 'Complete', category: 'Interior Finish', dateCompleted: '2023-01-20', estimateLow: 2000, estimateHigh: 3500, actualCost: 2500, vendorName: '', roiCategory: 'Low 35%', customROIPercentage: 0, notes: 'Epoxy floor coating and wall painting in garage. Aesthetic improvement, moderate durability benefit.' },
  { id: 'rp-013', projectName: 'Central HVAC system — furnace and AC', status: 'Complete', category: 'HVAC & Mechanical', dateCompleted: '2023-03-15', estimateLow: 14000, estimateHigh: 18000, actualCost: 16000, vendorName: '', roiCategory: 'Custom', customROIPercentage: 60, notes: 'Full central furnace + AC replacement purchased through Home Depot. Financed on HD credit card with 24-month financing. Major system replacement — essential for home functionality and resale.' },
  { id: 'rp-014', projectName: 'Roof replacement — Solaris Moire Black', status: 'Complete', category: 'Structural', dateCompleted: '2024-07-15', estimateLow: 18000, estimateHigh: 22000, actualCost: 17345, vendorName: '', roiCategory: 'Custom', customROIPercentage: 65, notes: 'Full roof replacement (Solaris Moire Black) + downspouts and gutters ($1,800, $500 reduced from original, 2nd floor optional) + wood rot repair ($1,200). Gross cost $23,000 offset by Hippo insurance claim reimbursement (-$5,000), cash discount (-$1,000), and Chase business transfer bonus (-$750). CC balance transfer fee of $1,095 included. Net out-of-pocket: $17,345. Financed via credit card balance transfer.' },
  { id: 'rp-015', projectName: 'Landscaping — front yard turf, irrigation, and plants', status: 'Complete', category: 'Landscaping', dateCompleted: '2024-10-15', estimateLow: 9000, estimateHigh: 13000, actualCost: 11000, vendorName: '', roiCategory: 'Custom', customROIPercentage: 55, notes: 'Two phases — trees, plants, and material ($2,000 Costco card) + front yard turf, full landscape, and irrigation system ($9,000 cash). Major curb appeal upgrade.' },
  { id: 'rp-016', projectName: 'Master closet shelves and bench', status: 'Complete', category: 'Interior Finish', dateCompleted: '2025-03-15', estimateLow: 4000, estimateHigh: 5500, actualCost: 4600, vendorName: '', roiCategory: 'Medium 60%', customROIPercentage: 0, notes: 'Custom closet shelving and bench in master bedroom closet. Cash.' },
  { id: 'rp-017', projectName: 'Attic insulation R-38 + loft spray foam R-30', status: 'Complete', category: 'Insulation & Envelope', dateCompleted: '2025-07-15', estimateLow: 6000, estimateHigh: 8000, actualCost: 6900, vendorName: "Johnson's Insulation", roiCategory: 'High 75%', customROIPercentage: 0, notes: 'Est#2598. Attic blown-in cellulose R-38 + loft spray foam R-30. 12-month payment plan. Claim $1,200 insulation tax credit on Form 5695. Energy efficiency and comfort upgrade.' },
  { id: 'rp-018', projectName: 'Loft drywall ceiling and lighting', status: 'Complete', category: 'Interior Finish', dateCompleted: '2025-08-15', estimateLow: 2800, estimateHigh: 4000, actualCost: 3200, vendorName: '', roiCategory: 'Medium 60%', customROIPercentage: 0, notes: 'Drywall ceiling finish in loft with integrated lighting layout. Funded by family.' },
  { id: 'rp-019', projectName: 'Recessed lights, smart switch, and ceiling paint — loft', status: 'Complete', category: 'Electrical', dateCompleted: '2025-08-20', estimateLow: 400, estimateHigh: 700, actualCost: 500, vendorName: '', roiCategory: 'Low 35%', customROIPercentage: 0, notes: 'Recessed lighting installation, smart dimmer switch, ceiling paint in loft.' },
  { id: 'rp-020', projectName: 'Asbestos removal + new ductwork — crawl space', status: 'Complete', category: 'HVAC & Mechanical', dateCompleted: '2025-08-15', estimateLow: 5000, estimateHigh: 7500, actualCost: 6000, vendorName: "Johnson's Insulation", roiCategory: 'Maintenance 10%', customROIPercentage: 0, notes: "Est#2606. Asbestos abatement and complete ductwork replacement in crawl space. Required before insulation work could proceed. Safety/compliance work — prevents value loss." },
  { id: 'rp-021', projectName: 'Daikin mini split HVAC — loft', status: 'Complete', category: 'HVAC & Mechanical', dateCompleted: '2026-03-10', estimateLow: 6000, estimateHigh: 7500, actualCost: 6600, vendorName: 'A-1 Heating (Brad, #966809)', roiCategory: 'High 75%', customROIPercentage: 0, notes: 'Daikin Oterra 230V 21 SEER2 (FTXF12BVJU9 indoor / RXF12BVJU9 outdoor), 12K BTU R-32 refrigerant. Financed at $6,600 over 25 months at 0% APR ($264/mo). Warranty registered through 3/10/2038 (12yr parts, 3yr labor). Google Home + Daikin ONE Home app integrated. Enables independent loft climate control.' },
  // PLANNED 2026 (4)
  { id: 'rp-022', projectName: '4 patio door replacements (fiberglass double-pane Low-E argon)', status: 'Planned 2026', category: 'Windows & Doors', dateCompleted: '', estimateLow: 8000, estimateHigh: 15000, actualCost: 0, vendorName: '', roiCategory: 'High 75%', customROIPercentage: 0, notes: '3 loft + 1 ground floor guest BR. Fiberglass, double-pane Low-E argon, U≤0.30, SHGC≤0.25. Bundle under one contractor for volume discount. Target summer-fall 2026 before siding work begins.', planningColumn: 'Q2-Q3 2026', subStatus: 'Researching' },
  { id: 'rp-023', projectName: 'Guest bath window replacement', status: 'Planned 2026', category: 'Windows & Doors', dateCompleted: '', estimateLow: 500, estimateHigh: 1200, actualCost: 0, vendorName: '', roiCategory: 'High 75%', customROIPercentage: 0, notes: 'Bundle with patio doors for volume discount.', planningColumn: 'Q2-Q3 2026', subStatus: 'Researching' },
  { id: 'rp-024', projectName: 'Garage window replacement', status: 'Planned 2026', category: 'Windows & Doors', dateCompleted: '', estimateLow: 500, estimateHigh: 1200, actualCost: 0, vendorName: '', roiCategory: 'High 75%', customROIPercentage: 0, notes: 'Bundle with patio doors for volume discount.', planningColumn: 'Q2-Q3 2026', subStatus: 'Researching' },
  { id: 'rp-025', projectName: '2 side entrance doors', status: 'Planned 2026', category: 'Windows & Doors', dateCompleted: '', estimateLow: 800, estimateHigh: 2400, actualCost: 0, vendorName: '', roiCategory: 'High 75%', customROIPercentage: 0, notes: 'Current wooden doors are loose and poorly sealed. Replace with solid weather-sealed doors.', planningColumn: 'Q4 2026', subStatus: 'Researching' },
  // PLANNED 2027 (4)
  { id: 'rp-026', projectName: 'Colored stucco siding — Santa Barbara finish', status: 'Planned 2027', category: 'Exterior', dateCompleted: '', estimateLow: 10250, estimateHigh: 14500, actualCost: 0, vendorName: '', roiCategory: 'High 75%', customROIPercentage: 0, notes: 'Option B Santa Barbara finish, ~1,500 sqft. Must complete after all window and door replacements are done. Coordinate with insulated garage door installation for savings.', planningColumn: '2027', dependencies: ['rp-022', 'rp-023', 'rp-024', 'rp-025'] },
  { id: 'rp-027', projectName: 'Insulated garage door', status: 'Planned 2027', category: 'Exterior', dateCompleted: '', estimateLow: 1000, estimateHigh: 3500, actualCost: 0, vendorName: '', roiCategory: 'Custom', customROIPercentage: 95, notes: 'Coordinate with stucco installation for cost savings. Garage doors have the highest ROI of any renovation nationally per Remodeling Magazine Cost vs Value report.', planningColumn: '2027' },
  { id: 'rp-028', projectName: 'Dual fiberglass front door with glass', status: 'Planned 2027', category: 'Exterior', dateCompleted: '', estimateLow: 1500, estimateHigh: 6500, actualCost: 0, vendorName: '', roiCategory: 'High 75%', customROIPercentage: 0, notes: 'Install after stucco cures. Fiberglass with glass panels. Significant curb appeal impact.', planningColumn: '2027', dependencies: ['rp-026'] },
  { id: 'rp-029', projectName: 'Exterior painting — post-stucco', status: 'Planned 2027', category: 'Exterior', dateCompleted: '', estimateLow: 2000, estimateHigh: 5000, actualCost: 0, vendorName: '', roiCategory: 'High 75%', customROIPercentage: 0, notes: 'Full exterior paint after stucco siding is complete and cured. Final step of exterior renovation package.', planningColumn: '2027', dependencies: ['rp-026'] },
  // WISHLIST (7)
  { id: 'rp-030', projectName: 'All interior doors replacement', status: 'Wishlist', category: 'Interior Finish', dateCompleted: '', estimateLow: 2000, estimateHigh: 5000, actualCost: 0, vendorName: '', roiCategory: 'Medium 60%', customROIPercentage: 0, notes: 'Replace all interior doors throughout the house. Cosmetic upgrade.', dateAddedToWishlist: '2025-01-01' },
  { id: 'rp-031', projectName: 'Kitchen cabinet refacing', status: 'Wishlist', category: 'Kitchen & Bath', dateCompleted: '', estimateLow: 3000, estimateHigh: 8000, actualCost: 0, vendorName: '', roiCategory: 'Custom', customROIPercentage: 85, notes: 'Minor kitchen remodel — reface existing cabinets and update hardware. Highest ROI kitchen project per national averages.', dateAddedToWishlist: '2025-01-01' },
  { id: 'rp-032', projectName: '3 bathroom vanities + mirrors', status: 'Wishlist', category: 'Kitchen & Bath', dateCompleted: '', estimateLow: 2000, estimateHigh: 6000, actualCost: 0, vendorName: '', roiCategory: 'Custom', customROIPercentage: 65, notes: 'Update vanities and mirrors in all 3 bathrooms.', dateAddedToWishlist: '2025-01-01' },
  { id: 'rp-033', projectName: 'Loft flooring + stairs', status: 'Wishlist', category: 'Interior Finish', dateCompleted: '', estimateLow: 3000, estimateHigh: 7000, actualCost: 0, vendorName: '', roiCategory: 'Custom', customROIPercentage: 70, notes: 'New flooring in loft area and updated stair treads.', dateAddedToWishlist: '2025-01-01' },
  { id: 'rp-034', projectName: 'Loft repaint with board-and-batten accent wall', status: 'Wishlist', category: 'Interior Finish', dateCompleted: '', estimateLow: 1000, estimateHigh: 3000, actualCost: 0, vendorName: '', roiCategory: 'Custom', customROIPercentage: 65, notes: 'Vertical board-and-batten accent wall in deep sage green. Remaining walls warm cream/soft greige.', dateAddedToWishlist: '2025-01-01' },
  { id: 'rp-035', projectName: 'Upstairs patio structural repair', status: 'Wishlist', category: 'Structural', dateCompleted: '', estimateLow: 2000, estimateHigh: 5000, actualCost: 0, vendorName: '', roiCategory: 'Custom', customROIPercentage: 30, notes: 'Structural assessment and repair needed for upstairs patio deck.', dateAddedToWishlist: '2025-01-01' },
  { id: 'rp-036', projectName: 'Crawl space encapsulation', status: 'Wishlist', category: 'Structural', dateCompleted: '', estimateLow: 3000, estimateHigh: 8000, actualCost: 0, vendorName: '', roiCategory: 'Low 35%', customROIPercentage: 0, notes: '6-mil poly vapor barrier + dehumidification system. Recommended after ductwork replacement was completed in Aug 2025.', dateAddedToWishlist: '2025-01-01' },
];

const defaultMortgage: MortgageProfile = {
  originalLoanAmount: 1156000,
  loanStartDate: '2022-11-01',
  interestRate: 5.5,
  loanType: '10yr ARM',
  armResetDate: '2032-11-01',
  loanTermYears: 30,
  monthlyPayment: 6557.54,
  estimatedMarketRate: 6.5,
};

const defaultPayments: MortgagePayment[] = [
  { id: 'mp-001', paymentDate: '2022-12-01', paymentAmount: 6557.54, principalPortion: 1259.21, interestPortion: 5298.33, extraPrincipal: 313.93, remainingBalance: 1154426.86, notes: '' },
  { id: 'mp-002', paymentDate: '2023-01-01', paymentAmount: 6557.54, principalPortion: 1266.42, interestPortion: 5291.12, extraPrincipal: 313.93, remainingBalance: 1152846.51, notes: '' },
  { id: 'mp-003', paymentDate: '2023-02-01', paymentAmount: 6557.54, principalPortion: 1273.66, interestPortion: 5283.88, extraPrincipal: 313.93, remainingBalance: 1151258.92, notes: '' },
  { id: 'mp-004', paymentDate: '2023-03-01', paymentAmount: 6557.54, principalPortion: 1280.94, interestPortion: 5276.6, extraPrincipal: 313.93, remainingBalance: 1149664.05, notes: '' },
  { id: 'mp-005', paymentDate: '2023-04-01', paymentAmount: 6557.54, principalPortion: 1288.25, interestPortion: 5269.29, extraPrincipal: 313.93, remainingBalance: 1148061.87, notes: '' },
  { id: 'mp-006', paymentDate: '2023-05-01', paymentAmount: 6557.54, principalPortion: 1295.59, interestPortion: 5261.95, extraPrincipal: 313.93, remainingBalance: 1146452.35, notes: '' },
  { id: 'mp-007', paymentDate: '2023-06-01', paymentAmount: 6557.54, principalPortion: 1302.97, interestPortion: 5254.57, extraPrincipal: 313.93, remainingBalance: 1144835.45, notes: '' },
  { id: 'mp-008', paymentDate: '2023-07-01', paymentAmount: 6557.54, principalPortion: 1310.38, interestPortion: 5247.16, extraPrincipal: 313.93, remainingBalance: 1143211.14, notes: '' },
  { id: 'mp-009', paymentDate: '2023-08-01', paymentAmount: 6557.54, principalPortion: 1317.82, interestPortion: 5239.72, extraPrincipal: 313.93, remainingBalance: 1141579.39, notes: '' },
  { id: 'mp-010', paymentDate: '2023-09-01', paymentAmount: 6557.54, principalPortion: 1325.3, interestPortion: 5232.24, extraPrincipal: 313.93, remainingBalance: 1139940.16, notes: '' },
  { id: 'mp-011', paymentDate: '2023-10-01', paymentAmount: 6557.54, principalPortion: 1332.81, interestPortion: 5224.73, extraPrincipal: 313.93, remainingBalance: 1138293.42, notes: '' },
  { id: 'mp-012', paymentDate: '2023-11-01', paymentAmount: 6557.54, principalPortion: 1340.36, interestPortion: 5217.18, extraPrincipal: 313.93, remainingBalance: 1136639.13, notes: '' },
  { id: 'mp-013', paymentDate: '2023-12-01', paymentAmount: 6557.54, principalPortion: 1347.94, interestPortion: 5209.6, extraPrincipal: 313.93, remainingBalance: 1134977.26, notes: '' },
  { id: 'mp-014', paymentDate: '2024-01-01', paymentAmount: 6557.54, principalPortion: 1355.56, interestPortion: 5201.98, extraPrincipal: 313.93, remainingBalance: 1133307.77, notes: '' },
  { id: 'mp-015', paymentDate: '2024-02-01', paymentAmount: 6557.54, principalPortion: 1363.21, interestPortion: 5194.33, extraPrincipal: 313.93, remainingBalance: 1131630.63, notes: '' },
  { id: 'mp-016', paymentDate: '2024-03-01', paymentAmount: 6557.54, principalPortion: 1370.9, interestPortion: 5186.64, extraPrincipal: 313.93, remainingBalance: 1129945.8, notes: '' },
  { id: 'mp-017', paymentDate: '2024-04-01', paymentAmount: 6557.54, principalPortion: 1378.62, interestPortion: 5178.92, extraPrincipal: 313.93, remainingBalance: 1128253.25, notes: '' },
  { id: 'mp-018', paymentDate: '2024-05-01', paymentAmount: 6557.54, principalPortion: 1386.38, interestPortion: 5171.16, extraPrincipal: 313.93, remainingBalance: 1126552.94, notes: '' },
  { id: 'mp-019', paymentDate: '2024-06-01', paymentAmount: 6557.54, principalPortion: 1394.17, interestPortion: 5163.37, extraPrincipal: 313.93, remainingBalance: 1124844.84, notes: '' },
  { id: 'mp-020', paymentDate: '2024-07-01', paymentAmount: 6557.54, principalPortion: 1402.0, interestPortion: 5155.54, extraPrincipal: 313.93, remainingBalance: 1123128.91, notes: '' },
  { id: 'mp-021', paymentDate: '2024-08-01', paymentAmount: 6557.54, principalPortion: 1409.87, interestPortion: 5147.67, extraPrincipal: 313.93, remainingBalance: 1121405.11, notes: '' },
  { id: 'mp-022', paymentDate: '2024-09-01', paymentAmount: 6557.54, principalPortion: 1417.77, interestPortion: 5139.77, extraPrincipal: 313.93, remainingBalance: 1119673.41, notes: '' },
  { id: 'mp-023', paymentDate: '2024-10-01', paymentAmount: 6557.54, principalPortion: 1425.7, interestPortion: 5131.84, extraPrincipal: 313.93, remainingBalance: 1117933.78, notes: '' },
  { id: 'mp-024', paymentDate: '2024-11-01', paymentAmount: 6557.54, principalPortion: 1433.68, interestPortion: 5123.86, extraPrincipal: 313.93, remainingBalance: 1116186.17, notes: '' },
  { id: 'mp-025', paymentDate: '2024-12-01', paymentAmount: 6557.54, principalPortion: 1441.69, interestPortion: 5115.85, extraPrincipal: 313.93, remainingBalance: 1114430.55, notes: '' },
  { id: 'mp-026', paymentDate: '2025-01-01', paymentAmount: 6557.54, principalPortion: 1449.73, interestPortion: 5107.81, extraPrincipal: 313.93, remainingBalance: 1112666.89, notes: '' },
  { id: 'mp-027', paymentDate: '2025-02-01', paymentAmount: 6557.54, principalPortion: 1457.82, interestPortion: 5099.72, extraPrincipal: 313.93, remainingBalance: 1110895.14, notes: '' },
  { id: 'mp-028', paymentDate: '2025-03-01', paymentAmount: 6557.54, principalPortion: 1465.94, interestPortion: 5091.6, extraPrincipal: 313.93, remainingBalance: 1109115.27, notes: '' },
  { id: 'mp-029', paymentDate: '2025-04-01', paymentAmount: 6557.54, principalPortion: 1474.1, interestPortion: 5083.44, extraPrincipal: 313.93, remainingBalance: 1107327.24, notes: '' },
  { id: 'mp-030', paymentDate: '2025-05-01', paymentAmount: 6557.54, principalPortion: 1482.29, interestPortion: 5075.25, extraPrincipal: 313.93, remainingBalance: 1105531.02, notes: '' },
  { id: 'mp-031', paymentDate: '2025-06-01', paymentAmount: 6557.54, principalPortion: 1490.52, interestPortion: 5067.02, extraPrincipal: 313.93, remainingBalance: 1103726.57, notes: '' },
  { id: 'mp-032', paymentDate: '2025-07-01', paymentAmount: 6557.54, principalPortion: 1498.79, interestPortion: 5058.75, extraPrincipal: 313.93, remainingBalance: 1101913.85, notes: '' },
  { id: 'mp-033', paymentDate: '2025-08-01', paymentAmount: 6557.54, principalPortion: 1507.1, interestPortion: 5050.44, extraPrincipal: 313.93, remainingBalance: 1100092.82, notes: '' },
  { id: 'mp-034', paymentDate: '2025-09-01', paymentAmount: 6557.54, principalPortion: 1515.45, interestPortion: 5042.09, extraPrincipal: 313.93, remainingBalance: 1098263.44, notes: '' },
  { id: 'mp-035', paymentDate: '2025-10-01', paymentAmount: 6557.54, principalPortion: 1523.83, interestPortion: 5033.71, extraPrincipal: 313.93, remainingBalance: 1096425.68, notes: '' },
  { id: 'mp-036', paymentDate: '2025-11-01', paymentAmount: 6557.54, principalPortion: 1532.26, interestPortion: 5025.28, extraPrincipal: 313.93, remainingBalance: 1094579.49, notes: '' },
  { id: 'mp-037', paymentDate: '2025-12-01', paymentAmount: 6557.54, principalPortion: 1540.72, interestPortion: 5016.82, extraPrincipal: 313.82, remainingBalance: 1092724.95, notes: '' },
  { id: 'mp-038', paymentDate: '2026-01-01', paymentAmount: 6557.54, principalPortion: 1549.22, interestPortion: 5008.32, extraPrincipal: 0, remainingBalance: 1091175.73, notes: '' },
  { id: 'mp-039', paymentDate: '2026-02-01', paymentAmount: 6557.54, principalPortion: 1556.32, interestPortion: 5001.22, extraPrincipal: 0, remainingBalance: 1090554.64, notes: '' },
];

const AUTO_PAYMENT_AMOUNT = 6600;
const PI_PAYMENT = 6557.54;
const AUTO_EXTRA_PRINCIPAL = Math.round((AUTO_PAYMENT_AMOUNT - PI_PAYMENT) * 100) / 100;
const AUTO_START_DATE = new Date(2026, 2, 31);

function getLastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function autoGeneratePayments(existing: MortgagePayment[], rate: number): MortgagePayment[] {
  const sorted = [...existing].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  const existingDates = new Set(sorted.map(p => p.paymentDate));
  const now = new Date();
  let year = AUTO_START_DATE.getFullYear();
  let month = AUTO_START_DATE.getMonth();
  let balance = sorted.length > 0 ? sorted[sorted.length - 1].remainingBalance : 1090554.64;
  const newPayments: MortgagePayment[] = [];
  while (balance > 0) {
    const dateStr = getLastDayOfMonth(year, month);
    const paymentDate = new Date(year, month + 1, 0);
    if (paymentDate > now) break;
    if (!existingDates.has(dateStr)) {
      const { interest, principal, newBalance } = calculatePaymentSplit(balance, rate, PI_PAYMENT, AUTO_EXTRA_PRINCIPAL);
      newPayments.push({ id: `auto-${dateStr}`, paymentDate: dateStr, paymentAmount: AUTO_PAYMENT_AMOUNT, principalPortion: principal, interestPortion: interest, extraPrincipal: AUTO_EXTRA_PRINCIPAL, remainingBalance: newBalance, notes: 'Auto-generated' });
      balance = newBalance;
    } else {
      const ep = sorted.find(p => p.paymentDate === dateStr);
      if (ep) balance = ep.remainingBalance;
    }
    month++;
    if (month > 11) { month = 0; year++; }
  }
  return newPayments.length > 0 ? [...existing, ...newPayments] : existing;
}

const AppContext = createContext<AppState | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    if (key === 'casakat_property') {
      const stored = localStorage.getItem(key);
      if (stored) { const parsed = JSON.parse(stored); if (!parsed.address || parsed.purchasePrice === 0) { localStorage.removeItem(key); return fallback; } return parsed; }
      return fallback;
    }
    if (key === 'casakat_mortgage') {
      const stored = localStorage.getItem(key);
      if (stored) { const parsed = JSON.parse(stored); if (parsed.monthlyPayment === 6190 || parsed.monthlyPayment === 6600 || parsed.originalLoanAmount === 1090000 || parsed.originalLoanAmount === 1155000) { localStorage.removeItem(key); return fallback; } return parsed; }
      return fallback;
    }
    if (key === 'casakat_mortgage_payments') {
      const stored = localStorage.getItem(key);
      if (stored) { const parsed = JSON.parse(stored); if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].paymentAmount === 6600) { localStorage.removeItem(key); return fallback; } if (Array.isArray(parsed) && parsed.length === 0) { return fallback; } return parsed; }
      return fallback;
    }
    if (key === 'casakat_projects') {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 0) { localStorage.removeItem(key); return fallback; }
        // Migration v3: force reset if old data (missing rp-001 as Pre-purchase inspections)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed.find((p: any) => p.id === 'rp-001');
          if (first && !first.projectName.startsWith('Pre-purchase')) { localStorage.removeItem(key); return fallback; }
        }
        return parsed;
      }
      return fallback;
    }
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

const defaultHelocConfig: HELOCConfig = { totalCapacity: 238000 };
const defaultBudgetConfig: BudgetConfig = { '2026': 30000, '2027': 30000 };
const defaultPlanningColumns: PlanningColumnsConfig = { columns: ['Q2-Q3 2026', 'Q4 2026', '2027', '2028+'] };
const defaultHomePLConfig: HomePLConfig = { annualPropertyTax: 17500, monthlyInsurance: 170, monthlyHOA: 0, estimatedMonthlyRent: 4500, annualMaintenance: 2000 };

export function AppProvider({ children }: { children: ReactNode }) {
  const [property, setProperty] = useState<PropertyProfile>(() => loadFromStorage('casakat_property', defaultProperty));
  const [projects, setProjects] = useState<RenovationProject[]>(() => loadFromStorage('casakat_projects', defaultProjects));
  const [mortgage, setMortgage] = useState<MortgageProfile>(() => loadFromStorage('casakat_mortgage', defaultMortgage));
  const [mortgagePayments, setMortgagePayments] = useState<MortgagePayment[]>(() => {
    const loaded = loadFromStorage('casakat_mortgage_payments', defaultPayments);
    return autoGeneratePayments(loaded, defaultMortgage.interestRate);
  });
  const [valueEntries, setValueEntries] = useState<ValueEntry[]>(() => loadFromStorage('casakat_value_entries', []));
  const [financingEntries, setFinancingEntries] = useState<FinancingEntry[]>(() => loadFromStorage('casakat_financing_entries', []));
  const [helocConfig, setHelocConfig] = useState<HELOCConfig>(() => loadFromStorage('casakat_heloc_config', defaultHelocConfig));
  const [cashBudget, setCashBudget] = useState<number>(() => loadFromStorage('casakat_cash_budget', 0));
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>(() => loadFromStorage('casakat_budget_config', defaultBudgetConfig));
  const [planningColumns, setPlanningColumns] = useState<PlanningColumnsConfig>(() => loadFromStorage('casakat_planning_columns', defaultPlanningColumns));
  const [homePLConfig, setHomePLConfig] = useState<HomePLConfig>(() => loadFromStorage('casakat_homepl_config', defaultHomePLConfig));

  useEffect(() => {
    const updated = autoGeneratePayments(mortgagePayments, mortgage.interestRate);
    if (updated.length !== mortgagePayments.length) setMortgagePayments(updated);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { localStorage.setItem('casakat_property', JSON.stringify(property)); }, [property]);
  useEffect(() => { localStorage.setItem('casakat_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('casakat_mortgage', JSON.stringify(mortgage)); }, [mortgage]);
  useEffect(() => { localStorage.setItem('casakat_mortgage_payments', JSON.stringify(mortgagePayments)); }, [mortgagePayments]);
  useEffect(() => { localStorage.setItem('casakat_value_entries', JSON.stringify(valueEntries)); }, [valueEntries]);
  useEffect(() => { localStorage.setItem('casakat_financing_entries', JSON.stringify(financingEntries)); }, [financingEntries]);
  useEffect(() => { localStorage.setItem('casakat_heloc_config', JSON.stringify(helocConfig)); }, [helocConfig]);
  useEffect(() => { localStorage.setItem('casakat_cash_budget', JSON.stringify(cashBudget)); }, [cashBudget]);
  useEffect(() => { localStorage.setItem('casakat_budget_config', JSON.stringify(budgetConfig)); }, [budgetConfig]);
  useEffect(() => { localStorage.setItem('casakat_planning_columns', JSON.stringify(planningColumns)); }, [planningColumns]);
  useEffect(() => { localStorage.setItem('casakat_homepl_config', JSON.stringify(homePLConfig)); }, [homePLConfig]);

  const addProject = (p: RenovationProject) => setProjects(prev => [...prev, p]);
  const updateProject = (p: RenovationProject) => setProjects(prev => prev.map(x => x.id === p.id ? p : x));
  const deleteProject = (id: string) => setProjects(prev => prev.filter(x => x.id !== id));
  const addMortgagePayment = (p: MortgagePayment) => setMortgagePayments(prev => [...prev, p]);
  const updateMortgagePayment = (p: MortgagePayment) => setMortgagePayments(prev => prev.map(x => x.id === p.id ? p : x));
  const deleteMortgagePayment = (id: string) => setMortgagePayments(prev => prev.filter(x => x.id !== id));
  const addValueEntry = (v: ValueEntry) => setValueEntries(prev => [...prev, v]);
  const updateValueEntry = (v: ValueEntry) => setValueEntries(prev => prev.map(x => x.id === v.id ? v : x));
  const deleteValueEntry = (id: string) => setValueEntries(prev => prev.filter(x => x.id !== id));
  const addFinancingEntry = (f: FinancingEntry) => setFinancingEntries(prev => [...prev, f]);
  const updateFinancingEntry = (f: FinancingEntry) => setFinancingEntries(prev => prev.map(x => x.id === f.id ? f : x));
  const deleteFinancingEntry = (id: string) => setFinancingEntries(prev => prev.filter(x => x.id !== id));

  return (
    <AppContext.Provider value={{
      property, projects, mortgage, mortgagePayments, valueEntries, financingEntries, helocConfig, cashBudget, budgetConfig, planningColumns, homePLConfig,
      setProperty, setProjects, setMortgage, setMortgagePayments, setValueEntries, setFinancingEntries, setHelocConfig, setCashBudget, setBudgetConfig, setPlanningColumns, setHomePLConfig,
      addProject, updateProject, deleteProject,
      addMortgagePayment, updateMortgagePayment, deleteMortgagePayment,
      addValueEntry, updateValueEntry, deleteValueEntry,
      addFinancingEntry, updateFinancingEntry, deleteFinancingEntry,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppProvider');
  return ctx;
}
