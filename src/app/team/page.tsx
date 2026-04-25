'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  User, 
  ShieldCheck, 
  FileText,
  Users,
  Zap,
  ArrowUpRight,
  Fingerprint,
  Lock,
  Cpu,
  RefreshCcw
} from 'lucide-react';
import { MetricSmall } from '@/components/ui/MetricSmall';
import Image from 'next/image';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import useSWR from 'swr';

interface Employee {
  id: string;
  full_name: string;
  position?: string;
  contract_type?: string;
}

export default function TeamPage() {
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const activeCompanyId = activeCompany?.id;

  const fetchTeam = async (companyId: string) => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .order('full_name');
    
    if (error) throw error;
    return data || [];
  };

  const { data: employees, error, isLoading: isSwrLoading } = useSWR(
    !isContextLoading && activeCompanyId ? `team_${activeCompanyId}` : null,
    () => fetchTeam(activeCompanyId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const loading = isContextLoading || isSwrLoading || !employees;

  return (
    <div className="flex flex-col w-full max-w-full py-6 md:py-12 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PREMIUM BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-green-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full -z-10" />

      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16 px-2">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]" />
             <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Gestión de Capital Humano</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
            Unidades <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500">Operativas</span>
          </h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-5 flex items-center gap-3">
            <Users size={12} className="text-green-500" />
            INTELIGENCIA DE EQUIPO / v2.5
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto relative z-10">
          <button className="flex items-center justify-center gap-6 bg-white/5 text-slate-500 border border-white/5 px-10 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all shadow-2xl">
            <span>Exportar Auditoría</span>
          </button>
          <button className="flex items-center justify-center gap-6 bg-white text-slate-900 px-10 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-green-500 hover:text-white transition-all active:scale-95 group">
            <span>Desplegar Personal</span>
            <Zap size={16} className="group-hover:fill-current" />
          </button>
        </div>
      </header>

      {/* METRICS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 relative z-10">
        <MetricSmall title="Personal Activo" value={loading ? '..' : employees.length} icon={User} />
        <MetricSmall title="Registros 24h" value="1.2k" icon={Activity} />
        <MetricSmall title="Security Score" value="A+" icon={ShieldCheck} />
        <MetricSmall title="Cumplimiento" value="99%" icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
        {/* ORGANIZATION MATRIX */}
        <div className="lg:col-span-2 bg-white/5 rounded-[48px] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-3xl">
          <div className="p-10 md:p-12 bg-white/5 flex justify-between items-center border-b border-white/5">
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600 italic">Matriz de Organización</h2>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
               <span className="text-[8px] font-black text-green-500 uppercase tracking-widest italic">Live_Sync</span>
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-40 text-center flex flex-col items-center">
                 <RefreshCcw size={48} className="text-green-500 animate-spin opacity-20 mb-10" />
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[1em] animate-pulse">Neural_Sync_Active</p>
              </div>
            ) : employees.length > 0 ? (
              employees.map((emp) => (
                <div key={emp.id} className="p-10 md:p-12 flex items-center justify-between hover:bg-white/[0.03] transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 w-1 h-0 bg-green-500 group-hover:h-full transition-all duration-500" />
                  
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="w-16 h-16 bg-white/5 rounded-[26px] border border-white/10 flex items-center justify-center font-black text-slate-500 text-sm shadow-2xl group-hover:bg-green-500 group-hover:text-slate-900 group-hover:border-transparent transition-all duration-500 italic">
                      {emp.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[16px] font-black text-white uppercase italic tracking-tight group-hover:text-green-500 transition-colors duration-500">{emp.full_name}</p>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mt-2 flex items-center gap-3">
                         <span className="text-slate-500">{emp.position || 'OPERATIVO'}</span>
                         <span className="opacity-20">//</span>
                         <span className="text-slate-700">{emp.contract_type || 'ESTÁNDAR'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="hidden sm:flex items-center gap-3 bg-green-500/10 px-5 py-2.5 rounded-xl border border-green-500/20 shadow-xl">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                      <span className="text-[9px] font-black text-green-500 uppercase tracking-widest italic">ACTIVE_NODE</span>
                    </div>
                    <ArrowUpRight size={20} className="text-slate-700 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-40 text-center flex flex-col items-center">
                  <div className="w-24 h-24 bg-white/5 rounded-[40px] border border-white/5 flex items-center justify-center mb-10 text-slate-800">
                    <Fingerprint size={48} strokeWidth={1} />
                  </div>
                  <p className="max-w-md text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] leading-loose italic text-center">No se detectaron registros de personal. Inicie nodos organizativos para rastrear la evolución del capital.</p>
              </div>
            )}
          </div>
        </div>

        {/* SECURITY LOGS WIDGET */}
        <div className="bg-[#010409] rounded-[48px] border border-white/5 shadow-2xl p-10 flex flex-col overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[120px] rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-150 duration-1000" />
          
          <div className="relative z-10 flex flex-col h-full">
              <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-white mb-12 flex items-center gap-4 italic">
               <Lock size={16} className="text-green-500" />
               Security Registry
             </h2>
             
             <div className="space-y-6 flex-grow">
                 <SecurityEvent type="LOGIN_SUCCESS" user="A. Silva" time="Now" color="text-green-500" bg="bg-green-500/10" border="border-green-500/20" />
                 <SecurityEvent type="SCHEMA_MOD" user="Ouroborus" time="15m" color="text-blue-500" bg="bg-blue-500/10" border="border-blue-500/20" />
                 <SecurityEvent type="KEY_ROTATION" user="Root_Admin" time="2h" color="text-amber-500" bg="bg-amber-500/10" border="border-amber-500/20" />
                 <SecurityEvent type="DATA_EXPORT" user="M. Gomez" time="5h" color="text-slate-400" bg="bg-white/5" border="border-white/10" />
             </div>
             
             <div className="mt-12 pt-10 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Cpu size={14} className="text-slate-800" />
                   <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] italic">Escudo Neural: v2.5</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}


interface SecurityEventProps {
  type: string;
  user: string;
  time: string;
  color: string;
  bg: string;
  border: string;
}

function SecurityEvent({ type, user, time, color, bg, border }: SecurityEventProps) {
  return (
    <div className={`p-6 bg-white/5 rounded-[32px] border border-white/5 backdrop-blur-md transition-all hover:bg-white/[0.08] hover:border-white/10 group/event cursor-pointer relative overflow-hidden`}>
       <div className={`absolute top-0 right-0 w-16 h-16 blur-2xl opacity-10 ${bg}`} />
       
       <div className="flex justify-between items-center mb-4 relative z-10">
          <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${bg} ${color} ${border} italic`}>{type}</span>
          <span className="text-[9px] text-slate-700 font-black uppercase tracking-widest">{time}</span>
       </div>
        <div className="flex items-center gap-3 relative z-10">
           <div className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover/event:bg-white transition-colors" />
           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover/event:text-white transition-colors duration-500">Node_ID <span className="text-slate-400 opacity-60 ml-1">#</span>{user}</p>
        </div>
    </div>
  );
}
