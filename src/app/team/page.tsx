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
    <main className="p-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Personnel & Security</h1>
        <p className="text-slate-500 font-medium mt-1">Human Resources & System Compliance Monitoring</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatMini title="Headcount" value={loading ? '..' : employees.length} />
        <StatMini title="Audit Logs (24h)" value="1.2k" />
        <StatMini title="Security Score" value="A+" />
        <StatMini title="Upcoming Rulings" value="2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 executive-card p-0 overflow-hidden">
          <div className="p-8 border-b border-base flex justify-between items-center">
            <h2 className="text-xl font-bold">Organization Members</h2>
            <div className="flex gap-2">
                <button className="px-3 py-1 bg-base text-slate-500 rounded-base text-[10px] font-bold uppercase hover:bg-slate-200 transition-colors">Export</button>
                <button className="px-3 py-1 bg-primary text-white rounded-base text-[10px] font-bold uppercase hover:opacity-90 transition-opacity">Add Employee</button>
            </div>
          </div>
          <div className="divide-y divide-base">
            {loading ? (
              <div className="p-8 text-center animate-pulse text-slate-300">Syncing Team Data...</div>
            ) : employees.length > 0 ? (
              employees.map((emp) => (
                <EmployeeRow 
                  key={emp.id} 
                  name={emp.full_name} 
                  position={emp.position || 'Staff'} 
                  dept={emp.contract_type || 'General'} 
                  status="Active" 
                />
              ))
            ) : (
              <p className="p-8 text-center text-sm text-slate-400">No personnel records found.</p>
            )}
          </div>
        </section>

        <section className="executive-card p-8">
          <h2 className="text-xl font-bold mb-6">Security Events</h2>
          <div className="space-y-4">
             <SecurityEvent type="Login" user="A. Silva" time="Just Now" />
             <SecurityEvent type="Schema Edit" user="System" time="15m ago" />
             <SecurityEvent type="Key Rotation" user="Admin" time="2h ago" />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatMini({ title, value }: any) {
  return (
    <div className="executive-card p-6">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function EmployeeRow({ name, position, dept, status }: any) {
  return (
    <div className="flex items-center justify-between p-6 hover:bg-base/20 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-base flex items-center justify-center font-bold text-primary">
           {name.split(' ').map((n:any) => n[0]).join('')}
        </div>
        <div>
           <p className="font-bold text-slate-900">{name}</p>
           <p className="text-xs text-slate-500 font-medium">{position} • {dept}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
         <div className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-amber-500'}`} />
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{status}</span>
      </div>
    </div>
  );
}

function SecurityEvent({ type, user, time }: any) {
  return (
    <div className="p-3 bg-base/40 rounded-base border-l-2 border-primary">
       <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">{type}</span>
          <span className="text-[10px] text-slate-400 font-medium">{time}</span>
       </div>
       <p className="text-xs text-slate-600">Action performed by <span className="font-bold text-slate-900">{user}</span></p>
    </div>
  );
}

