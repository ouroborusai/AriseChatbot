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
  RefreshCcw,
  MoreVertical
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
    const isGlobal = companyId === 'global';
    let query = supabase
      .from('employees')
      .select('*');
    
    if (!isGlobal) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query.order('full_name');
    
    if (error) throw error;
    return data || [];
  };

  const { data: employees, error: swrError, isLoading: isSwrLoading } = useSWR(
    !isContextLoading && activeCompanyId ? `team_${activeCompanyId}` : null,
    () => fetchTeam(activeCompanyId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const [searchTerm, setSearchTerm] = useState('');
  const loading = isContextLoading || isSwrLoading || !employees;

  const filteredEmployees = employees?.filter((emp: any) => 
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col w-full max-w-full py-4 md:py-8 animate-in fade-in duration-300 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#22c55e]/5 blur-[64px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#0f172a]/5 blur-[64px] rounded-full -z-10" />

      {/* HEADER SECTION - ASLAS STYLE (Optimized Scales) */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8 px-2">
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            Equipo <span className="text-[#22c55e]">Humano</span>
          </h1>
          <p className="text-slate-400 text-[6px] font-black uppercase tracking-[0.3em] mt-2.5 flex items-center gap-2">
            <Users size={8} className="text-[#22c55e]" />
            INTELIGENCIA DE CAPITAL / v2.5
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto relative z-10">
          <div className="relative group">
             <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#22c55e] transition-colors" />
             <input 
               type="text"
               placeholder="BUSCAR PERSONAL..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-white border border-slate-100 pl-11 pr-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-[#22c55e]/30 shadow-sm w-full sm:w-64"
             />
          </div>
          <button className="flex items-center justify-center gap-3 bg-[#0f172a] text-white px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-[#22c55e] transition-all active:scale-95 group">
            <span>Desplegar Personal</span>
            <Zap size={12} className="group-hover:fill-current" />
          </button>
        </div>
      </header>

      {/* METRICS SECTION - COMPACT */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10 px-1">
        <MetricSmall title="Personal Activo" value={loading ? '..' : employees.length} icon={User} />
        <MetricSmall title="Registros 24h" value="1.2k" icon={Activity} />
        <MetricSmall title="Security Score" value="A+" icon={ShieldCheck} />
        <MetricSmall title="Cumplimiento" value="99%" icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* ORGANIZATION MATRIX - COMPACT */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-5 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
            <h2 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Matriz de Organización</h2>
            <div className="flex items-center gap-2">
               <div className="w-1 h-1 bg-[#22c55e] rounded-full animate-pulse" />
               <span className="text-[6px] font-black text-[#22c55e] uppercase tracking-widest">Live_Sync</span>
            </div>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-20 text-center flex flex-col items-center">
                 <RefreshCcw size={24} className="text-[#22c55e] animate-spin opacity-20 mb-4" />
                 <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em] animate-pulse">Neural_Sync_Active</p>
              </div>
            ) : filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp: any) => (
                <div key={emp.id} className="p-4 md:p-5 flex items-center justify-between hover:bg-slate-50/30 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 w-1 h-0 bg-[#22c55e] group-hover:h-full transition-all duration-500" />
                  
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-11 h-11 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-sm group-hover:bg-[#22c55e] group-hover:text-white group-hover:border-transparent transition-all duration-500">
                      {emp.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight group-hover:text-[#22c55e] transition-colors duration-500">{emp.full_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                         <span className="text-[6.5px] font-black text-slate-500 uppercase tracking-widest">{emp.position || 'OPERATIVO'}</span>
                         <span className="text-[10px] text-slate-200 font-light">|</span>
                         <span className="text-[6.5px] font-black text-[#22c55e] uppercase tracking-widest bg-[#22c55e]/5 px-2 py-0.5 rounded border border-[#22c55e]/10">{emp.contract_type || 'ESTÁNDAR'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="hidden sm:flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-1 h-1 rounded-full bg-[#22c55e]" />
                      <span className="text-[6.5px] font-black text-[#22c55e] uppercase tracking-widest">VER_EXPEDIENTE</span>
                    </div>
                    <button className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-200 hover:text-slate-900 hover:border-[#22c55e]/30 transition-all shadow-sm">
                       <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-center mb-6 text-slate-100">
                    <Fingerprint size={32} strokeWidth={1} />
                  </div>
                  <p className="max-w-xs text-slate-300 text-[8px] font-black uppercase tracking-[0.3em] leading-relaxed text-center">No se detectaron registros compatibles.</p>
              </div>
            )}
          </div>
        </div>

        {/* SECURITY LOGS WIDGET - COMPACT */}
        <div className="bg-[#0f172a] rounded-3xl border border-white/5 shadow-xl p-6 flex flex-col overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[80px] rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-1000" />
          
          <div className="relative z-10 flex flex-col h-full">
              <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-white mb-6 flex items-center gap-3">
               <Lock size={14} className="text-[#22c55e]" />
               Security Registry
             </h2>
             
             <div className="space-y-3 flex-grow">
                 <SecurityEvent type="LOGIN_OK" user="A. Silva" time="Now" color="text-[#22c55e]" bg="bg-[#22c55e]/10" border="border-[#22c55e]/20" />
                 <SecurityEvent type="SYNC_MOD" user="Ouroborus" time="15m" color="text-emerald-400" bg="bg-emerald-400/10" border="border-emerald-400/20" />
                 <SecurityEvent type="KEY_ROT" user="Admin" time="2h" color="text-amber-400" bg="bg-amber-400/10" border="border-amber-400/20" />
             </div>
             
             <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Cpu size={12} className="text-white/20" />
                   <p className="text-[6px] font-black text-white/30 uppercase tracking-[0.2em]">Escudo Neural: v2.5</p>
                </div>
                <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full shadow-[0_0_8px_#22c55e]" />
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
    <div className={`p-3.5 bg-white/5 rounded-xl border border-white/5 backdrop-blur-md transition-all hover:bg-white/[0.08] group/event cursor-pointer relative overflow-hidden`}>
       <div className="flex justify-between items-center mb-1.5 relative z-10">
          <span className={`text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${bg} ${color} ${border}`}>{type}</span>
          <span className="text-[7px] text-white/20 font-black uppercase tracking-widest">{time}</span>
       </div>
        <div className="flex items-center gap-2 relative z-10">
           <div className="w-1 h-1 rounded-full bg-white/20 group-hover/event:bg-[#22c55e] transition-colors" />
           <p className="text-[8px] text-white/40 font-black uppercase tracking-widest group-hover/event:text-white transition-colors duration-500">{user}</p>
        </div>
    </div>
  );
}
