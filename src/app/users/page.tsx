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
    <div className="flex flex-col w-full max-w-full py-6 md:py-12 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PREMIUM BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-green-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full -z-10" />

      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16 px-2">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]" />
             <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Protocolo de Identidad</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
            Búnker de <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500">Acceso</span>
          </h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-5 flex items-center gap-3">
            <Lock size={12} className="text-green-500" />
            SEGURIDAD E IDENTIDAD / v2.5
          </p>
        </div>

        <button className="flex items-center justify-center gap-6 bg-white text-slate-900 px-10 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-green-500 hover:text-white transition-all active:scale-95 group relative z-10">
          <span>Autorizar Operador</span>
          <UserPlus size={16} className="group-hover:scale-110 transition-transform" />
        </button>
      </header>

      {/* METRICS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 relative z-10">
        <MetricSmall title="Operadores Activos" value={loading ? '..' : users.length} icon={User} />
        <MetricSmall title="Unidades Link" value={loading ? '..' : companies.length} icon={Building2} />
        <MetricSmall title="Estado Búnker" value="Industrial" icon={ShieldCheck} />
        <MetricSmall title="Integridad DNA" value="100%" icon={Zap} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
        {/* IDENTITY VAULT LIST */}
        <div className="lg:col-span-2 bg-white/5 rounded-[48px] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-3xl">
          <div className="p-10 md:p-12 bg-white/5 flex justify-between items-center border-b border-white/5">
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600 italic">Registro de Bóveda</h2>
            <span className="text-[9px] font-black bg-white/5 text-green-500 px-4 py-1.5 rounded-xl uppercase tracking-widest border border-green-500/20">OPERADORES_{users.length}</span>
          </div>
          
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-40 text-center flex flex-col items-center">
                 <Cpu size={48} className="text-green-500 animate-spin opacity-20 mb-10" />
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[1em] animate-pulse">Neural_Sync_Active</p>
              </div>
            ) : users.map(user => (
              <div key={user.id} className="p-10 md:p-12 flex items-center justify-between hover:bg-white/[0.03] transition-all group cursor-pointer relative overflow-hidden">
                <div className="absolute left-0 w-1 h-0 bg-green-500 group-hover:h-full transition-all duration-500" />
                
                <div className="flex items-center gap-8 relative z-10">
                  <div className="w-16 h-16 bg-white text-slate-900 rounded-[26px] flex items-center justify-center font-black text-sm shadow-2xl group-hover:bg-green-500 group-hover:text-white transition-all duration-500 italic">
                    {user.email?.[0].toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-[16px] font-black text-white uppercase italic tracking-tight group-hover:text-green-500 transition-colors duration-500">{user.email || 'N_A'}</p>
                    <p className="text-[10px] font-mono text-slate-600 mt-2 uppercase tracking-widest opacity-60">NODE_ID: {user.id.substring(0, 12).toUpperCase()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-12 relative z-10">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">Rol de Acceso</p>
                    <p className="text-[11px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">{user.role}</p>
                  </div>
                  <button className="w-14 h-14 flex items-center justify-center bg-white/5 text-slate-700 hover:bg-white hover:text-slate-900 rounded-2xl border border-white/5 transition-all shadow-xl group-hover:scale-110">
                    <Settings2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AUTHORIZATION TERMINAL */}
        <div className="flex flex-col gap-12">
          <div className="loop-card bg-[#010409] rounded-[48px] border border-white/5 shadow-2xl p-12 flex flex-col overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[120px] rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-150 duration-1000" />
            
            <div className="relative z-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white mb-12 flex items-center gap-4 italic">
                <Zap size={16} className="text-green-500" />
                Terminal de Acceso
              </h3>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block ml-2">Enlace de Operador</label>
                  <select className="w-full bg-white/5 border border-white/5 rounded-[22px] p-5 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:bg-white/10 focus:border-green-500/30 transition-all appearance-none cursor-pointer">
                    {users.map(u => <option key={u.id} value={u.id} className="bg-[#010409]">{u.email || u.id.substring(0, 8)}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block ml-2">Unidad Operativa</label>
                  <select className="w-full bg-white/5 border border-white/5 rounded-[22px] p-5 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:bg-white/10 focus:border-green-500/30 transition-all appearance-none cursor-pointer">
                    {companies.map(c => <option key={c.id} value={c.id} className="bg-[#010409]">{c.name}</option>)}
                  </select>
                </div>

                <button className="w-full bg-green-500 text-slate-900 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-green-500/20 hover:bg-white transition-all active:scale-95 mt-4">
                  Otorgar Acceso Industrial
                </button>
              </div>
            </div>
          </div>

          <div className="loop-card bg-white/5 p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500 opacity-20" />
            <div className="flex items-start gap-4">
               <Fingerprint size={16} className="text-slate-800 mt-1" />
               <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] leading-loose italic">
                 * Las autorizaciones de acceso son auditadas por el Escudo Neural LOOP v2.5. Todas las operaciones de terminal se registran vía telemetría operativa blindada.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
