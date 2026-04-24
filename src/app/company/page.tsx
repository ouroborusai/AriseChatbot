'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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

interface Company {
  id: string;
  legal_name?: string;
  rut?: string;
  segment?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

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
    <div className="flex items-center justify-center h-screen bg-[#020617]">
       <div className="text-center">
          <Activity size={64} className="text-green-500 animate-pulse mx-auto mb-10 opacity-20" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[1em] animate-pulse">Sincronizando_Unidad_Corporativa</p>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-full py-6 md:py-12 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PREMIUM BACKGROUND ACCENTS - OPTIMIZED */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-green-500/5 blur-[80px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-500/5 blur-[80px] rounded-full -z-10" />

      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16 px-2">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]" />
             <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Identidad Corporativa</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic uppercase">
            Unidad <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-500">Operativa</span>
          </h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-5 flex items-center gap-3">
            <Fingerprint size={12} className="text-green-500" />
            CONFIGURACIÓN DE GOBERNANZA / v2.5
          </p>
        </div>

        <button className="flex items-center justify-center gap-6 bg-white text-slate-900 px-10 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-green-500 hover:text-white transition-all active:scale-95 group relative z-10">
          <span>Actualizar Credenciales</span>
          <Lock size={16} className="group-hover:rotate-12 transition-transform" />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
        {/* MAIN IDENTITY CARD */}
        <div className="lg:col-span-2 space-y-12">
          <div className="loop-card bg-white/5 border-white/5 shadow-xl p-12 md:p-16 relative overflow-hidden group rounded-[48px]">
            <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none rotate-12 transition-transform group-hover:rotate-45 duration-1000">
               <Globe className="text-white" size={240} strokeWidth={1} />
            </div>
            
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-green-500 mb-16 flex items-center gap-4 italic">
              <Building2 size={16} />
              Perfil de Entidad Legal
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-20 gap-y-16 relative z-10">
              <div className="space-y-4">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Nomenclatura del Negocio</p>
                <p className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic">{company?.legal_name || 'INITIALIZING...'}</p>
              </div>
              <div className="space-y-4">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Identidad Tributaria RUT</p>
                <p className="text-2xl md:text-4xl font-black text-white tracking-tighter font-mono">{company?.rut || 'NO_DECLARED'}</p>
              </div>
              <div className="space-y-6">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Segmento de Matriz Industrial</p>
                <div className="inline-flex px-6 py-3 bg-green-500/10 text-green-500 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-4 items-center border border-green-500/20 shadow-xl">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_#22c55e]" />
                  {company?.segment || 'ESTÁNDAR_INDUSTRIAL'}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Timestamp de Despliegue</p>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                  {company?.created_at ? new Date(company.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'WAITING_SYNC'}
                </p>
              </div>
            </div>
          </div>

          {/* OPERATIONAL METADATA */}
          <div className="loop-card bg-[#010409] p-12 rounded-[48px] border border-white/5 shadow-2xl relative group overflow-hidden">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500 opacity-20" />
             <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] mb-12 flex items-center justify-between">
               Metadatos de Configuración
               <Zap size={14} className="text-green-500 opacity-40" />
             </h3>
             <div className="bg-black/60 p-10 rounded-3xl border border-white/5 relative group/code shadow-inner">
               <div className="absolute top-6 right-6 flex gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
               </div>
               <pre className="text-[12px] leading-loose text-green-500/60 font-mono overflow-x-auto scrollbar-hide selection:bg-green-500/20">
                 {JSON.stringify(company?.metadata || { status: "ACTIVE", core: "LOOP_v2.5", security: "AES-256" }, null, 3)}
               </pre>
             </div>
          </div>
        </div>

        {/* SIDEBAR WIDGETS */}
        <div className="flex flex-col gap-12">
          {/* INTEGRITY SCORE */}
          <div className="loop-card bg-white/5 rounded-[48px] border border-white/10 shadow-xl p-12 flex flex-col overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-150 duration-1000" />
            <div className="relative z-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white mb-6 flex items-center gap-4 italic">
                <ShieldCheck size={16} className="text-green-500" />
                Seguridad de Enlace
              </h3>
              <p className="text-[10px] font-black text-slate-500 mb-10 leading-loose uppercase tracking-[0.2em] italic">Protocolo Diamond v10.0 Blindado. Nodos de identidad verificados en tiempo real.</p>
              
              <div className="space-y-8">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Puntaje de Integridad</span>
                  <span className="text-2xl font-black text-green-500 italic">98.4%</span>
                </div>
                 <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 w-[98%] shadow-[0_0_10px_#22c55e22] rounded-full" />
                 </div>
              </div>
            </div>
          </div>

          {/* TRUST CERTIFICATIONS */}
          <div className="loop-card bg-white/5 rounded-[48px] border border-white/5 shadow-xl p-12 overflow-hidden relative group">
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-700 mb-12 italic">Certificaciones de Confianza</h3>
            <ul className="space-y-8 relative z-10">
               {[
                 { key: 'SII_Sync', label: 'SII_Compliance_v2.5', icon: CheckCircle2, color: 'text-green-500' },
                 { key: 'Global_Payroll', label: 'Global_Payroll_Secure', icon: Layers, color: 'text-blue-500' },
                 { key: 'Neural_Trust', label: 'Neural_Trust_Diamond', icon: Cpu, color: 'text-emerald-500' }
               ].map(item => (
                 <li key={item.key} className="flex items-center gap-6 group/item cursor-pointer">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-700 group-hover/item:bg-white group-hover/item:text-slate-900 transition-all shadow-xl group-hover/item:scale-110">
                     <item.icon size={18} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-white transition-colors">{item.label}</p>
                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-1">Status: Verified</p>
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
