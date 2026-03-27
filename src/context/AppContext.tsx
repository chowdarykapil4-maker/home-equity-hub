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
  monthlyPayment: 6600,
  estimatedMarketRate: 6.5,
};

const defaultPayments: MortgagePayment[] = [
  { id: 'mp-001', paymentDate: '2022-12-31', paymentAmount: 6600, principalPortion: 1259.21, interestPortion: 5298.33, extraPrincipal: 42.46, remainingBalance: 1154698.33, notes: '' },
  { id: 'mp-002', paymentDate: '2023-01-31', paymentAmount: 6600, principalPortion: 1265.17, interestPortion: 5292.37, extraPrincipal: 42.46, remainingBalance: 1153390.7, notes: '' },
  { id: 'mp-003', paymentDate: '2023-02-28', paymentAmount: 6600, principalPortion: 1271.17, interestPortion: 5286.37, extraPrincipal: 42.46, remainingBalance: 1152077.07, notes: '' },
  { id: 'mp-004', paymentDate: '2023-03-31', paymentAmount: 6600, principalPortion: 1277.19, interestPortion: 5280.35, extraPrincipal: 42.46, remainingBalance: 1150757.42, notes: '' },
  { id: 'mp-005', paymentDate: '2023-04-30', paymentAmount: 6600, principalPortion: 1283.24, interestPortion: 5274.3, extraPrincipal: 42.46, remainingBalance: 1149431.72, notes: '' },
  { id: 'mp-006', paymentDate: '2023-05-31', paymentAmount: 6600, principalPortion: 1289.31, interestPortion: 5268.23, extraPrincipal: 42.46, remainingBalance: 1148099.95, notes: '' },
  { id: 'mp-007', paymentDate: '2023-06-30', paymentAmount: 6600, principalPortion: 1295.42, interestPortion: 5262.12, extraPrincipal: 42.46, remainingBalance: 1146762.07, notes: '' },
  { id: 'mp-008', paymentDate: '2023-07-31', paymentAmount: 6600, principalPortion: 1301.55, interestPortion: 5255.99, extraPrincipal: 42.46, remainingBalance: 1145418.06, notes: '' },
  { id: 'mp-009', paymentDate: '2023-08-31', paymentAmount: 6600, principalPortion: 1307.71, interestPortion: 5249.83, extraPrincipal: 42.46, remainingBalance: 1144067.89, notes: '' },
  { id: 'mp-010', paymentDate: '2023-09-30', paymentAmount: 6600, principalPortion: 1313.9, interestPortion: 5243.64, extraPrincipal: 42.46, remainingBalance: 1142711.53, notes: '' },
  { id: 'mp-011', paymentDate: '2023-10-31', paymentAmount: 6600, principalPortion: 1320.11, interestPortion: 5237.43, extraPrincipal: 42.46, remainingBalance: 1141348.96, notes: '' },
  { id: 'mp-012', paymentDate: '2023-11-30', paymentAmount: 6600, principalPortion: 1326.36, interestPortion: 5231.18, extraPrincipal: 42.46, remainingBalance: 1139980.14, notes: '' },
  { id: 'mp-013', paymentDate: '2023-12-31', paymentAmount: 6600, principalPortion: 1332.63, interestPortion: 5224.91, extraPrincipal: 42.46, remainingBalance: 1138605.05, notes: '' },
  { id: 'mp-014', paymentDate: '2024-01-31', paymentAmount: 6600, principalPortion: 1338.93, interestPortion: 5218.61, extraPrincipal: 42.46, remainingBalance: 1137223.66, notes: '' },
  { id: 'mp-015', paymentDate: '2024-02-29', paymentAmount: 6600, principalPortion: 1345.26, interestPortion: 5212.28, extraPrincipal: 42.46, remainingBalance: 1135835.94, notes: '' },
  { id: 'mp-016', paymentDate: '2024-03-31', paymentAmount: 6600, principalPortion: 1351.63, interestPortion: 5205.91, extraPrincipal: 42.46, remainingBalance: 1134441.85, notes: '' },
  { id: 'mp-017', paymentDate: '2024-04-30', paymentAmount: 6600, principalPortion: 1358.01, interestPortion: 5199.53, extraPrincipal: 42.46, remainingBalance: 1133041.38, notes: '' },
  { id: 'mp-018', paymentDate: '2024-05-31', paymentAmount: 6600, principalPortion: 1364.43, interestPortion: 5193.11, extraPrincipal: 42.46, remainingBalance: 1131634.49, notes: '' },
  { id: 'mp-019', paymentDate: '2024-06-30', paymentAmount: 6600, principalPortion: 1370.88, interestPortion: 5186.66, extraPrincipal: 42.46, remainingBalance: 1130221.15, notes: '' },
  { id: 'mp-020', paymentDate: '2024-07-31', paymentAmount: 6600, principalPortion: 1377.36, interestPortion: 5180.18, extraPrincipal: 42.46, remainingBalance: 1128801.33, notes: '' },
  { id: 'mp-021', paymentDate: '2024-08-31', paymentAmount: 6600, principalPortion: 1383.87, interestPortion: 5173.67, extraPrincipal: 42.46, remainingBalance: 1127375.0, notes: '' },
  { id: 'mp-022', paymentDate: '2024-09-30', paymentAmount: 6600, principalPortion: 1390.4, interestPortion: 5167.14, extraPrincipal: 42.46, remainingBalance: 1125942.14, notes: '' },
  { id: 'mp-023', paymentDate: '2024-10-31', paymentAmount: 6600, principalPortion: 1396.97, interestPortion: 5160.57, extraPrincipal: 42.46, remainingBalance: 1124502.71, notes: '' },
  { id: 'mp-024', paymentDate: '2024-11-30', paymentAmount: 6600, principalPortion: 1403.57, interestPortion: 5153.97, extraPrincipal: 42.46, remainingBalance: 1123056.68, notes: '' },
  { id: 'mp-025', paymentDate: '2024-12-31', paymentAmount: 6600, principalPortion: 1410.2, interestPortion: 5147.34, extraPrincipal: 42.46, remainingBalance: 1121604.02, notes: '' },
  { id: 'mp-026', paymentDate: '2025-01-31', paymentAmount: 6600, principalPortion: 1416.85, interestPortion: 5140.69, extraPrincipal: 42.46, remainingBalance: 1120144.71, notes: '' },
  { id: 'mp-027', paymentDate: '2025-02-28', paymentAmount: 6600, principalPortion: 1423.54, interestPortion: 5134.0, extraPrincipal: 42.46, remainingBalance: 1118678.71, notes: '' },
  { id: 'mp-028', paymentDate: '2025-03-31', paymentAmount: 6600, principalPortion: 1430.26, interestPortion: 5127.28, extraPrincipal: 42.46, remainingBalance: 1117205.99, notes: '' },
  { id: 'mp-029', paymentDate: '2025-04-30', paymentAmount: 6600, principalPortion: 1437.01, interestPortion: 5120.53, extraPrincipal: 42.46, remainingBalance: 1115726.52, notes: '' },
  { id: 'mp-030', paymentDate: '2025-05-31', paymentAmount: 6600, principalPortion: 1443.79, interestPortion: 5113.75, extraPrincipal: 42.46, remainingBalance: 1114240.27, notes: '' },
  { id: 'mp-031', paymentDate: '2025-06-30', paymentAmount: 6600, principalPortion: 1450.61, interestPortion: 5106.93, extraPrincipal: 42.46, remainingBalance: 1112747.2, notes: '' },
  { id: 'mp-032', paymentDate: '2025-07-31', paymentAmount: 6600, principalPortion: 1457.45, interestPortion: 5100.09, extraPrincipal: 42.46, remainingBalance: 1111247.29, notes: '' },
  { id: 'mp-033', paymentDate: '2025-08-31', paymentAmount: 6600, principalPortion: 1464.32, interestPortion: 5093.22, extraPrincipal: 42.46, remainingBalance: 1109740.51, notes: '' },
  { id: 'mp-034', paymentDate: '2025-09-30', paymentAmount: 6600, principalPortion: 1471.23, interestPortion: 5086.31, extraPrincipal: 42.46, remainingBalance: 1108226.82, notes: '' },
  { id: 'mp-035', paymentDate: '2025-10-31', paymentAmount: 6600, principalPortion: 1478.17, interestPortion: 5079.37, extraPrincipal: 42.46, remainingBalance: 1106706.19, notes: '' },
  { id: 'mp-036', paymentDate: '2025-11-30', paymentAmount: 6600, principalPortion: 1485.14, interestPortion: 5072.4, extraPrincipal: 42.46, remainingBalance: 1105178.59, notes: '' },
  { id: 'mp-037', paymentDate: '2025-12-31', paymentAmount: 6600, principalPortion: 1492.14, interestPortion: 5065.4, extraPrincipal: 42.46, remainingBalance: 1103643.99, notes: '' },
  { id: 'mp-038', paymentDate: '2026-01-31', paymentAmount: 6600, principalPortion: 1499.17, interestPortion: 5058.37, extraPrincipal: 42.46, remainingBalance: 1102102.36, notes: '' },
  { id: 'mp-039', paymentDate: '2026-02-28', paymentAmount: 6600, principalPortion: 1506.24, interestPortion: 5051.3, extraPrincipal: 42.46, remainingBalance: 1100553.66, notes: '' },
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
        if (parsed.monthlyPayment === 6190 || parsed.monthlyPayment === 6557.54 || parsed.originalLoanAmount === 1090000 || parsed.originalLoanAmount === 1155000) {
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
