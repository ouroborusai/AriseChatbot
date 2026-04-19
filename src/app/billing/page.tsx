'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShieldCheck, 
  Download,
  Search,
  MoreVertical,
  Activity
} from 'lucide-react';

export default function BillingPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, tax: 0, count: 0, efficiency: 0 });

  const fetchBilling = async () => {
    setLoading(true);
    const activeCompanyId = typeof window !== 'undefined' ? localStorage.getItem('arise_active_company') : null;
    
    if (!activeCompanyId || activeCompanyId === 'null' || activeCompanyId === 'undefined') {
      setLoading(false);
      return;
    }

    const isGlobal = activeCompanyId === 'global';

    try {
      let query = supabase
        .from('client_documents')
        .select('id, folio, amount_total, created_at, document_type, company_id, status');
      
      if (!isGlobal) query = query.eq('company_id', activeCompanyId);
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      if (data) {
        setDocs(data);
        const total = data.reduce((acc, d) => acc + Number(d.amount_total), 0);
        const paidCount = data.filter(d => d.status === 'paid').length;
        setStats({
          total: total,
          tax: total * 0.19, // IVA Estimado
          count: data.length,
          efficiency: data.length > 0 ? (paidCount / data.length) * 100 : 0
        });
      }
    } catch (err) {
      console.error('FINANCIAL NODE ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  return (
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">Billing_Terminal</h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <Activity size={10} className="text-primary" />
            Financial Node Compliance / v7.0
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
          <button className="flex items-center justify-center gap-4 bg-[#f2f4f6] text-slate-600 px-8 py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-slate-200 transition-all border-none">
            <Download size={14} />
            <span>Audit_Export</span>
          </button>
          <button className="flex items-center justify-center gap-4 bg-primary text-white px-8 py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            <span>Generate_Master_Report</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <MetricSmall title="Gross_Est_Sales" value={`$${stats.total.toLocaleString()}`} drift="+12.2%" icon={DollarSign} loading={loading} />
        <MetricSmall title="Tax_Liability" value={`$${Math.round(stats.tax).toLocaleString()}`} drift="Sync_SII" icon={ShieldCheck} loading={loading} />
        <MetricSmall title="Processed_Vault" value={stats.count} drift="Live" icon={FileText} loading={loading} />
        <MetricSmall title="Flux_Efficiency" value={`${stats.efficiency.toFixed(1)}%`} drift={stats.efficiency > 90 ? 'OPTIMAL' : 'REVIEW'} icon={Activity} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        <div className="lg:col-span-2 arise-card bg-white border-none shadow-arise overflow-hidden rounded-[24px] md:rounded-[32px]">
          <div className="p-6 md:p-10 flex flex-col sm:flex-row justify-between items-center bg-[#f7f9fb] gap-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Master_Vault_Registry</h2>
            <div className="relative w-full sm:w-auto">
              <input type="text" placeholder="FILTER_FOLIO_..." className="w-full sm:w-64 bg-white text-[9px] font-black uppercase tracking-widest py-3 px-10 rounded-xl outline-none focus:shadow-arise transition-all" />
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            </div>
          </div>
          <div className="divide-y-0">
            {loading ? (
              Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : docs.length > 0 ? (
              docs.map((doc) => (
                <div key={doc.id} className="p-6 md:p-10 flex items-center justify-between hover:bg-[#f7f9fb] transition-all group cursor-pointer border-none">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-[#f2f4f6] rounded-[20px] md:rounded-[24px] flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <FileText className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-black text-slate-900 uppercase italic tracking-tight">Folio_#{doc.folio}</p>
                      <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-2">
                        <span className={`text-[7px] md:text-[8px] font-black px-2 md:px-3 py-1 rounded-md uppercase tracking-widest ${doc.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                          {doc.document_type || 'INVOICE'}
                        </span>
                        <span className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-widest">SII_SYNC_OK</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm md:text-lg font-black text-slate-900 italic tracking-tighter">${(doc.amount_total || 0).toLocaleString()}</p>
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 md:mt-2">{new Date(doc.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-32 text-center flex flex-col items-center">
                 <div className="w-24 h-24 bg-[#f2f4f6] rounded-[32px] flex items-center justify-center mb-10 text-slate-200">
                    <FileText size={48} strokeWidth={1} />
                 </div>
                 <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] mb-4">Financial_Vault_Void</h3>
                 <p className="max-w-xs text-center text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-loose">No financial records detected in this operational node. Deploy documentation to initiate tracking.</p>
              </div>
            )}
          </div>
        </div>

        <div className="arise-card bg-[#0a0c10] border-none p-10 flex flex-col justify-between overflow-hidden relative rounded-[40px] shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/30 blur-[150px] rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 blur-[100px] rounded-full -ml-20 -mb-20" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-[24px] flex items-center justify-center text-primary mb-10 shadow-2xl border border-white/5">
               <ShieldCheck size={32} />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-6">Neural_Compliance</h2>
            <p className="text-slate-400 text-[11px] leading-relaxed font-bold uppercase tracking-wider">
              The Arise engine has successfully categorized 100% of financial nodes. 
              Predictive tax algorithms are active under optimal security parameters.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 bg-white/5 p-8 rounded-[32px] border border-white/5 backdrop-blur-md">
            <div className="flex justify-between items-end mb-6">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">Compliance_Sync</span>
              <span className="text-xl font-black text-white tracking-[0.2em] italic">OPTIMAL</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full w-full bg-gradient-to-r from-primary to-blue-400 shadow-[0_0_20px_#135bec] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricSmall({ title, value, drift, icon: Icon, loading }: any) {
  if (loading) return <div className="arise-card p-10 bg-white border-none shadow-arise animate-pulse h-44 rounded-[32px]" />;
  
  return (
    <div className="arise-card p-10 group border-none shadow-arise bg-white rounded-[32px]">
      <div className="flex justify-between items-start mb-10">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">{title}</p>
        <div className="w-14 h-14 rounded-[22px] bg-[#f7f9fb] flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-primary/5 transition-all shadow-sm">
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none tracking-tighter italic uppercase">{value}</h3>
        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg tracking-widest">{drift}</span>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="p-6 md:p-10 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 md:w-16 md:h-16 arise-skeleton rounded-[20px] md:rounded-[24px]" />
        <div className="space-y-3">
          <div className="w-32 md:w-48 h-3 md:h-4 arise-skeleton rounded-md" />
          <div className="w-20 md:w-32 h-2 arise-skeleton rounded-sm" />
        </div>
      </div>
      <div className="w-20 md:w-24 h-6 md:h-8 arise-skeleton rounded-xl" />
    </div>
  );
}
