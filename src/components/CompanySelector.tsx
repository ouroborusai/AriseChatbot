'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  Check,
  Building2,
  Zap,
  Cpu,
  Layers
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
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    companies,
    filteredCompanies,
    isLoading,
    searchQuery,
    setSearchQuery
  } = useCompanyList();

  // Auto-selección industrial v2.5
  useEffect(() => {
    if (companies.length > 0 && !activeCompany && !isLoading) {
      const defaultCompany = companies[0];
      setActiveCompany(defaultCompany);
    }
  }, [companies, activeCompany, isLoading, setActiveCompany]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCompanyChange = (company: CompanyListItem) => {
    setActiveCompany(company);
    localStorage.setItem('arise_active_company', company.id);
    setIsDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('arise:company-changed', { detail: { companyId: company.id } }));
  };

  if (variant === 'header') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-4 bg-white hover:bg-slate-50 transition-all rounded-2xl py-3 px-5 border border-slate-200 shadow-sm backdrop-blur-3xl group"
        >
          <Building2 size={16} className="text-[#22c55e] group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest truncate max-w-[120px]">
            {activeCompany?.name || 'INITIALIZING...'}
          </span>
          <ChevronDown size={14} className={`text-slate-500 transition-transform duration-500 ${isDropdownOpen ? 'rotate-180 text-[#22c55e]' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-[calc(100%+12px)] right-0 w-80 bg-white border border-slate-200 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[200] p-4 animate-in fade-in zoom-in-95 duration-300 backdrop-blur-3xl">
             <div className="relative mb-4 group/search">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-[#22c55e] transition-colors" />
               <input 
                autoFocus
                type="text" 
                placeholder="FILTRAR_CONTEXTO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black text-slate-900 outline-none focus:border-[#22c55e]/30 transition-all placeholder:text-slate-400 focus:bg-white"
               />
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              <div className="px-4 py-3 border-b border-slate-100 mb-3 flex justify-between items-center">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nodos Detectados</span>
                 <span className="text-[9px] font-black bg-slate-50 text-[#22c55e] px-3 py-1 rounded-lg border border-slate-200">{filteredCompanies.length}</span>
              </div>
              {filteredCompanies.map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => handleCompanyChange(c)}
                  className={`w-full text-left p-4 rounded-2xl text-[11px] font-black transition-all flex items-center justify-between group relative overflow-hidden ${
                    activeCompany?.id === c.id 
                      ? 'bg-slate-900 text-white shadow-xl' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex flex-col gap-1 truncate pr-4 relative z-10">
                    <span className="truncate uppercase tracking-tight">{c.name}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${activeCompany?.id === c.id ? 'text-white/60' : 'text-[#22c55e]/70'}`}>
                      TIER_{c.plan_tier || 'FREE'}
                    </span>
                  </div>
                  {activeCompany?.id === c.id && <Check size={14} className="relative z-10" />}
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
      <div className="flex items-center gap-3 mb-4">
         <Layers size={12} className="text-slate-400" />
         <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Contexto_Operativo</label>
      </div>
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between gap-4 bg-transparent hover:text-[#22c55e] transition-all py-2.5 text-[11px] font-black text-slate-900 outline-none group relative"
      >
        <div className="absolute left-0 w-1 h-0 bg-[#22c55e] group-hover:h-full transition-all duration-500" />
        <span className="truncate pr-2 uppercase tracking-tight text-[10px]">{activeCompany?.name || 'INITIALIZING...'}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-500 ${isDropdownOpen ? 'rotate-180 text-[#22c55e]' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-[100] p-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="relative mb-3 group/search">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-[#22c55e] transition-colors" />
             <input 
              autoFocus
              type="text" 
              placeholder="FILTRAR_NODOS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black text-slate-900 outline-none focus:border-[#22c55e]/30 transition-all placeholder:text-slate-400 focus:bg-white"
             />
          </div>
          <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            <div className="px-4 py-3 border-b border-slate-100 mb-3 flex justify-between items-center">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unidades Activas</span>
                 <span className="text-[9px] font-black bg-slate-50 text-[#22c55e] px-3 py-1 rounded-lg border border-slate-200">{filteredCompanies.length}</span>
            </div>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => handleCompanyChange(c)}
                  className={`w-full text-left p-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-between group relative overflow-hidden ${
                    activeCompany?.id === c.id 
                      ? 'bg-slate-50 text-slate-900' 
                      : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex flex-col gap-1 truncate pr-4 relative z-10">
                    <span className="truncate uppercase tracking-tight">{c.name}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${activeCompany?.id === c.id ? 'text-slate-400' : 'text-[#22c55e]/70'}`}>
                      TIER_{c.plan_tier || 'FREE'}
                    </span>
                  </div>
                  {activeCompany?.id === c.id && <Check size={14} className="relative z-10" />}
                </button>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center gap-4">
                 <Cpu size={32} className="text-slate-300" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sin resultados</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
