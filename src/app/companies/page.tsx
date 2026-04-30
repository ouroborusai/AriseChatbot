'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Activity,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { useCompanyList } from '@/hooks/useCompanyList';
import type { ActiveCompanyType } from '@/contexts/ActiveCompanyContext';
import { MetricSmall } from '@/components/ui/MetricSmall';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 10;

export default function CompaniesManagementPage() {
  const router = useRouter();
  const { setActiveCompany } = useActiveCompany();
  const { 
    companies, 
    isLoading, 
    searchQuery, 
    setSearchQuery 
  } = useCompanyList();
  
  const [page, setPage] = useState(0);

  const totalCount = companies.length;
  const paginatedCompanies = companies.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleManageCompany = (company: ActiveCompanyType) => {
    setActiveCompany(company);
    localStorage.setItem('arise_active_company', company.id);
    router.push('/company');
  };

  return (
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 blur-[64px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent/5 blur-[64px] rounded-full -z-10" />

      {/* HEADER SECTION - PREMIUM ASLAS STYLE */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-20 px-2 relative z-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="relative">
          <h1 className="text-h1-mobile md:text-h1 font-black text-neural-dark tracking-tighter leading-[0.9] uppercase">
            Gobernanza de <br/><span className="text-primary">Empresas</span>
          </h1>
          <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.4em] mt-6 flex items-center gap-2.5">
            <Building2 size={12} className="text-primary" />
            DIRECTORIO MAESTRO DE NODOS / v10.4 PLATINUM
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-10">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="FILTRAR UNIDAD..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:w-72 pl-12 pr-6 py-4 bg-white text-[9px] font-black uppercase tracking-widest text-neural-dark rounded-md outline-none border border-slate-100 focus:border-primary/30 transition-all relative z-10 placeholder:text-slate-200 shadow-sm"
            />
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200 z-20" />
          </div>

          <button className="flex items-center justify-center gap-4 bg-accent text-white px-8 py-4 rounded-sm text-[8px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-primary transition-all active:scale-95 group">
            <span>Nueva Entidad</span>
            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      </header>

      {/* METRICS SECTION - GLASSMORPISM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 relative z-10 px-1">
        <MetricSmall title="Unidades Totales" value={isLoading ? '..' : companies.length} icon={Building2} />
        <MetricSmall title="Nodos Activos" value={isLoading ? '..' : totalCount} icon={Activity} />
        <MetricSmall title="Capa de Red" value="MALLA_NEURAL" icon={Layers} />
        <MetricSmall title="Seguridad RLS" value="ESTRICTA" icon={ShieldCheck} />
      </div>

      {/* COMPANIES LIST - TABLE STYLE */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm relative z-10 mx-1">
        <div className="p-8 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Directorio de Unidades Operativas</h2>
          </div>
          <span className="text-[8px] font-black bg-white text-primary px-4 py-1.5 rounded-sm uppercase tracking-widest border border-primary/10 shadow-sm">
             TOTAL_REGISTROS: {totalCount}
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-5 text-[7px] font-black text-slate-300 uppercase tracking-[0.3em]">Identidad Corporativa</th>
                <th className="px-8 py-5 text-[7px] font-black text-slate-300 uppercase tracking-[0.3em]">Plan / Tier</th>
                <th className="px-8 py-5 text-[7px] font-black text-slate-300 uppercase tracking-[0.3em]">Rol Asignado</th>
                <th className="px-8 py-5 text-[7px] font-black text-slate-300 uppercase tracking-[0.3em] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center">
                      <Cpu size={32} className="text-[#22c55e] animate-spin opacity-20 mb-4" />
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">Sincronizando_Maestro_Empresas</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedCompanies.length > 0 ? (
                paginatedCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer relative" onClick={() => handleManageCompany(c)}>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white text-neural-dark rounded-md border border-slate-100 flex items-center justify-center font-black text-[11px] shadow-sm group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all duration-500">
                          {c.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-neural-dark uppercase tracking-tight group-hover:text-primary transition-colors">{c.name}</p>
                          <p className="text-[8px] font-mono text-slate-300 uppercase tracking-widest mt-1.5 opacity-60">ID: {c.id.substring(0, 12).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span className={`text-[8px] font-black px-4 py-1.5 rounded-sm border uppercase tracking-widest shadow-sm ${
                        c.plan_tier === 'enterprise' || c.plan_tier === 'pro' 
                        ? 'bg-primary/5 text-primary border-primary/10' 
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        TIER_{c.plan_tier?.toUpperCase() || 'FREE'}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2.5">
                        <ShieldCheck size={14} className={c.role === 'admin' ? 'text-primary' : 'text-slate-200'} />
                        {c.role?.toUpperCase() || 'VIEWER'}
                      </p>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <button className="w-11 h-11 flex items-center justify-center bg-white text-slate-300 hover:bg-accent hover:text-white rounded-md border border-slate-100 transition-all shadow-sm active:scale-90 group/btn mx-auto lg:ml-auto lg:mr-0">
                        <ExternalLink size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                     <Building2 size={48} strokeWidth={1} className="mx-auto text-slate-100 mb-6" />
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">No se detectaron unidades registradas</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION - COMPACT */}
        <div className="p-6 flex flex-col sm:flex-row justify-between items-center bg-slate-50/30 border-t border-slate-50 gap-4">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 bg-white rounded flex items-center justify-center border border-slate-100 shadow-sm">
                <Layers size={10} className="text-slate-300" />
             </div>
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Segmento <span className="text-slate-900">{page + 1}</span> // Nodos <span className="text-[#22c55e]">{totalCount}</span>
             </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))} 
              disabled={page === 0} 
              className="px-4 py-2 bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#22c55e] disabled:opacity-20 transition-all rounded-xl group shadow-sm text-[8px] font-black uppercase tracking-widest gap-2"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform"/>
              <span>Anterior</span>
            </button>
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={(page + 1) * PAGE_SIZE >= totalCount} 
              className="px-4 py-2 bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#22c55e] disabled:opacity-20 transition-all rounded-xl group shadow-sm text-[8px] font-black uppercase tracking-widest gap-2"
            >
              <span>Siguiente</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/>
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER ADVISORY */}
      <div className="mt-12 px-1">
        <div className="bg-accent p-8 rounded-xl border border-white/5 shadow-2xl relative overflow-hidden group max-w-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="flex items-start gap-6 relative z-10">
             <Zap size={20} className="text-primary mt-1" />
             <div>
               <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-2">Centralización Neural</p>
               <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] leading-relaxed">
                 AL SELECCIONAR UNA UNIDAD, EL CONTEXTO DE LOOP SE RE-SINCRONIZARÁ AUTOMÁTICAMENTE CON EL VAULT, INVENTARIO Y CRM DE DICHA ENTIDAD.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
