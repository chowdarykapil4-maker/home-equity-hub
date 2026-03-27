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
  originalLoanAmount: 1155000,
  loanStartDate: '2022-11-01',
  interestRate: 5.5,
  loanType: '10yr ARM',
  armResetDate: '2032-11-01',
  loanTermYears: 30,
  monthlyPayment: 6557.54,
  estimatedMarketRate: 6.5,
};

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
    loadFromStorage('casakat_mortgage_payments', [])
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
