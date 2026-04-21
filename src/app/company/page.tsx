'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  Globe, 
  Zap, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

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
      const { data } = await supabase.from('companies').select('*').limit(1).single();
      setCompany(data);
      setLoading(false);
    }
    fetchCompany();
  }, []);

  return (
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">Operational_Node</h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <Activity size={10} className="text-primary" />
            Unit Configuration & Governance / v9.0 
          </p>
        </div>
        <button className="flex items-center justify-center gap-4 bg-primary text-white px-8 py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          <span>Authorize_Credential_Update</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[32px] shadow-arise border-none p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none rotate-12">
               <Globe className="text-slate-900" size={160} strokeWidth={1} />
            </div>
            
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-12 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" /> 
              Legal_Entity_Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-12">
              <div className="space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Business_Nomenclature</p>
                <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{company?.legal_name || 'INITIALIZING...'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Taxation_Identity_RUT</p>
                <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter font-mono">{company?.rut || 'NOT_DECLARED'}</p>
              </div>
              <div className="space-y-4">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Industrial_Matrix_Segment</p>
                <div className="inline-flex px-5 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  {company?.segment || 'INDUSTRIAL_STANDARD'}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Node_Deployment_Timestamp</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                  {company?.created_at ? new Date(company.created_at).toLocaleString() : 'PENDING_INIT'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#f7f9fb] p-10 rounded-[32px] border-none shadow-sm relative group overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-30" />
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-10 flex items-center justify-between">
               Operational_Metadata
               <Zap size={12} className="text-primary animate-pulse" />
             </h3>
             <div className="bg-[#0a0c10] p-8 rounded-2xl border-none shadow-2xl relative">
               <div className="absolute top-4 right-4 flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-red-500/20" />
                 <div className="w-2 h-2 rounded-full bg-amber-500/20" />
                 <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
               </div>
               <pre className="text-[10px] leading-relaxed text-emerald-500/70 font-mono overflow-x-auto scrollbar-hide">
                 {JSON.stringify(company?.metadata || { status: "ACTIVE", core: "Arise_v9.0" }, null, 2)}
               </pre>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-10">
          <div className="bg-[#0a0c10] rounded-[40px] shadow-2xl p-10 flex flex-col overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -mr-32 -mt-32" />
            <div className="relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-4 flex items-center gap-3">
                <ShieldCheck size={14} />
                Security_Uplink
              </h3>
              <p className="text-[10px] font-black text-white/50 mb-8 leading-loose uppercase tracking-widest">Protocol v9.0 Active. Identity nodes synchronized across the industrial multi-tenant gateway.</p>
              
              <div className="space-y-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Integrity_Score</span>
                  <span className="text-[10px] font-black text-emerald-400">94.8%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[94%] shadow-[0_0_15px_#10b981] animate-in slide-in-from-left duration-1000" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-arise p-10 border-none overflow-hidden relative">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-10">Trust_Certifications</h3>
            <ul className="space-y-6">
               {['SII_Sync_Compliance', 'Global_Payroll_Node', 'Arise_Neural_Trust_v7'].map(item => (
                 <li key={item} className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest group cursor-pointer hover:text-primary transition-all">
                   <div className="w-8 h-8 rounded-xl bg-[#f2f4f6] flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                     <CheckCircle2 size={14} />
                   </div>
                   {item}
                 </li>
               ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
