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

  const fetchBilling = async () => {
    setLoading(true);
    const activeCompanyId = typeof window !== 'undefined' ? localStorage.getItem('arise_active_company') : null;
    
    if (!activeCompanyId || activeCompanyId === 'null' || activeCompanyId === 'undefined') {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('client_documents')
      .select('*')
      .eq('company_id', activeCompanyId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setDocs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  return (
    <main className="p-4 md:p-10">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-12">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Análisis Financiero & DTE</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">OS Ejecutivo Neural / v6.22 Industrial Edition</p>
        </div>
        <div className="flex gap-4">
          <button className="btn-arise-outline flex items-center gap-2">
            <Download size={14} />
            <span>Exportar Registro</span>
          </button>
          <button className="btn-arise">Generar Reporte Maestro</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricSmall title="Utilidad Neta Est." value="$152,800" drift="+12.2%" icon={DollarSign} loading={loading} />
        <MetricSmall title="Pasivos Tributarios" value="$28,400" drift="Cerrado" icon={ShieldCheck} loading={loading} />
        <MetricSmall title="Documentos Procesados" value={docs.length} drift="Live" icon={FileText} loading={loading} />
        <MetricSmall title="Eficiencia de Flujo" value="94.8%" drift="Óptimo" icon={Activity} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 arise-card overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Documentación Reciente de Bóveda</h2>
            <div className="relative">
              <input type="text" placeholder="Buscar DTE..." className="bg-slate-50 text-[10px] py-2 px-8 rounded-full outline-none focus:ring-2 ring-primary/20 transition-all font-bold" />
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : docs.length > 0 ? (
              docs.map((doc) => (
                <div key={doc.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{doc.title || `Folio #${doc.id.slice(0,6)}`}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{doc.file_type || 'FACTURA'}</p>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">SII SYNC</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">${(doc.total_amount || 0).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(doc.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-24 text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <FileText size={32} />
                 </div>
                 <p className="text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest border-2 border-dashed border-slate-50 rounded-[32px] p-20">No se detectaron registros financieros en este nodo.</p>
              </div>
            )}
          </div>
        </div>

        <div className="arise-card bg-neural-dark border-none p-10 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -mr-20 -mt-20" />
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary mb-8 animate-pulse shadow-[0_0_20px_rgba(19,91,236,0.2)]">
               <TrendingUp size={28} />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-4">Neural Compliance</h2>
            <p className="text-slate-400 text-xs leading-relaxed font-bold">
              El motor Arise ha categorizado el 100% de los documentos. La predicción tributaria para el ciclo 2026 está activa y bajo parámetros de seguridad óptimos.
            </p>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-4">
              <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-50">Estado de Sincronía</span>
              <span className="text-2xl font-black text-white tracking-widest">ÓPTIMO</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full w-full bg-primary shadow-[0_0_30px_#135bec] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function MetricSmall({ title, value, drift, icon: Icon, loading }: any) {
  if (loading) {
    return (
      <div className="arise-card p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="w-24 h-3 arise-skeleton" />
          <div className="w-10 h-10 arise-skeleton rounded-xl" />
        </div>
        <div className="w-32 h-8 arise-skeleton" />
      </div>
    );
  }
  return (
    <div className="arise-card p-8 group">
      <div className="flex justify-between items-start mb-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <div className="w-10 h-10 rounded-[18px] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-primary/5 transition-all">
          <Icon size={18} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-black text-slate-900 leading-none tracking-tight">{value}</h3>
        <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">{drift}</span>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 arise-skeleton rounded-2xl" />
        <div className="space-y-2">
          <div className="w-40 h-3 arise-skeleton" />
          <div className="w-24 h-2 arise-skeleton" />
        </div>
      </div>
      <div className="w-20 h-6 arise-skeleton" />
    </div>
  );
}
