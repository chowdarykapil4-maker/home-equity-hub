import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PropertyProfile, RenovationProject } from '@/types';

interface AppState {
  property: PropertyProfile;
  projects: RenovationProject[];
  setProperty: (p: PropertyProfile) => void;
  setProjects: (p: RenovationProject[]) => void;
  addProject: (p: RenovationProject) => void;
  updateProject: (p: RenovationProject) => void;
  deleteProject: (id: string) => void;
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

const AppContext = createContext<AppState | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    // Force refresh property defaults if address is empty (old cached data)
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

  useEffect(() => { localStorage.setItem('casakat_property', JSON.stringify(property)); }, [property]);
  useEffect(() => { localStorage.setItem('casakat_projects', JSON.stringify(projects)); }, [projects]);

  const addProject = (p: RenovationProject) => setProjects(prev => [...prev, p]);
  const updateProject = (p: RenovationProject) => setProjects(prev => prev.map(x => x.id === p.id ? p : x));
  const deleteProject = (id: string) => setProjects(prev => prev.filter(x => x.id !== id));

  return (
    <AppContext.Provider value={{ property, projects, setProperty, setProjects, addProject, updateProject, deleteProject }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppProvider');
  return ctx;
}
