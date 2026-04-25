'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  User, 
  ShieldCheck, 
  Zap, 
  Settings2,
  Lock,
  Fingerprint,
  Building2,
  Cpu,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { MetricSmall } from '@/components/ui/MetricSmall';
import Image from 'next/image';

interface UserProfile {
  id: string;
  email?: string;
  role: string;
  created_at?: string;
}

interface CompanyMinimal {
  id: string;
  name: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<CompanyMinimal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const activeCompanyId = localStorage.getItem('arise_active_company');
      
      const [uRes, cRes] = await Promise.all([
        supabase.from('profiles').select('id, email, role, created_at'),
        supabase.from('companies').select('id, name')
      ]);
      
      setUsers(uRes.data || []);
      setCompanies(cRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col w-full max-w-full py-2 md:py-4 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#22c55e]/5 blur-[64px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#0f172a]/5 blur-[64px] rounded-full -z-10" />

      {/* HEADER SECTION - ASLAS STYLE (Optimized Scales) */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6 px-2 relative z-10">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            Búnker de <span className="text-[#22c55e]">Acceso</span>
          </h1>
          <p className="text-slate-400 text-[6px] font-black uppercase tracking-[0.3em] mt-2.5 flex items-center gap-2">
            <Lock size={8} className="text-[#22c55e]" />
            SEGURIDAD E IDENTIDAD / v2.5
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 bg-[#0f172a] text-white px-4 py-2.5 rounded-xl text-[7.5px] font-black uppercase tracking-widest shadow-sm hover:bg-[#22c55e] transition-all active:scale-95 group">
          <span>Autorizar Operador</span>
          <UserPlus size={12} />
        </button>
      </header>

      {/* METRICS SECTION - COMPACT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10">
        <MetricSmall title="Operadores Activos" value={loading ? '..' : users.length} icon={User} />
        <MetricSmall title="Unidades Link" value={loading ? '..' : companies.length} icon={Building2} />
        <MetricSmall title="Estado Búnker" value="Industrial" icon={ShieldCheck} />
        <MetricSmall title="Integridad DNA" value="100%" icon={Zap} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* IDENTITY VAULT LIST - COMPACT */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-5 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
            <h2 className="text-[7.5px] font-black uppercase tracking-[0.3em] text-slate-400">Registro de Bóveda</h2>
            <span className="text-[6.5px] font-black bg-white text-[#22c55e] px-2.5 py-0.5 rounded-lg uppercase tracking-widest border border-[#22c55e]/20 shadow-sm">OPERADORES_{users.length}</span>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center">
                 <Cpu size={20} className="text-[#22c55e] animate-spin opacity-20 mb-3" />
                 <p className="text-[6.5px] font-black text-slate-300 uppercase tracking-[0.4em] animate-pulse">Neural_Sync_Active</p>
              </div>
            ) : users.map(user => (
              <div key={user.id} className="p-4 md:p-5 flex items-center justify-between hover:bg-slate-50/30 transition-all group cursor-pointer relative overflow-hidden">
                <div className="absolute left-0 w-1 h-0 bg-[#22c55e] group-hover:h-full transition-all duration-500" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-9 h-9 bg-white text-slate-900 rounded-lg border border-slate-100 flex items-center justify-center font-black text-[10px] shadow-sm group-hover:bg-[#22c55e] group-hover:text-white transition-all duration-500">
                    {user.email?.[0].toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight group-hover:text-[#22c55e] transition-colors duration-500">{user.email || 'N_A'}</p>
                    <p className="text-[6px] font-mono text-slate-300 mt-0.5 uppercase tracking-widest">NODE_ID: {user.id.substring(0, 12).toUpperCase()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 relative z-10">
                  <div className="text-right hidden sm:block">
                    <p className="text-[5px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Rol de Acceso</p>
                    <p className="text-[7px] font-black text-[#22c55e] uppercase tracking-widest bg-[#22c55e]/5 px-2 py-0.5 rounded-md border border-[#22c55e]/10">{user.role}</p>
                  </div>
                  <button className="w-7 h-7 flex items-center justify-center bg-white text-slate-300 hover:bg-slate-50 hover:text-slate-900 rounded-lg border border-slate-100 transition-all shadow-sm">
                    <Settings2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AUTHORIZATION TERMINAL - COMPACT */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#0f172a] rounded-2xl border border-white/5 shadow-xl p-5 flex flex-col overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[80px] rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-1000" />
            
            <div className="relative z-10">
              <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-white mb-5 flex items-center gap-2.5">
                <Zap size={12} className="text-[#22c55e]" />
                Terminal de Acceso
              </h3>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[6px] font-black text-white/40 uppercase tracking-[0.2em] block ml-1">Enlace de Operador</label>
                  <select className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-[8px] font-black uppercase tracking-widest text-white outline-none focus:bg-white/10 transition-all appearance-none cursor-pointer">
                    {users.map(u => <option key={u.id} value={u.id} className="bg-[#0f172a]">{u.email || u.id.substring(0, 8)}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[6px] font-black text-white/40 uppercase tracking-[0.2em] block ml-1">Unidad Operativa</label>
                  <select className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-[8px] font-black uppercase tracking-widest text-white outline-none focus:bg-white/10 transition-all appearance-none cursor-pointer">
                    {companies.map(c => <option key={c.id} value={c.id} className="bg-[#0f172a]">{c.name}</option>)}
                  </select>
                </div>

                <button className="w-full bg-[#22c55e] text-white py-3.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-white hover:text-slate-900 transition-all active:scale-95 mt-1">
                  Otorgar Acceso
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#22c55e] opacity-20" />
            <div className="flex items-start gap-3">
               <Fingerprint size={10} className="text-slate-100 mt-0.5" />
               <p className="text-[6.5px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">
                 * Las autorizaciones son auditadas por el Escudo Neural v2.5.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
