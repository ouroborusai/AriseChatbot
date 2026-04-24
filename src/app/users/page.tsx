'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  User, 
  ShieldCheck, 
  Zap, 
  Settings2 
} from 'lucide-react';
import { MetricSmall } from '@/components/ui/MetricSmall';

interface User {
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
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<CompanyMinimal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">Búnker de Identidad</h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <Activity size={10} className="text-primary" />
            Protocolo de Seguridad e Identidad / v9.0
          </p>
        </div>
        <button className="flex items-center justify-center gap-4 bg-primary text-white px-8 py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          <span>Autorizar Operador</span>
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <MetricSmall title="Operadores Activos" value={loading ? '..' : users.length} icon={User} />
        <MetricSmall title="Unidades Conectadas" value={loading ? '..' : companies.length} icon={ShieldCheck} />
        <MetricSmall title="Nivel de Seguridad" value="Industrial" icon={Activity} />
        <MetricSmall title="Integridad de Sincronización" value="100%" icon={Zap} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[32px] shadow-arise border-none overflow-hidden">
          <div className="p-10 bg-slate-50 flex justify-between items-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Registro de Bóveda de Identidad</h2>
            <span className="text-[8px] font-black bg-white text-slate-400 px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">Operadores {users.length}</span>
          </div>
          <div className="divide-y-0">
            {loading ? (
              <div className="p-20 text-center animate-pulse text-slate-300 font-black uppercase tracking-widest text-[10px]">Accediendo a la Bóveda de Identidad...</div>
            ) : users.map(user => (
              <div key={user.id} className="p-10 flex items-center justify-between hover:bg-slate-50 transition-all group cursor-pointer border-none">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-[24px] flex items-center justify-center font-black text-sm shadow-xl italic">
                    {user.email?.[0].toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{user.email || 'N/A'}</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-2 uppercase tracking-widest opacity-60">OP_ID: {user.id.substring(0, 12)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Rol de Acceso</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{user.role}</p>
                  </div>
                  <button className="w-12 h-12 flex items-center justify-center bg-[#f2f4f6] text-slate-300 hover:text-slate-900 rounded-2xl shadow-sm transition-all"><Settings2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-[#0a0c10] rounded-[40px] shadow-2xl p-10 flex flex-col overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -mr-32 -mt-32" />
            
            <div className="relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-12 flex items-center gap-3">
                <Zap size={14} />
                Terminal de Autorización Rápida
              </h3>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] block">Enlace de Operador</label>
                  <select className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:bg-white/10 transition-all">
                    {users.map(u => <option key={u.id} value={u.id} className="bg-slate-900">{u.email || u.id.substring(0, 8)}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] block">Unidad Operativa</label>
                  <select className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:bg-white/10 transition-all">
                    {companies.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                  </select>
                </div>

                <button className="w-full bg-primary text-white py-5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  Otorgar Acceso Industrial
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[32px] border-none shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-20" />
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-loose italic">
              * Las autorizaciones de acceso son auditadas por el Escudo Neural LOOP v9.0. Todas las operaciones de terminal se registran vía telemetría operativa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

