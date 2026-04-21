
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Company {
  id: string; // UUID
  name: string;
  role?: string;
  tax_id?: string;
  status?: string;
  plan_tier?: string;
  settings?: Record<string, unknown>;
}

interface ActiveCompanyContextType {
  activeCompany: Company | null;
  setActiveCompany: (company: Company) => void;
  isLoading: boolean;
}

const ActiveCompanyContext = createContext<ActiveCompanyContextType | undefined>(undefined);

export const ActiveCompanyProvider = ({ children }: { children: ReactNode }) => {
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem("arise_active_company");
    const storedName = localStorage.getItem("arise_active_company_name");
    
    if (storedId && storedName) {
      setActiveCompanyState({ 
        id: storedId, 
        name: storedName,
        role: localStorage.getItem("arise_active_role") || 'viewer',
        plan_tier: localStorage.getItem("arise_active_plan") || 'free'
      });
    }
    setIsLoading(false);
  }, []);

  const setActiveCompany = React.useCallback((company: Company) => {
    setActiveCompanyState(company);
    localStorage.setItem("arise_active_company", company.id);
    localStorage.setItem("arise_active_company_name", company.name);
    localStorage.setItem("arise_active_role", company.role || 'viewer');
    localStorage.setItem("arise_active_plan", company.plan_tier || 'free');
    
    // Cookie para SSR/Middleware
    document.cookie = `arise_company_id=${company.id}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `arise_plan_tier=${company.plan_tier || 'free'}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  const value = React.useMemo(() => ({ 
    activeCompany, 
    setActiveCompany, 
    isLoading 
  }), [activeCompany, setActiveCompany, isLoading]);

  return (
    <ActiveCompanyContext.Provider value={value}>
      {children}
    </ActiveCompanyContext.Provider>
  );
};

export const useActiveCompany = () => {
  const context = useContext(ActiveCompanyContext);
  if (context === undefined) {
    throw new Error("useActiveCompany must be used within an ActiveCompanyProvider");
  }
  return context;
};
