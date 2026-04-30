
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Company } from "@/types/database";

export type ActiveCompanyType = Pick<Company, 'id' | 'name' | 'tax_id' | 'status' | 'plan_tier'> & { 
  role?: string 
};

interface ActiveCompanyContextType {
  activeCompany: ActiveCompanyType | null;
  setActiveCompany: (company: ActiveCompanyType) => void;
  isLoading: boolean;
}

const ActiveCompanyContext = createContext<ActiveCompanyContextType | undefined>(undefined);

export const ActiveCompanyProvider = ({ children }: { children: ReactNode }) => {
  const [activeCompany, setActiveCompanyState] = useState<ActiveCompanyType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem("arise_active_company");
    const storedName = localStorage.getItem("arise_active_company_name");
    
    if (storedId && storedName) {
      setActiveCompanyState({ 
        id: storedId, 
        name: storedName,
        role: localStorage.getItem("arise_active_role") || 'viewer',
        plan_tier: (localStorage.getItem("arise_active_plan") as ActiveCompanyType['plan_tier']) || 'free',
        status: (localStorage.getItem("arise_active_status") as ActiveCompanyType['status']) || 'active',
        tax_id: localStorage.getItem("arise_active_tax_id") || ''
      });
    }
    setIsLoading(false);
  }, []);

  const setActiveCompany = React.useCallback((company: ActiveCompanyType) => {
    setActiveCompanyState(company);
    localStorage.setItem("arise_active_company", company.id);
    localStorage.setItem("arise_active_company_name", company.name);
    localStorage.setItem("arise_active_role", company.role || 'viewer');
    localStorage.setItem("arise_active_plan", company.plan_tier || 'free');
    localStorage.setItem("arise_active_status", company.status || 'active');
    localStorage.setItem("arise_active_tax_id", company.tax_id || '');
    
    // Cookie para SSR/Middleware (Diamond v11.9.1)
    document.cookie = `loop_company_id=${company.id}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `loop_plan_tier=${company.plan_tier || 'free'}; path=/; max-age=31536000; SameSite=Lax`;
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
