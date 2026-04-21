'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  User, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';
import { MetricSmall } from '@/components/ui/MetricSmall';

export default function TeamPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeam() {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');
      
      if (data) setEmployees(data);
      setLoading(false);
    }

    fetchTeam();
  }, []);

  return (
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">Operational_Units</h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <Activity size={10} className="text-primary" />
            Human Capital Intelligence / v9.0
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
          <button className="flex items-center justify-center gap-4 bg-[#f2f4f6] text-slate-600 px-8 py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-slate-200 transition-all border-none">
            <span>Audit_Log_Export</span>
          </button>
          <button className="flex items-center justify-center gap-4 bg-primary text-white px-8 py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            <span>Deploy_Personnel</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <MetricSmall title="Active_Headcount" value={loading ? '..' : employees.length} icon={User} />
        <MetricSmall title="Audit_Logs_24h" value="1.2k" icon={Activity} />
        <MetricSmall title="Security_Score" value="A+" icon={ShieldCheck} />
        <MetricSmall title="Compliance_Rate" value="99%" icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[32px] shadow-arise border-none overflow-hidden">
          <div className="p-10 bg-[#f7f9fb] flex justify-between items-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Organization_Member_Matrix</h2>
          </div>
          <div className="divide-y-0">
            {loading ? (
              <div className="p-20 text-center animate-pulse text-slate-300 font-black uppercase tracking-widest text-[10px]">Syncing_Personnel_Nodes...</div>
            ) : employees.length > 0 ? (
              employees.map((emp) => (
                <div key={emp.id} className="p-10 flex items-center justify-between hover:bg-[#f7f9fb] transition-all group cursor-pointer">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#f2f4f6] rounded-[24px] flex items-center justify-center font-black text-primary text-xs shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                      {emp.full_name.split(' ').map((n:any) => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{emp.full_name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{emp.position || 'OPERATIVE'} // {emp.contract_type || 'STANDARD'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-500/10 px-4 py-2 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-32 text-center flex flex-col items-center">
                 <div className="w-24 h-24 bg-[#f2f4f6] rounded-[40px] flex items-center justify-center mb-10 text-slate-200">
                    <User size={48} strokeWidth={1} />
                 </div>
                 <p className="max-w-xs text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] leading-loose">No personnel records detected. Initiate organizational nodes to track capital evolution.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0a0c10] rounded-[40px] shadow-2xl p-10 flex flex-col overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -mr-32 -mt-32" />
          <div className="relative z-10">
             <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-10 flex items-center gap-3">
               <ShieldCheck size={14} />
               Security_Event_Log
             </h2>
             <div className="space-y-6">
                <SecurityEvent type="LOGIN_SUCCESS" user="A. Silva" time="Just Now" color="text-primary" />
                <SecurityEvent type="SCHEMA_MOD" user="Arise_Engine" time="15m ago" color="text-amber-500" />
                <SecurityEvent type="AUTH_KEY_ROT" user="Root_Admin" time="2h ago" color="text-emerald-500" />
             </div>
          </div>
          
          <div className="mt-auto pt-10 border-t border-white/5 relative z-10">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural_Shield: Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}


function SecurityEvent({ type, user, time, color }: any) {
  return (
    <div className="p-6 bg-white/5 rounded-[24px] border border-white/5 backdrop-blur-md transition-all hover:bg-white/10 group cursor-pointer">
       <div className="flex justify-between items-center mb-3">
          <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-md bg-white/5 ${color}`}>{type}</span>
          <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{time}</span>
       </div>
       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Operator: <span className="text-white">{user}</span></p>
    </div>
  );
}
