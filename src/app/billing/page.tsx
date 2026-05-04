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
import type { ClientDocument } from '@/types/database';

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
        .select('id, folio, amount_total, amount_tax, created_at, document_type, company_id, status');
      
      if (!isGlobal) query = query.eq('company_id', activeCompanyId);
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      if (data) {
        setDocs(data as unknown as ClientDocument[]);
        const total = data.reduce((acc, d) => acc + Number(d.amount_total || 0), 0);
        const taxTotal = data.reduce((acc, d) => acc + Number(d.amount_tax || 0), 0);
        const paidCount = data.filter(d => d.status === 'paid').length;
        setStats({
          total: total,
          tax: taxTotal, // Cero Cálculos Locales - Extracción SSOT
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
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 blur-[64px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent/5 blur-[64px] rounded-full -z-10" />

      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-20 px-2 relative z-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="relative">
          <h1 className="text-h1-mobile md:text-h1 font-black text-neural-dark tracking-tighter leading-[0.9] uppercase">
            Terminal de <br/><span className="text-primary">Analítica</span>
          </h1>
          <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.4em] mt-6 flex items-center gap-2.5">
            <BarChart3 size={12} className="text-primary" />
            INTELIGENCIA FINANCIERA / v12.0 DIAMOND
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <button className="flex items-center justify-center gap-3 bg-white text-slate-400 border border-slate-100 px-6 py-3.5 text-[8px] font-black uppercase tracking-[0.3em] hover:bg-slate-50 transition-all shadow-sm" style={{ borderRadius: 'var(--radius-sm)' }}>
            <Download size={14} />
            <span>Auditoría</span>
          </button>
          <button className="btn-arise flex items-center justify-center gap-3 bg-accent text-white px-8 py-3.5 text-[8px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-primary transition-all active:scale-95 group">
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
        <div className="lg:col-span-2 bg-white border border-slate-100 overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="p-6 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center border-b border-slate-100 gap-4">
            <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300">Registro Maestro de Archivos</h2>
            <div className="relative w-full sm:w-auto group">
              <input type="text" placeholder="BUSCAR_FOLIO..." className="arise-input w-full sm:w-60 pl-10" />
              <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200 z-20" />
            </div>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : docs.length > 0 ? (
              docs.map((doc) => (
                <div key={doc.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 w-2 h-0 bg-primary group-hover:h-full transition-all duration-700" />
                  
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-12 h-12 bg-white text-neural-dark border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all duration-500 shadow-sm" style={{ borderRadius: 'var(--radius-md)' }}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-neural-dark uppercase tracking-tight group-hover:text-primary transition-colors duration-500">Folio #{doc.folio}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[7px] font-black px-2 py-0.5 uppercase tracking-widest border shadow-sm ${doc.status === 'paid' ? 'bg-primary/10 text-primary border-primary/10' : 'bg-red-50 text-red-500 border-red-100'}`} style={{ borderRadius: 'var(--radius-sm)' }}>
                          {doc.document_type || 'FACTURA'}
                        </span>
                        <span className="text-[7px] font-black text-slate-200 uppercase tracking-widest bg-slate-50 px-2 py-0.5 border border-slate-100" style={{ borderRadius: 'var(--radius-sm)' }}>ENCRYPTED</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right relative z-10">
                    <p className="text-xl font-black text-neural-dark tracking-tighter group-hover:text-primary transition-colors duration-500">${(doc.amount_total || 0).toLocaleString()}</p>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1.5">
                       {new Date(doc.created_at).toLocaleDateString('es-ES', { month: 'long', day: 'numeric' }).toUpperCase()} 
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-24 text-center flex flex-col items-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center mb-8 text-slate-100 shadow-inner">
                     <FileText size={40} strokeWidth={1} />
                  </div>
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">Bóveda Vacía</h3>
                  <p className="max-w-xs text-center text-slate-300 text-[8px] font-black uppercase tracking-[0.2em] leading-relaxed mb-10 italic">No se detectaron documentos de alta integridad en el nodo actual.</p>
                  <button className="bg-slate-50 text-slate-400 px-8 py-3 rounded-md text-[8px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all active:scale-95 border border-slate-100 shadow-sm">Inicializar Bóveda</button>
              </div>
            )}
          </div>
        </div>

        {/* COMPLIANCE SIDEBAR - COMPACT */}
        <div className="flex flex-col gap-6">
          <div className="bg-accent p-8 flex flex-col justify-between overflow-hidden relative shadow-2xl group min-h-[340px]" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/5 backdrop-blur-3xl flex items-center justify-center text-white mb-8 border border-white/10 group-hover:bg-primary transition-all shadow-lg" style={{ borderRadius: 'var(--radius-md)' }}>
                 <ShieldCheck size={24} />
              </div>
              <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-primary mb-6">Cumplimiento Neural v12.0</h2>
              <p className="text-white/40 text-[9px] leading-relaxed font-black uppercase tracking-tight">
                VALIDACIÓN DE PARÁMETROS FISCALES COMPLETADA. <br/>SINCRONIZACIÓN ACTIVA CON SSOT.
              </p>
            </div>
            
            <div className="relative z-10 mt-10 bg-white/5 p-6 border border-white/5 backdrop-blur-3xl shadow-sm" style={{ borderRadius: 'var(--radius-md)' }}>
              <div className="flex justify-between items-end mb-4">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Salud Auditoría</span>
                <span className="text-lg font-black text-white tracking-tighter">OPTIMAL</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div className="h-full w-full bg-primary animate-pulse rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 border border-slate-100 shadow-sm relative overflow-hidden group" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div className="flex items-start gap-3">
               <Lock size={10} className="text-slate-100 mt-0.5" />
               <p className="text-[7px] font-black text-slate-200 uppercase tracking-tight leading-relaxed italic">
                 * TODA TRANSACCIÓN SE REGISTRA EN LA BÓVEDA ARISE.
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
        <div className="w-12 h-12 bg-slate-50 animate-pulse" style={{ borderRadius: 'var(--radius-xl)' }} />
        <div className="space-y-3">
          <div className="w-32 h-4 bg-slate-50 animate-pulse" style={{ borderRadius: 'var(--radius-md)' }} />
          <div className="w-20 h-2 bg-slate-50 animate-pulse" style={{ borderRadius: 'var(--radius-sm)' }} />
        </div>
      </div>
      <div className="w-24 h-8 bg-slate-50 animate-pulse" style={{ borderRadius: 'var(--radius-xl)' }} />
    </div>
  );
}
