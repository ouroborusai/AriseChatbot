'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CompanyListItem {
  id: string;
  name: string;
  role: string;
  plan_tier: string;
}

interface UseCompanyListReturn {
  companies: CompanyListItem[];
  filteredCompanies: CompanyListItem[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshCompanies: () => Promise<void>;
}

/**
 * Hook unificado para obtener lista de companies
 * Reemplaza lógica duplicada en CompanySelector y Sidebar
 */
// Global cache to prevent duplicate requests across components
let globalCompaniesCache: CompanyListItem[] | null = null;
let globalFetchPromise: Promise<CompanyListItem[] | null> | null = null;

export function useCompanyList(): UseCompanyListReturn {
  const [companies, setCompanies] = useState<CompanyListItem[]>(globalCompaniesCache || []);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyListItem[]>(globalCompaniesCache || []);
  const [isLoading, setIsLoading] = useState(!globalCompaniesCache);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading: authLoading } = useAuth();

  const fetchCompanies = async (forceRefresh = false) => {
    if (!user) return;

    if (globalCompaniesCache && !forceRefresh) {
      setCompanies(globalCompaniesCache);
      setFilteredCompanies(globalCompaniesCache);
      setIsLoading(false);
      return;
    }

    if (globalFetchPromise && !forceRefresh) {
      setIsLoading(true);
      const data = await globalFetchPromise;
      if (data) {
        setCompanies(data);
        setFilteredCompanies(data);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    globalFetchPromise = (async () => {
      try {
        const { data: adminCheck } = await supabase
          .from('user_company_access')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .limit(1);

        const isMaster = adminCheck && adminCheck.length > 0;

        if (isMaster) {
          const { data: all } = await supabase
            .from('vw_company_subscriptions')
            .select('id, name, plan_tier')
            .order('name', { ascending: true });

          if (all) {
            return [
              { id: 'global', name: '🌍 VISTA GLOBAL (Consolidado)', role: 'admin', plan_tier: 'enterprise' },
              ...all.map((c: any) => ({
                id: c.id,
                name: c.name,
                role: 'admin',
                plan_tier: c.plan_tier
              }))
            ];
          }
        } else {
          const { data: access } = await supabase
            .from('user_company_access')
            .select('company_id, role, companies(name, plan_tier)')
            .eq('user_id', user.id);

          if (access) {
            return access.map((a: any) => {
              const comp = Array.isArray(a.companies) ? a.companies[0] : a.companies;
              return {
                id: a.company_id,
                name: comp?.name || 'Empresa',
                role: a.role,
                plan_tier: comp?.plan_tier || 'free'
              };
            }).sort((a: any, b: any) => a.name.localeCompare(b.name));
          }
        }
      } catch (err) {
        console.error("Error fetching companies", err);
      }
      return null;
    })();

    const data = await globalFetchPromise;
    if (data) {
      globalCompaniesCache = data;
      setCompanies(data);
      setFilteredCompanies(data);
    }
    setIsLoading(false);
    globalFetchPromise = null;
  };

  const refreshCompanies = async () => {
    await fetchCompanies(true);
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchCompanies();
    }
  }, [user, authLoading]);

  // Filtrado por búsqueda
  useEffect(() => {
    const filtered = companies.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCompanies(filtered);
  }, [searchQuery, companies]);

  return {
    companies,
    filteredCompanies,
    isLoading,
    searchQuery,
    setSearchQuery,
    refreshCompanies
  };
}
