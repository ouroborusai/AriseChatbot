'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
    <main className="p-10">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Personnel & Security</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">OS Ejecutivo Neural / v6.22 Industrial Edition</p>
        </div>
        <div className="flex gap-4">
          <button className="btn-arise-outline">Export Directory</button>
          <button className="btn-arise">+ Add Personnel</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <MetricSmall title="Active Headcount" value={loading ? '..' : employees.length} icon="" />
        <MetricSmall title="Audit Logs (24h)" value="1.2k" icon="" />
        <MetricSmall title="Security Score" value="A+" icon="" />
        <MetricSmall title="Compliance" value="99%" icon="" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 arise-card">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization Members</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-10 text-center animate-pulse text-slate-300 font-bold uppercase tracking-widest text-[10px]">Syncing Personnel Data...</div>
            ) : employees.length > 0 ? (
              employees.map((emp) => (
                <div key={emp.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-primary text-xs">
                      {emp.full_name.split(' ').map((n:any) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{emp.full_name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{emp.position || 'Staff'} • {emp.contract_type || 'General'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No personnel records found.</p>
            )}
          </div>
        </div>

        <div className="arise-card">
          <div className="p-6 border-b border-slate-50">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Events</h2>
          </div>
          <div className="p-6 space-y-4">
             <SecurityEvent type="Login" user="A. Silva" time="Just Now" color="text-primary" />
             <SecurityEvent type="Schema Edit" user="System" time="15m ago" color="text-amber-500" />
             <SecurityEvent type="Key Rotation" user="Admin" time="2h ago" color="text-emerald-500" />
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

function SecurityEvent({ type, user, time, color }: any) {
  return (
    <div className="p-4 bg-slate-50 rounded-2xl border-l border-primary/20">
       <div className="flex justify-between items-center mb-1">
          <span className={`text-[9px] font-black uppercase tracking-tighter ${color}`}>{type}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase">{time}</span>
       </div>
       <p className="text-[10px] text-slate-500 font-medium">By <span className="text-slate-900 font-bold">{user}</span></p>
    </div>
  );
}
