'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ActiveCompanyType } from '@/contexts/ActiveCompanyContext';

interface UseCompanyListReturn {
  companies: ActiveCompanyType[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshCompanies: () => Promise<void>;
}

// Global cache only for base fetch
let globalCompaniesCache: ActiveCompanyType[] | null = null;
let globalFetchPromise: Promise<ActiveCompanyType[] | null> | null = null;

export function useCompanyList(): UseCompanyListReturn {
  const [companies, setCompanies] = useState<ActiveCompanyType[]>(globalCompaniesCache || []);
  const [isLoading, setIsLoading] = useState(!globalCompaniesCache);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading: authLoading } = useAuth();

  const fetchCompanies = async (query = '', forceRefresh = false) => {
    if (!user) return;

    // Use cache only if no query and not forced
    if (globalCompaniesCache && !forceRefresh && !query) {
      setCompanies(globalCompaniesCache);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data: adminCheck } = await supabase
        .from('user_company_access')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .limit(1);

      const isMaster = adminCheck && adminCheck.length > 0;
      let finalCompanies: ActiveCompanyType[] = [];

      if (isMaster) {
        let dbQuery = supabase
          .from('vw_company_subscriptions')
          .select('id, name, plan_tier')
          .order('name', { ascending: true });
        
        if (query) {
          dbQuery = dbQuery.ilike('name', `%${query}%`);
        }

        const { data: all } = await dbQuery;

        if (all) {
          finalCompanies = all.map((c: any) => ({
            id: c.id,
            name: c.name,
            role: 'admin',
            plan_tier: c.plan_tier as ActiveCompanyType['plan_tier'],
            status: 'active' as ActiveCompanyType['status'],
            tax_id: null
          }));
          
          if (!query || 'global'.includes(query.toLowerCase())) {
            finalCompanies.unshift({ 
              id: 'global', 
              name: '🌍 VISTA GLOBAL (Consolidado)', 
              role: 'admin', 
              plan_tier: 'enterprise',
              tax_id: null,
              status: 'active'
            });
          }
        }
      } else {
        let dbQuery = supabase
          .from('user_company_access')
          .select('company_id, role, companies!inner(name, plan_tier)')
          .eq('user_id', user.id);

        if (query) {
          dbQuery = dbQuery.ilike('companies.name', `%${query}%`);
        }

        const { data: access } = await dbQuery;

        if (access) {
          finalCompanies = access.map((a: any) => {
            const comp = Array.isArray(a.companies) ? a.companies[0] : a.companies;
            return {
              id: a.company_id,
              name: comp?.name || 'Empresa',
              role: a.role,
              plan_tier: (comp?.plan_tier as ActiveCompanyType['plan_tier']) || 'free',
              status: 'active' as ActiveCompanyType['status'],
              tax_id: null
            };
          }).sort((a: any, b: any) => a.name.localeCompare(b.name));
        }
      }

      setCompanies(finalCompanies);
      if (!query) {
        globalCompaniesCache = finalCompanies;
      }
    } catch (err) {
      console.error("Error fetching companies", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCompanies = async () => {
    await fetchCompanies(searchQuery, true);
  };

  // Re-fetch automatically when searchQuery changes (Delegating filtering to DB)
  useEffect(() => {
    if (!authLoading && user) {
      const delayDebounceFn = setTimeout(() => {
        fetchCompanies(searchQuery);
      }, 300); // debounce to avoid hammering DB
      return () => clearTimeout(delayDebounceFn);
    }
  }, [user, authLoading, searchQuery]);

  return {
    companies, // we now expose the DB-filtered companies directly
    isLoading,
    searchQuery,
    setSearchQuery,
    refreshCompanies
  };
}
