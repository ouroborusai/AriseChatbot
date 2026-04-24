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
          className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-all rounded-2xl py-3 px-5 border border-white/5 shadow-2xl backdrop-blur-3xl group"
        >
          <Building2 size={16} className="text-green-500 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-black text-white uppercase tracking-widest truncate max-w-[120px] italic">
            {activeCompany?.name || 'INITIALIZING...'}
          </span>
          <ChevronDown size={14} className={`text-slate-600 transition-transform duration-500 ${isDropdownOpen ? 'rotate-180 text-green-500' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-[calc(100%+12px)] right-0 w-80 bg-[#010409] border border-white/10 rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-[200] p-4 animate-in fade-in zoom-in-95 duration-300 backdrop-blur-3xl">
             <div className="relative mb-4 group/search">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/search:text-green-500 transition-colors" />
               <input 
                autoFocus
                type="text" 
                placeholder="FILTRAR_CONTEXTO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black text-white outline-none focus:border-green-500/30 transition-all placeholder:text-slate-800"
               />
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              <div className="px-4 py-3 border-b border-white/5 mb-3 flex justify-between items-center">
                 <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">Nodos Detectados</span>
                 <span className="text-[9px] font-black bg-white/5 text-green-500 px-3 py-1 rounded-lg border border-green-500/20">{filteredCompanies.length}</span>
              </div>
              {filteredCompanies.map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => handleCompanyChange(c)}
                  className={`w-full text-left p-4 rounded-2xl text-[11px] font-black transition-all flex items-center justify-between group relative overflow-hidden ${
                    activeCompany?.id === c.id 
                      ? 'bg-white text-slate-900 shadow-2xl' 
                      : 'text-slate-500 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col gap-1 truncate pr-4 relative z-10">
                    <span className="truncate uppercase italic tracking-tight">{c.name}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${activeCompany?.id === c.id ? 'text-slate-500' : 'text-green-500/50'}`}>
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
      <div className="flex items-center gap-3 mb-4 px-2">
         <Layers size={12} className="text-slate-700" />
         <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Contexto_Operativo</label>
      </div>
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between gap-4 bg-white/5 hover:bg-white/10 border border-white/5 transition-all rounded-[22px] p-5 text-[11px] font-black text-white outline-none shadow-2xl group relative overflow-hidden"
      >
        <div className="absolute left-0 w-1 h-0 bg-green-500 group-hover:h-full transition-all duration-500" />
        <span className="truncate pr-2 uppercase italic tracking-widest">{activeCompany?.name || 'INITIALIZING...'}</span>
        <ChevronDown size={16} className={`text-slate-700 transition-transform duration-500 ${isDropdownOpen ? 'rotate-180 text-green-500' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-[#010409] border border-white/10 rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.9)] z-[100] p-4 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-3xl">
          <div className="relative mb-4 group/search">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/search:text-green-500 transition-colors" />
             <input 
              autoFocus
              type="text" 
              placeholder="FILTRAR_NODOS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-[10px] font-black text-white outline-none focus:border-green-500/30 transition-all placeholder:text-slate-800"
             />
          </div>
          <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            <div className="px-4 py-3 border-b border-white/5 mb-3 flex justify-between items-center">
                 <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">Unidades Activas</span>
                 <span className="text-[9px] font-black bg-white/5 text-green-500 px-3 py-1 rounded-lg border border-green-500/20">{filteredCompanies.length}</span>
            </div>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => handleCompanyChange(c)}
                  className={`w-full text-left p-4 rounded-2xl text-[11px] font-black transition-all flex items-center justify-between group relative overflow-hidden ${
                    activeCompany?.id === c.id 
                      ? 'bg-white text-slate-900 shadow-2xl' 
                      : 'text-slate-500 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col gap-1 truncate pr-4 relative z-10">
                    <span className="truncate uppercase italic tracking-tight">{c.name}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${activeCompany?.id === c.id ? 'text-slate-500' : 'text-green-500/40'}`}>
                      TIER_{c.plan_tier || 'FREE'}
                    </span>
                  </div>
                  {activeCompany?.id === c.id && <Check size={14} className="relative z-10" />}
                </button>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center gap-4">
                 <Cpu size={32} className="text-slate-900" />
                 <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest italic">Sin resultados</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
