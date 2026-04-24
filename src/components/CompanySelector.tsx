'use client';

import React, { useState, useRef } from 'react';
import {
  ChevronDown,
  Search,
  Check,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { useCompanyList, CompanyListItem } from '@/hooks/useCompanyList';

interface CompanySelectorProps {
  className?: string;
  variant?: 'sidebar' | 'header';
}

export default function CompanySelector({ className = '', variant = 'sidebar' }: CompanySelectorProps) {
  const { activeCompany, setActiveCompany } = useActiveCompany();
  const { user, loading: authLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    companies,
    filteredCompanies,
    isLoading,
    searchQuery,
    setSearchQuery
  } = useCompanyList();

  // Auto-selección industrial v9.2
  React.useEffect(() => {
    if (companies.length > 0 && !activeCompany && !isLoading) {
      const defaultCompany = companies[0];
      setActiveCompany(defaultCompany);
    }
  }, [companies, activeCompany, isLoading, setActiveCompany]);

  const handleCompanyChange = (company: CompanyListItem) => {
    setActiveCompany(company);
    localStorage.setItem('arise_active_company', company.id);
    setIsDropdownOpen(false);
    // Invalidar caché en lugar de reload completo
    window.dispatchEvent(new CustomEvent('arise:company-changed', { detail: { companyId: company.id } }));
  };

  if (variant === 'header') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-label="Seleccionar contexto operativo"
          aria-expanded={isDropdownOpen}
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
                placeholder="FILTRAR_LOOP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar empresa"
                className="w-full bg-slate-50 border-none rounded-xl py-2 pl-9 pr-4 text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/5 transition-all"
               />
            </div>
            <div className="max-h-[70vh] overflow-y-auto space-y-1 pr-1 custom-scrollbar scrollbar-thin scrollbar-thumb-slate-200">
              <div className="px-3 py-2 border-b border-slate-50 mb-2 flex justify-between items-center">
                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Registros Detectados:</span>
                 <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{filteredCompanies.length}</span>
              </div>
              {filteredCompanies.map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => handleCompanyChange(c)}
                  className={`w-full text-left p-3 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-between group ${
                    activeCompany?.id === c.id ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 truncate pr-4">
                    <span className="truncate">{c.name}</span>
                    <span className={`text-[7px] font-black uppercase tracking-widest ${activeCompany?.id === c.id ? 'text-white/70' : 'text-primary/50'}`}>
                      Tier {c.plan_tier || 'free'}
                    </span>
                  </div>
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
        aria-label="Seleccionar empresa activa"
        aria-expanded={isDropdownOpen}
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
              placeholder="FILTRAR_NODOS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filtrar lista de empresas"
              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-9 pr-4 text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/5 transition-all"
             />
          </div>
          <div className="max-h-[60vh] overflow-y-auto space-y-1 pr-1 custom-scrollbar scrollbar-thin">
            <div className="px-3 py-2 border-b border-slate-50 mb-2 flex justify-between items-center">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nodos Disponibles:</span>
                 <span className="text-[8px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{filteredCompanies.length}</span>
            </div>
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
                  <div className="flex flex-col gap-0.5 truncate pr-4">
                    <span className="truncate">{c.name}</span>
                    <span className={`text-[7px] font-black uppercase tracking-widest ${activeCompany?.id === c.id ? 'text-white/70' : 'text-primary/50'}`}>
                      Tier {c.plan_tier || 'free'}
                    </span>
                  </div>
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
