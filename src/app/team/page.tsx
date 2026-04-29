'use client';

export const dynamic = 'force-dynamic';

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
  MoreVertical,
  Search
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
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-300 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full -z-10" />

      {/* HEADER SECTION - ASLAS STYLE (Optimized Scales) */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-12 mb-24 px-4 relative z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="relative">
          <h1 className="text-h1-mobile md:text-h1 font-black text-neural-dark tracking-tighter leading-[0.85] uppercase italic">
            Equipo <span className="text-primary drop-shadow-xl">Humano.</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-10 flex items-center gap-4 italic opacity-60">
            <Users size={16} className="text-primary animate-pulse" />
            INTELIGENCIA_DE_CAPITAL_//_v10.4_PLATINUM
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto relative z-10">
          <div className="relative group">
             <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors z-20" />
             <input 
               type="text"
               placeholder="BUSCAR_PERSONAL_..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-white border border-slate-100 pl-14 pr-8 py-5 rounded-xl text-[10px] font-black uppercase tracking-widest text-neural-dark focus:outline-none focus:border-primary/50 focus:shadow-2xl transition-all w-full sm:w-80 placeholder:text-slate-200 italic"
             />
          </div>
          <button className="flex items-center justify-center gap-5 bg-accent text-white px-10 py-5 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-primary transition-all active:scale-95 group italic ring-1 ring-white/10">
            <span>DESPLEGAR_PERSONAL</span>
            <Zap size={18} className="group-hover:fill-current group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </header>

      {/* METRICS SECTION - PLATINUM SCALES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16 relative z-10 px-2">
        <MetricSmall title="Personal Activo" value={loading ? '..' : employees.length} icon={User} />
        <MetricSmall title="Registros 24h" value="1.2k" drift="+15%" icon={Activity} />
        <MetricSmall title="Security Score" value="A+" drift="OPTIMAL" icon={ShieldCheck} />
        <MetricSmall title="Cumplimiento" value="99%" drift="STABLE" icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10 px-2">
        {/* ORGANIZATION MATRIX - PLATINUM */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="p-8 bg-slate-50/50 flex justify-between items-center border-b border-slate-100 italic">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 opacity-60">Matriz_de_Organización.</h2>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
               <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">LIVE_SYNC_ACTIVE</span>
            </div>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-32 text-center flex flex-col items-center">
                 <RefreshCcw size={40} className="text-primary animate-spin opacity-20 mb-6" />
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse italic">NEURAL_SYNC_PROCESSING_...</p>
              </div>
            ) : filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp: any) => (
                <div key={emp.id} className="p-8 md:p-10 flex items-center justify-between hover:bg-slate-50/50 transition-all duration-500 group cursor-pointer relative overflow-hidden italic">
                  <div className="absolute left-0 w-2 h-0 bg-primary group-hover:h-full transition-all duration-700" />
                  
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center font-black text-slate-300 text-lg shadow-inner group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all duration-700">
                      {emp.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-neural-dark uppercase tracking-tight group-hover:text-primary transition-colors duration-500">{emp.full_name}</p>
                      <div className="flex items-center gap-4 mt-2">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">{emp.position || 'OPERATIVO_LINEA'}</span>
                         <span className="text-[10px] text-slate-200 font-light opacity-30">|</span>
                         <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] bg-primary/5 px-3 py-1 rounded-xl border border-primary/10 shadow-sm">{emp.contract_type || 'ESTÁNDAR_NODE'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="hidden sm:flex items-center gap-3 bg-white px-5 py-2 rounded-xl border border-slate-100 shadow-xl opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0 transition-all duration-700">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">VER_EXPEDIENTE</span>
                    </div>
                    <button className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-200 hover:text-neural-dark hover:border-primary/30 transition-all duration-500 shadow-sm hover:shadow-2xl hover:scale-110">
                       <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-32 text-center flex flex-col items-center bg-slate-50/30">
                  <div className="w-24 h-24 bg-white rounded-xl border border-slate-100 border-dashed flex items-center justify-center mb-8 text-slate-200 shadow-inner">
                    <Fingerprint size={48} strokeWidth={1} />
                  </div>
                  <p className="max-w-xs text-slate-300 text-[11px] font-black uppercase tracking-[0.4em] leading-relaxed text-center italic opacity-60">NO_SE_DETECTARON_REGISTROS_COMPATIBLES.</p>
              </div>
            )}
          </div>
        </div>

        {/* SECURITY LOGS WIDGET - PLATINUM NEURAL SHIELD */}
        <div className="bg-neural-dark rounded-xl border border-white/5 shadow-2xl p-10 flex flex-col overflow-hidden relative group animate-in fade-in slide-in-from-right-8 duration-1000 italic">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-150 duration-1000" />
          
          <div className="relative z-10 flex flex-col h-full">
              <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white mb-10 flex items-center gap-4">
               <Lock size={18} className="text-primary animate-pulse" />
               Neural_Shield_Registry.
             </h2>
             
             <div className="space-y-5 flex-grow">
                 <SecurityEvent type="LOGIN_OK" user="A. Silva" time="Now" color="text-primary" bg="bg-primary/10" border="border-primary/20" />
                 <SecurityEvent type="SYNC_MOD" user="Ouroborus" time="15m" color="text-primary" bg="bg-primary/10" border="border-primary/20" />
                 <SecurityEvent type="KEY_ROT" user="Admin_Node" time="2h" color="text-accent" bg="bg-accent/10" border="border-accent/20" />
             </div>
             
             <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <Cpu size={16} className="text-white/20" />
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Neural_Escudo_//_v10.4_PLATINUM</p>
                </div>
                <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_15px_#22c55e]" />
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
