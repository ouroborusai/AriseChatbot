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
        supabase
          .from('profiles')
          .select('id, email, created_at, user_company_access!inner(role)')
          .eq('user_company_access.company_id', activeCompanyId),
        supabase.from('companies').select('id, name')
      ]);
      
      const mappedUsers = (uRes.data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.user_company_access?.[0]?.role || 'Operador',
        created_at: u.created_at
      }));

      setUsers(mappedUsers);
      setCompanies(cRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 blur-[64px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent/5 blur-[64px] rounded-full -z-10" />

      {/* HEADER SECTION - PREMIUM ASLAS STYLE */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-20 px-2 relative z-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="relative">
          <h1 className="text-h1-mobile md:text-h1 font-black text-neural-dark tracking-tighter leading-[0.9] uppercase">
            Gestión de <br/><span className="text-primary">Acceso</span>
          </h1>
          <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.4em] mt-6 flex items-center gap-2.5">
            <Lock size={12} className="text-primary" />
            CONTROL DE ACCESO NEURAL / v10.4 PLATINUM
          </p>
        </div>

        <button className="btn-loop flex items-center justify-center gap-4 bg-accent text-white px-8 py-3.5 text-[8px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-primary transition-all active:scale-95 group">
          <span>Autorizar Operador</span>
          <UserPlus size={16} className="group-hover:rotate-12 transition-transform" />
        </button>
      </header>

      {/* METRICS SECTION - GLASSMORPISM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 relative z-10 px-1">
        <MetricSmall title="Operadores Activos" value={loading ? '..' : users.length} icon={User} />
        <MetricSmall title="Unidades Link" value={loading ? '..' : companies.length} icon={Building2} />
        <MetricSmall title="Integridad DNA" value="100%" icon={Zap} />
        <MetricSmall title="Estado Búnker" value="ACTIVO" icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 px-1">
        {/* IDENTITY VAULT LIST - COMPACT & PREMIUM */}
        <div className="lg:col-span-8 bg-white border border-slate-100 overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="p-8 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center gap-4">
               <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Directorio de Operadores</h2>
            </div>
            <span className="text-[8px] font-black bg-white text-primary px-4 py-1.5 uppercase tracking-widest border border-primary/10 shadow-sm" style={{ borderRadius: 'var(--radius-sm)' }}>
               NODOS_ACTIVOS: {users.length}
            </span>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-24 text-center flex flex-col items-center">
                 <Cpu size={32} className="text-[#22c55e] animate-spin opacity-20 mb-4" />
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">Neural_Sync_Active</p>
              </div>
            ) : users.length > 0 ? (
              users.map(user => (
                <div key={user.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 w-2 h-0 bg-primary group-hover:h-full transition-all duration-700" />
                  
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="w-12 h-12 bg-white text-neural-dark border border-slate-100 flex items-center justify-center font-black text-xs shadow-sm group-hover:bg-primary group-hover:text-white group-hover:border-transparent group-hover:scale-105 transition-all duration-500" style={{ borderRadius: 'var(--radius-md)' }}>
                      {user.email?.[0].toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-neural-dark uppercase tracking-tight group-hover:text-primary transition-colors duration-500">{user.email || 'N_A'}</p>
                      <div className="flex items-center gap-3 mt-2">
                         <span className="text-[8px] font-mono text-slate-300 uppercase tracking-widest">NODE_ID: {user.id.substring(0, 12).toUpperCase()}</span>
                         <span className="w-1.5 h-1.5 bg-slate-100 rounded-full" />
                         <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">ACTIVO</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="text-right hidden sm:block">
                      <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1.5 opacity-60">Permisos Operativos</p>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-1.5 border border-primary/10 shadow-sm" style={{ borderRadius: 'var(--radius-sm)' }}>{user.role}</p>
                    </div>
                    <button className="w-11 h-11 flex items-center justify-center bg-white text-slate-300 hover:bg-accent hover:text-white border border-slate-100 transition-all shadow-sm active:scale-90 group/btn" style={{ borderRadius: 'var(--radius-md)' }}>
                      <Settings2 size={16} className="group-hover/btn:rotate-45 transition-transform" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-24 text-center">
                 <Fingerprint size={48} strokeWidth={1} className="mx-auto text-slate-100 mb-6" />
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">No se detectaron perfiles operativos</p>
              </div>
            )}
          </div>
        </div>

        {/* SECURITY TERMINAL - COMPACT & DARK */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-accent border border-white/5 shadow-2xl p-8 flex flex-col overflow-hidden relative group" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[100px] rounded-full -mr-24 -mt-24 animate-pulse" />
            
            <div className="relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white mb-10 flex items-center gap-4">
                <ShieldCheck size={18} className="text-primary" />
                Terminal de Seguridad
              </h3>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] block ml-1">Seleccionar Operador</label>
                  <div className="relative">
                    <select className="w-full bg-white/5 border border-white/5 p-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:bg-white/10 focus:border-primary/30 transition-all appearance-none cursor-pointer pr-10" style={{ borderRadius: 'var(--radius-md)' }}>
                      {users.map(u => <option key={u.id} value={u.id} className="bg-accent">{u.email || u.id.substring(0, 8)}</option>)}
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 rotate-90" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] block ml-1">Vincular Unidad</label>
                  <div className="relative">
                    <select className="w-full bg-white/5 border border-white/5 p-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:bg-white/10 focus:border-primary/30 transition-all appearance-none cursor-pointer pr-10" style={{ borderRadius: 'var(--radius-md)' }}>
                      {companies.map(c => <option key={c.id} value={c.id} className="bg-accent">{c.name}</option>)}
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 rotate-90" />
                  </div>
                </div>

                <button className="btn-loop w-full bg-primary text-white py-4 text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-white hover:text-accent transition-all active:scale-95 mt-4 group/auth">
                  <span className="flex items-center justify-center gap-3">
                    Conceder Autorización
                    <Zap size={16} className="group-hover/auth:fill-current" />
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 shadow-sm relative overflow-hidden group" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#22c55e] opacity-20" />
            <div className="flex items-start gap-4">
               <Fingerprint size={16} className="text-slate-100 mt-0.5 group-hover:text-[#22c55e]/20 transition-colors" />
               <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.25em] leading-relaxed">
                 * Las modificaciones en privilegios son registradas por el núcleo auditivo de LOOP Intelligence.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
