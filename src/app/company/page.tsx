'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CompanyPage() {
  const [company, setCompany] = useState<any>(null);
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
    <main className="p-10">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Corporate Profile</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">OS Ejecutivo Neural / v6.22 Industrial Edition</p>
        </div>
        <button className="btn-arise">Update Credentials</button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="arise-card p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <span className="text-9xl font-black">ID</span>
            </div>
            
            <h2 className="text-[10px] font-black uppercase tracking-widest text-primary mb-10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Legal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Business Name</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{company?.legal_name || 'Loading...'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Tax ID (RUT)</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{company?.rut || 'Not Identified'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Industrial Segment</p>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                  {company?.segment || 'Standard'}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Registry Date</p>
                <p className="text-sm font-bold text-slate-400">
                  {company?.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="arise-card p-10 bg-slate-50/50 border-dashed">
             <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6 italic">System Metadata</h3>
             <pre className="text-[10px] leading-relaxed opacity-50 font-mono bg-white p-6 rounded-2xl border border-slate-100">
               {JSON.stringify(company?.metadata || {}, null, 2)}
             </pre>
          </div>
        </div>

        <div className="space-y-6">
          <div className="arise-card bg-neural-dark border-none p-8 text-white">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Security Status</h3>
            <p className="text-xs font-medium text-slate-400 mb-6 leading-relaxed">Arise v6.22 Protocol Active. Identity verification is synchronized with the Multi-Tenant gateway.</p>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-[94%] shadow-[0_0_15px_#10b981]" />
            </div>
          </div>

          <div className="arise-card p-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Certifications</h3>
            <ul className="space-y-4">
               {['Tax Compliance SII', 'Payroll Verified', 'Arise Neural Trust'].map(item => (
                 <li key={item} className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest group cursor-pointer hover:text-primary transition-all">
                   <span className="text-primary text-lg"></span> {item}
                 </li>
               ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
