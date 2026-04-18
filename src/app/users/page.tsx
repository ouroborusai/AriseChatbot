'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [uRes, cRes] = await Promise.all([
        supabase.from('user_profiles').select('*'),
        supabase.from('companies').select('id, legal_name')
      ]);
      setUsers(uRes.data || []);
      setCompanies(cRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <main className="p-10">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Identity Center</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">OS Ejecutivo Neural / v6.22 Industrial Edition</p>
        </div>
        <button className="btn-arise">+ Authorize User</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <MetricSmall title="Active Operators" value={loading ? '..' : users.length} icon="" />
        <MetricSmall title="Connected Units" value={loading ? '..' : companies.length} icon="" />
        <MetricSmall title="Security LeveL" value="Industrial" icon="" />
        <MetricSmall title="Sync Integrity" value="100%" icon="" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 arise-card">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linked Operators</h2>
            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">Total Registry: {users.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-10 text-center animate-pulse text-slate-300 font-bold uppercase tracking-widest text-[10px]">Accessing Identity Vault...</div>
            ) : users.map(user => (
              <div key={user.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                    {user.email?.[0].toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{user.email || 'N/A'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {user.id.substring(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Global Permissions</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-wider">{user.role}</p>
                  </div>
                  <button className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all flex items-center justify-center text-slate-400"></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 text-white">
          <div className="arise-card bg-neural-dark border-none p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-8">Fast Authorization</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Operator</label>
                <select className="w-full bg-slate-800 border-none rounded-xl p-3 text-xs font-bold text-white outline-none ring-primary focus:ring-1">
                  {users.map(u => <option key={u.id} value={u.id}>{u.email || u.id}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Assign to Company</label>
                <select className="w-full bg-slate-800 border-none rounded-xl p-3 text-xs font-bold text-white outline-none ring-primary focus:ring-1">
                  {companies.map(c => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
                </select>
              </div>

              <button className="btn-arise w-full py-4 text-[10px]">
                Grant Industrial Access
              </button>
            </div>
          </div>

          <div className="arise-card p-6 bg-slate-50/50 border-dashed">
            <p className="text-[9px] font-bold text-slate-400 tracking-wide leading-relaxed italic">
              * Access authorizations are audited by the Arise v6.22 Protocol. Revocation is immediate across all synchronized endpoints.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function MetricSmall({ title, value, icon }: any) {
  return (
    <div className="arise-card p-6">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">{icon}</div>
      </div>
      <h3 className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{value}</h3>
    </div>
  );
}
