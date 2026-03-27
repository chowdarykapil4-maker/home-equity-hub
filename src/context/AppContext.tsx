import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PropertyProfile, RenovationProject, MortgageProfile, MortgagePayment } from '@/types';

interface AppState {
  property: PropertyProfile;
  projects: RenovationProject[];
  mortgage: MortgageProfile;
  mortgagePayments: MortgagePayment[];
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
}

const defaultProperty: PropertyProfile = {
  address: '5269 Bristol Pl, Newark, CA 94560',
  purchasePrice: 0,
  purchaseDate: '2015-01-01',
  closingCosts: 0,
  currentEstimatedValue: 1682300,
  valueLastUpdated: '2026-03-27',
  valueSource: 'Zillow',
  yearBuilt: 1967,
  squareFootage: 2018,
  mortgageBalance: 0,
};

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

const AppContext = createContext<AppState | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    if (key === 'casakat_property') {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.address) {
          localStorage.removeItem(key);
          return fallback;
        }
        return parsed;
      }
      return fallback;
    }
    if (key === 'casakat_mortgage') {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.monthlyPayment === 6190 || parsed.originalLoanAmount === 1090000 || parsed.originalLoanAmount === 1155000) {
          localStorage.removeItem(key);
          return fallback;
        }
        return parsed;
      }
      return fallback;
    }
    if (key === 'casakat_mortgage_payments') {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 0) {
          return fallback;
        }
        return parsed;
      }
      return fallback;
    }
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [property, setProperty] = useState<PropertyProfile>(() =>
    loadFromStorage('casakat_property', defaultProperty)
  );
  const [projects, setProjects] = useState<RenovationProject[]>(() =>
    loadFromStorage('casakat_projects', [])
  );
  const [mortgage, setMortgage] = useState<MortgageProfile>(() =>
    loadFromStorage('casakat_mortgage', defaultMortgage)
  );
  const [mortgagePayments, setMortgagePayments] = useState<MortgagePayment[]>(() =>
    loadFromStorage('casakat_mortgage_payments', defaultPayments)
  );

  useEffect(() => { localStorage.setItem('casakat_property', JSON.stringify(property)); }, [property]);
  useEffect(() => { localStorage.setItem('casakat_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('casakat_mortgage', JSON.stringify(mortgage)); }, [mortgage]);
  useEffect(() => { localStorage.setItem('casakat_mortgage_payments', JSON.stringify(mortgagePayments)); }, [mortgagePayments]);

  const addProject = (p: RenovationProject) => setProjects(prev => [...prev, p]);
  const updateProject = (p: RenovationProject) => setProjects(prev => prev.map(x => x.id === p.id ? p : x));
  const deleteProject = (id: string) => setProjects(prev => prev.filter(x => x.id !== id));

  const addMortgagePayment = (p: MortgagePayment) => setMortgagePayments(prev => [...prev, p]);
  const updateMortgagePayment = (p: MortgagePayment) => setMortgagePayments(prev => prev.map(x => x.id === p.id ? p : x));
  const deleteMortgagePayment = (id: string) => setMortgagePayments(prev => prev.filter(x => x.id !== id));

  return (
    <AppContext.Provider value={{
      property, projects, mortgage, mortgagePayments,
      setProperty, setProjects, setMortgage, setMortgagePayments,
      addProject, updateProject, deleteProject,
      addMortgagePayment, updateMortgagePayment, deleteMortgagePayment,
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
