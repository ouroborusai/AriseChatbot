'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ChevronDown, 
  Search, 
  Check,
  Building2
} from 'lucide-react';

interface CompanySelectorProps {
  className?: string;
  variant?: 'sidebar' | 'header';
}

export default function CompanySelector({ className = '', variant = 'sidebar' }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUserContext() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error de Auth:', userError);
          return;
        }

        // Identificación robusta (Case insensitive + prefijo)
        const email = user.email?.toLowerCase() || '';
        const isMaster = email === 'ouroborusai@gmail.com' || email.includes('ouroborus.ai');
        
        console.log('Nivel de Acceso:', isMaster ? 'MASTER' : 'STANDARD');

        if (isMaster) {
          const { data: all, error: fetchError } = await supabase
            .from('companies')
            .select('id, name')
            .order('name', { ascending: true });

          if (fetchError) console.error('Error cargando empresas:', fetchError);

          if (all) {
            const list = [
              { id: 'global', name: '🌍 VISTA GLOBAL (Consolidado)', role: 'admin' },
              ...all.map(c => ({ id: c.id, name: c.name, role: 'admin' }))
            ];
            setCompanies(list);
            setFilteredCompanies(list);
            
            const savedId = localStorage.getItem('arise_active_company');
            setActiveCompany(list.find(l => l.id === savedId) || list[0]);
            return;
          }
        }

        // Si no es master, procedemos con lógica normal
        const { data: access } = await supabase
          .from('user_company_access')
          .select('company_id, role, companies(name)')
          .eq('user_id', user.id);

        if (access) {
          const list = access.map((a: any) => ({
            id: a.company_id,
            name: a.companies?.name || 'Empresa',
            role: a.role
          })).sort((a, b) => a.name.localeCompare(b.name));

          setCompanies(list);
          setFilteredCompanies(list);
          const savedId = localStorage.getItem('arise_active_company');
          setActiveCompany(list.find(l => l.id === savedId) || list[0]);
        }
      } catch (err) {
        console.error('Error crítico en CompanySelector:', err);
      }
    }
    fetchUserContext();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const filtered = companies.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCompanies(filtered);
  }, [searchQuery, companies]);

  const handleCompanyChange = (company: any) => {
    setActiveCompany(company);
    localStorage.setItem('arise_active_company', company.id);
    setIsDropdownOpen(false);
    window.location.reload();
  };

  if (variant === 'header') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-slate-100/50 hover:bg-slate-200/50 transition-all rounded-full py-2 px-4 shadow-sm"
        >
          <Building2 size={14} className="text-primary" />
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter truncate max-w-[100px]">
            {activeCompany?.name || 'Cargando...'}
          </span>
          <ChevronDown size={12} className={`text-slate-300 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-[calc(100%+8px)] right-0 w-64 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-200/50 z-[200] p-3 animate-in fade-in zoom-in-95 duration-200">
             <div className="relative mb-3">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
               <input 
                autoFocus
                type="text" 
                placeholder="Filtrar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-2 pl-9 pr-4 text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/5 transition-all"
               />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
              {filteredCompanies.map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => handleCompanyChange(c)}
                  className={`w-full text-left p-3 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-between group ${
                    activeCompany?.id === c.id ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="truncate pr-4">{c.name}</span>
                  {activeCompany?.id === c.id && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 px-2 tracking-[0.2em]">Contexto Operativo</label>
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-all rounded-2xl p-4 text-[11px] font-black text-slate-700 outline-none shadow-sm"
      >
        <span className="truncate pr-2">{activeCompany?.name || 'Cargando...'}</span>
        <ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-200/50 z-[100] p-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative mb-3">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
             <input 
              autoFocus
              type="text" 
              placeholder="Filtrar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-9 pr-4 text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/5 transition-all"
             />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => handleCompanyChange(c)}
                  className={`w-full text-left p-3 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-between group ${
                    activeCompany?.id === c.id 
                      ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="truncate pr-4">{c.name}</span>
                  {activeCompany?.id === c.id && <Check size={12} />}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
