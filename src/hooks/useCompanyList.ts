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
export function useCompanyList(): UseCompanyListReturn {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading: authLoading } = useAuth();
  const isFetched = useRef(false);

  const fetchCompanies = async () => {
    if (!user) return;

    try {
      // Identificación robusta: Verificar si el usuario es Admin Global
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
          const list: CompanyListItem[] = [
            { id: 'global', name: '🌍 VISTA GLOBAL (Consolidado)', role: 'admin', plan_tier: 'enterprise' },
            ...all.map((c: { id: string; name: string; plan_tier: string }) => ({
              id: c.id,
              name: c.name,
              role: 'admin',
              plan_tier: c.plan_tier
            }))
          ];
          setCompanies(list);
          setFilteredCompanies(list);
          isFetched.current = true;
        }
      } else {
        const { data: access } = await supabase
          .from('user_company_access')
          .select('company_id, role, companies(name, plan_tier)')
          .eq('user_id', user.id);

        if (access) {
          const list: CompanyListItem[] = access.map((a) => {
            const companiesData = Array.isArray(a.companies) ? a.companies[0] : a.companies;
            return {
              id: a.company_id,
              name: (companiesData as { name?: string; plan_tier?: string })?.name || 'Empresa',
              role: a.role,
              plan_tier: (companiesData as { name?: string; plan_tier?: string })?.plan_tier || 'free'
            };
          }).sort((a, b) => a.name.localeCompare(b.name));

          setCompanies(list);
          setFilteredCompanies(list);
          isFetched.current = true;
        }
      }
    } catch {
      // Error manejado silenciosamente - UI muestra estado vacío
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCompanies = async () => {
    isFetched.current = false;
    setIsLoading(true);
    await fetchCompanies();
  };

  useEffect(() => {
    if (!authLoading && user && !isFetched.current) {
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
