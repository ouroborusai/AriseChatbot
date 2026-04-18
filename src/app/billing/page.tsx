'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BillingPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      const { data } = await supabase
        .from('client_documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setDocs(data);
      setLoading(false);
    }

    fetchBilling();
  }, []);

  return (
    <main className="p-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Financial Vault</h1>
        <p className="text-slate-500 font-medium mt-1">Billing, Accounting & Tax Compliance</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatMini title="Net Profit (MoM)" value="$152,800" />
        <StatMini title="Tax Liabilities" value="$28,400" />
        <StatMini title="Processed Docs" value={loading ? '..' : docs.length} />
        <StatMini title="Payment Efficiency" value="94%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="executive-card p-8">
          <h2 className="text-xl font-bold mb-6">Recent Documents</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="h-20 bg-base animate-pulse rounded-base" />
            ) : docs.length > 0 ? (
              docs.map((doc) => (
                <DocumentItem 
                  key={doc.id} 
                  title={doc.title || `Document #${doc.id.slice(0,4)}`} 
                  type={doc.file_type || 'DTE'} 
                  amount={`$${(doc.total_amount || 0).toLocaleString()}`} 
                  date={new Date(doc.created_at).toLocaleDateString()} 
                />
              ))
            ) : (
              <p className="text-sm text-slate-400">No financial records found.</p>
            )}
          </div>
        </section>

        <section className="executive-card p-8 bg-primary text-white">
          <h2 className="text-xl font-bold mb-2">Automated Accounting</h2>
          <p className="text-primary-foreground/70 text-sm mb-8 leading-relaxed">
            The Neural Engine is currently categorizing processed documents. 
            Real-time tax prediction for Year 2026 is active.
          </p>
          <div className="p-4 bg-white/10 rounded-base border border-white/10">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Status Compliance</span>
                <span className="text-xl font-bold">LOCKED</span>
             </div>
             <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="w-full h-full bg-white shadow-micro-glow" />
             </div>
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

function DocumentItem({ title, type, amount, date }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-base/30 rounded-base hover:bg-white hover:shadow-soft-depth transition-all duration-200 cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="text-xl opacity-40">📄</div>
        <div>
          <p className="font-bold text-slate-900">{title}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">{type}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${amount.startsWith('-') ? 'text-red-500' : 'text-slate-900'}`}>{amount}</p>
        <p className="text-[10px] text-slate-400 font-medium">{date}</p>
      </div>
    </div>
  );
}

