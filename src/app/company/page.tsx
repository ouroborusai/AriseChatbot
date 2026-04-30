'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Company } from '@/types/database';
import { 
  Activity, 
  Globe, 
  Zap, 
  ShieldCheck, 
  CheckCircle2,
  Cpu,
  Building2,
  Fingerprint,
  Layers,
  Lock
} from 'lucide-react';
import Image from 'next/image';

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      const activeCompanyId = localStorage.getItem('arise_active_company');
      if (!activeCompanyId) {
        setLoading(false);
        return;
      }
      
      if (activeCompanyId === 'global') {
        setCompany({
          id: 'global',
          name: 'VISTA GLOBAL CONSOLIDADA',
          tax_id: 'N/A - MULTI-NODE',
          status: 'active',
          plan_tier: 'enterprise',
          created_at: new Date().toISOString(),
          settings: { mode: "GLOBAL", nodes: "ALL", security: "ROOT_ACCESS" }
        });
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', activeCompanyId)
        .single();
        
      setCompany(data);
      setLoading(false);
    }
    fetchCompany();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
       <div className="text-center">
          <Activity size={48} className="text-[#22c55e] animate-pulse mx-auto mb-8 opacity-20" />
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">Sincronizando_Unidad_Corporativa</p>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-full py-4 md:py-8 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#22c55e]/5 blur-[64px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#0f172a]/5 blur-[64px] rounded-full -z-10" />

      {/* HEADER SECTION - ASLAS STYLE (Optimized Scales) */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8 px-2 relative z-10">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            Unidad <span className="text-[#22c55e]">Operativa</span>
          </h1>
          <p className="text-slate-400 text-[6px] font-black uppercase tracking-[0.3em] mt-2.5 flex items-center gap-2">
            <Fingerprint size={8} className="text-[#22c55e]" />
            CONFIGURACIÓN DE GOBERNANZA / v2.5
          </p>
        </div>

        <button className="flex items-center justify-center gap-3 bg-[#0f172a] text-white px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm hover:bg-[#22c55e] transition-all active:scale-95 group relative z-10">
          <span>Actualizar Credenciales</span>
          <Lock size={12} />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* MAIN IDENTITY CARD - COMPACT */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 shadow-sm p-6 md:p-8 relative overflow-hidden group rounded-2xl">
            <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-[#22c55e] mb-6 flex items-center gap-2">
              <Building2 size={12} />
              Perfil de Entidad Legal
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
              <div className="space-y-1">
                <p className="text-[6.5px] font-black text-slate-300 uppercase tracking-widest">Nomenclatura</p>
                <p className="text-lg font-black text-slate-900 tracking-tighter uppercase">{company?.name || 'INITIALIZING...'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[6.5px] font-black text-slate-300 uppercase tracking-widest">Identidad Tributaria</p>
                <p className="text-lg font-black text-slate-900 tracking-tighter font-mono">{company?.tax_id || 'NO_DECLARED'}</p>
              </div>
              <div className="space-y-3">
                <p className="text-[6.5px] font-black text-slate-300 uppercase tracking-widest">Plan de Servicio</p>
                <div className="inline-flex px-2 py-1 bg-slate-50 text-[#22c55e] rounded-lg text-[7px] font-black uppercase tracking-widest gap-2 items-center border border-slate-100">
                  <div className="w-1 h-1 rounded-full bg-[#22c55e]" />
                  {company?.plan_tier || 'ESTÁNDAR_INDUSTRIAL'}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">Despliegue</p>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.1em]">
                  {company?.created_at ? new Date(company.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'WAITING_SYNC'}
                </p>
              </div>
            </div>
          </div>

          {/* OPERATIONAL METADATA - COMPACT */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm relative group overflow-hidden">
             <h3 className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4 flex items-center justify-between">
               Metadatos de Configuración
               <Zap size={10} className="text-[#22c55e]" />
             </h3>
             <div className="bg-white p-4 rounded-xl border border-slate-100 relative group/code shadow-inner">
               <pre className="text-[8px] leading-relaxed text-slate-400 font-mono overflow-x-auto scrollbar-hide">
                 {JSON.stringify(company?.settings || { status: "ACTIVE", core: "LOOP_v2.5", security: "AES-256" }, null, 3)}
               </pre>
             </div>
          </div>
        </div>

        {/* SIDEBAR WIDGETS - COMPACT */}
        <div className="flex flex-col gap-6">
          {/* INTEGRITY SCORE - COMPACT */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col overflow-hidden relative group">
            <div className="relative z-10">
              <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck size={12} className="text-[#22c55e]" />
                Seguridad de Enlace
              </h3>
              <p className="text-[6.5px] font-black text-slate-300 mb-6 leading-relaxed uppercase tracking-widest">Protocolo Diamond v10.1 Blindado.</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[6.5px] font-black text-slate-300 uppercase tracking-widest">Puntaje de Integridad</span>
                  <span className="text-base font-black text-[#22c55e]">98.4%</span>
                </div>
                 <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                    <div className="h-full bg-[#22c55e] w-[98%] rounded-full" />
                 </div>
              </div>
            </div>
          </div>

          {/* TRUST CERTIFICATIONS - COMPACT */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden relative group">
            <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-200 mb-6">Certificaciones</h3>
            <ul className="space-y-3 relative z-10">
               {[
                 { key: 'SII_Sync', label: 'SII_Compliance', icon: CheckCircle2, color: 'text-[#22c55e]' },
                 { key: 'Global_Payroll', label: 'Global_Payroll', icon: Layers, color: 'text-[#0f172a]' },
                 { key: 'Neural_Trust', label: 'Neural_Trust', icon: Cpu, color: 'text-[#22c55e]' }
               ].map(item => (
                 <li key={item.key} className="flex items-center gap-3 group/item cursor-pointer">
                   <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-50 flex items-center justify-center text-slate-200 group-hover/item:bg-[#22c55e] group-hover/item:text-white transition-all">
                     <item.icon size={12} />
                   </div>
                   <div>
                      <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest group-hover/item:text-slate-900 transition-colors">{item.label}</p>
                   </div>
                 </li>
               ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
