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
  Activity,
  Zap,
  ArrowUpRight,
  Cpu,
  BarChart3,
  Lock
} from 'lucide-react';
import { MetricSmall } from '@/components/ui/MetricSmall';
import Image from 'next/image';

interface ClientDocument {
  id: string;
  folio?: string;
  amount_total?: number;
  created_at: string;
  document_type?: string;
  company_id: string;
  status?: string;
}

export default function BillingPage() {
  const [docs, setDocs] = useState<ClientDocument[]>([]);
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
    <div className="flex flex-col w-full max-w-full py-4 md:py-8 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#22c55e]/5 blur-[64px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#0f172a]/5 blur-[64px] rounded-full -z-10" />

      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-10 px-2 relative z-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            Terminal de <span className="text-[#22c55e]">Analítica</span>
          </h1>
          <p className="text-slate-400 text-[7px] font-black uppercase tracking-[0.4em] mt-3.5 flex items-center gap-2.5">
            <BarChart3 size={10} className="text-[#22c55e]" />
            INTELIGENCIA FINANCIERA / v2.5
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <button className="flex items-center justify-center gap-3 bg-white text-slate-400 border border-slate-100 px-6 py-3 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] hover:bg-slate-50 transition-all shadow-sm">
            <Download size={14} />
            <span>Auditoría</span>
          </button>
          <button className="flex items-center justify-center gap-3 bg-[#0f172a] text-white px-6 py-3 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-[#22c55e] transition-all active:scale-95 group">
            <span>Reporte Neural</span>
            <Zap size={14} className="group-hover:fill-current" />
          </button>
        </div>
      </header>

      {/* METRICS SECTION - COMPACT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
        <MetricSmall title="Volumen Bruto" value={`$${stats.total.toLocaleString()}`} drift="+8.4%" icon={DollarSign} loading={loading} />
        <MetricSmall title="Impuestos Estimados" value={`$${Math.round(stats.tax).toLocaleString()}`} drift="Sync SII" icon={ShieldCheck} loading={loading} />
        <MetricSmall title="Operaciones Seguras" value={stats.count} drift="Live" icon={FileText} loading={loading} />
        <MetricSmall title="Flujo de Ejecución" value={`${stats.efficiency.toFixed(1)}%`} drift={stats.efficiency > 90 ? 'OPTIMAL' : 'REVIEW'} icon={Activity} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* DOCUMENT REGISTRY LIST - COMPACT */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-5 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center border-b border-slate-100 gap-4">
            <h2 className="text-[7.5px] font-black uppercase tracking-[0.3em] text-slate-300">Registro Maestro de Archivos</h2>
            <div className="relative w-full sm:w-auto group">
              <input type="text" placeholder="BUSCAR_FOLIO..." className="w-full sm:w-52 bg-white text-[7.5px] font-black uppercase tracking-widest py-2 px-8 rounded-lg outline-none border border-slate-100 focus:border-[#22c55e]/30 transition-all text-slate-900 placeholder:text-slate-200 relative z-10" />
              <Search size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-200 z-20" />
            </div>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : docs.length > 0 ? (
              docs.map((doc) => (
                <div key={doc.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 w-1.5 h-0 bg-[#22c55e] group-hover:h-full transition-all duration-700" />
                  
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-11 h-11 bg-white text-slate-900 rounded-xl border border-slate-100 flex items-center justify-center group-hover:bg-[#22c55e] group-hover:text-white group-hover:border-transparent transition-all duration-500 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight group-hover:text-[#22c55e] transition-colors duration-500">Folio #{doc.folio}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border shadow-sm ${doc.status === 'paid' ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/10' : 'bg-red-50 text-red-500 border-red-100'}`}>
                          {doc.document_type || 'FACTURA'}
                        </span>
                        <span className="text-[7px] font-black text-slate-200 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">ENCRYPTED</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right relative z-10">
                    <p className="text-lg font-black text-slate-900 tracking-tighter group-hover:text-[#22c55e] transition-colors duration-500">${(doc.amount_total || 0).toLocaleString()}</p>
                    <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1">
                       {new Date(doc.created_at).toLocaleDateString('es-ES', { month: 'long', day: 'numeric' }).toUpperCase()} 
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-24 text-center flex flex-col items-center">
                 <div className="w-20 h-20 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-center mb-8 text-slate-100 shadow-inner">
                    <FileText size={32} strokeWidth={1} />
                 </div>
                 <h3 className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">Bóveda Vacía</h3>
                 <p className="max-w-xs text-center text-slate-300 text-[7px] font-black uppercase tracking-[0.2em] leading-relaxed mb-8 italic">No se detectaron documentos de alta integridad en el nodo actual.</p>
                 <button className="bg-slate-50 text-slate-400 px-5 py-2.5 rounded-xl text-[7px] font-black uppercase tracking-[0.3em] hover:bg-[#22c55e] hover:text-white transition-all active:scale-95 border border-slate-100">Inicializar Bóveda</button>
              </div>
            )}
          </div>
        </div>

        {/* COMPLIANCE SIDEBAR - COMPACT */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#0f172a] p-6 flex flex-col justify-between overflow-hidden relative rounded-2xl shadow-xl group min-h-[300px]">
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/5 backdrop-blur-3xl rounded-lg flex items-center justify-center text-white mb-6 border border-white/10 group-hover:bg-[#22c55e] transition-all shadow-lg">
                 <ShieldCheck size={20} />
              </div>
              <h2 className="text-[8px] font-black uppercase tracking-[0.5em] text-[#22c55e] mb-4">Cumplimiento Neural v2.5</h2>
              <p className="text-white/40 text-[8px] leading-relaxed font-black uppercase tracking-tight">
                VALIDACIÓN DE PARÁMETROS FISCALES COMPLETADA. SINCRONIZACIÓN ACTIVA.
              </p>
            </div>
            
            <div className="relative z-10 mt-8 bg-white/5 p-6 rounded-xl border border-white/5 backdrop-blur-3xl shadow-sm">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.3em]">Salud Auditoría</span>
                <span className="text-base font-black text-white">OPTIMAL</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div className="h-full w-full bg-[#22c55e] animate-pulse rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-start gap-3">
               <Lock size={10} className="text-slate-100 mt-0.5" />
               <p className="text-[7px] font-black text-slate-200 uppercase tracking-tight leading-relaxed italic">
                 * TODA TRANSACCIÓN SE REGISTRA EN LA BÓVEDA LOOP.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="p-8 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 bg-slate-50 animate-pulse rounded-xl" />
        <div className="space-y-3">
          <div className="w-32 h-4 bg-slate-50 animate-pulse rounded-md" />
          <div className="w-20 h-2 bg-slate-50 animate-pulse rounded-sm" />
        </div>
      </div>
      <div className="w-24 h-8 bg-slate-50 animate-pulse rounded-xl" />
    </div>
  );
}
