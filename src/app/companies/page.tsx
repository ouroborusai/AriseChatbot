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
import { useCompanyList, CompanyListItem } from '@/hooks/useCompanyList';
import { MetricSmall } from '@/components/ui/MetricSmall';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 10;

export default function CompaniesManagementPage() {
  const router = useRouter();
  const { setActiveCompany } = useActiveCompany();
  const { 
    companies, 
    filteredCompanies, 
    isLoading, 
    searchQuery, 
    setSearchQuery 
  } = useCompanyList();
  
  const [page, setPage] = useState(0);

  const totalCount = filteredCompanies.length;
  const paginatedCompanies = filteredCompanies.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleManageCompany = (company: CompanyListItem) => {
    setActiveCompany(company);
    localStorage.setItem('arise_active_company', company.id);
    router.push('/company');
  };

  return (
    <div className="flex flex-col w-full max-w-full py-4 md:py-8 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#22c55e]/5 blur-[64px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#0f172a]/5 blur-[64px] rounded-full -z-10" />

      {/* HEADER SECTION - PREMIUM ASLAS STYLE */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-10 px-2 relative z-10">
        <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            Gobernanza de <span className="text-[#22c55e]">Empresas</span>
          </h1>
          <p className="text-slate-400 text-[7px] font-black uppercase tracking-[0.4em] mt-3.5 flex items-center gap-2.5">
            <Building2 size={10} className="text-[#22c55e]" />
            DIRECTORIO MAESTRO DE NODOS / PROTOCOLO LOOP
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-10">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="FILTRAR UNIDAD..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:w-64 pl-10 pr-4 py-3 bg-white text-[8px] font-black uppercase tracking-widest text-slate-900 rounded-xl outline-none border border-slate-100 focus:border-[#22c55e]/30 transition-all relative z-10 placeholder:text-slate-300 shadow-sm"
            />
            <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-20" />
          </div>

          <button className="flex items-center justify-center gap-3 bg-[#0f172a] text-white px-6 py-3 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-[#22c55e] transition-all active:scale-95 group">
            <span>Nueva Entidad</span>
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
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
      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm relative z-10 mx-1">
        <div className="p-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
             <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Directorio de Unidades Operativas</h2>
          </div>
          <span className="text-[7px] font-black bg-white text-[#22c55e] px-3 py-1 rounded-lg uppercase tracking-widest border border-[#22c55e]/10 shadow-sm">
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
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white text-slate-900 rounded-xl border border-slate-100 flex items-center justify-center font-black text-[10px] shadow-sm group-hover:bg-[#22c55e] group-hover:text-white transition-all duration-500">
                          {c.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight group-hover:text-[#22c55e] transition-colors">{c.name}</p>
                          <p className="text-[7px] font-mono text-slate-300 uppercase tracking-widest mt-1 opacity-60">ID: {c.id.substring(0, 12).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[8px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest shadow-sm ${
                        c.plan_tier === 'enterprise' || c.plan_tier === 'pro' 
                        ? 'bg-[#22c55e]/5 text-[#22c55e] border-[#22c55e]/10' 
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        TIER_{c.plan_tier?.toUpperCase() || 'FREE'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={12} className={c.role === 'admin' ? 'text-[#22c55e]' : 'text-slate-300'} />
                        {c.role?.toUpperCase() || 'VIEWER'}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="w-9 h-9 flex items-center justify-center bg-white text-slate-300 hover:bg-[#0f172a] hover:text-white rounded-xl border border-slate-100 transition-all shadow-sm active:scale-90 group/btn mx-auto lg:ml-auto lg:mr-0">
                        <ExternalLink size={14} />
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
      <div className="mt-8 px-1">
        <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group max-w-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/10 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="flex items-start gap-4 relative z-10">
             <Zap size={16} className="text-[#22c55e] mt-0.5" />
             <div>
               <p className="text-[9px] font-black text-white uppercase tracking-[0.3em] mb-1">Centralización Neural</p>
               <p className="text-[7.5px] font-black text-white/40 uppercase tracking-[0.2em] leading-relaxed">
                 Al seleccionar una unidad, el contexto de Arise se re-sincronizará automáticamente con el Vault, Inventario y CRM de dicha entidad.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
