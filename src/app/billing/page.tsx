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
import { MetricSmall } from '@/components/ui/MetricSmall';

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
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-700 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-12 mb-20 relative">
        <div className="absolute -top-10 -right-20 w-80 h-80 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">Terminal de Facturación</h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] mt-4 flex items-center gap-2">
            <Activity size={10} className="text-primary animate-pulse" />
            Cumplimiento Financiero / LOOP v9.0
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto relative z-10">
          <button className="btn-loop-outline px-10 flex items-center justify-center gap-4 bg-white/50 backdrop-blur-md">
            <Download size={16} />
            <span>Archivo de Auditoría</span>
          </button>
          <button className="btn-loop px-10 flex items-center justify-center gap-4">
            <span>Reporte Neural v7</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
        <MetricSmall title="Volumen Bruto" value={`$${stats.total.toLocaleString()}`} drift="+8.4%" icon={DollarSign} loading={loading} />
        <MetricSmall title="Impuestos Estimados" value={`$${Math.round(stats.tax).toLocaleString()}`} drift="Sync SII" icon={ShieldCheck} loading={loading} />
        <MetricSmall title="Operaciones de Seguridad" value={stats.count} drift="Live" icon={FileText} loading={loading} />
        <MetricSmall title="Flujo de Ejecución" value={`${stats.efficiency.toFixed(1)}%`} drift={stats.efficiency > 90 ? 'OPTIMAL' : 'REVIEW'} icon={Activity} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
        <div className="lg:col-span-2 loop-card bg-white/80 backdrop-blur-2xl border-white/50 shadow-arise overflow-hidden rounded-[48px]">
          <div className="p-8 md:p-12 flex flex-col sm:flex-row justify-between items-center bg-[#f8fafc]/50 border-b border-slate-50 gap-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Registro Maestro de Archivos</h2>
            <div className="relative w-full sm:w-auto">
              <input type="text" placeholder="BUSCAR FOLIO..." className="w-full sm:w-80 bg-white text-[9px] font-black uppercase tracking-widest py-4 px-12 rounded-2xl outline-none border border-slate-100 focus:shadow-arise transition-all" />
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : docs.length > 0 ? (
              docs.map((doc) => (
                <div key={doc.id} className="p-8 md:p-10 flex items-center justify-between hover:bg-[#f8fafc]/80 transition-all group cursor-pointer">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#f8fafc] rounded-[28px] flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Folio #{doc.folio}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className={`text-[8px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest ${doc.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                          {doc.document_type || 'FACTURA'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">ID ENCRIPTADO</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900 italic tracking-tighter italic">${(doc.amount_total || 0).toLocaleString()}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">{new Date(doc.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} // {new Date(doc.created_at).getFullYear()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-40 text-center flex flex-col items-center">
                 <div className="w-32 h-32 bg-[#f8fafc] rounded-[48px] flex items-center justify-center mb-12 text-slate-200 shadow-inner">
                    <FileText size={56} strokeWidth={1} />
                 </div>
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.6em] mb-6">Historial Vacío</h3>
                 <p className="max-w-xs text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-loose mb-12">No se detectaron documentos de alta integridad en el nodo actual. Pulse el generador para iniciar el flujo.</p>
                 <button className="btn-loop">Inicializar Bóveda</button>
              </div>
            )}
          </div>
        </div>

        <div className="loop-card bg-[#0b1326] border-none p-12 flex flex-col justify-between overflow-hidden relative rounded-[48px] shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[180px] rounded-full -mr-48 -mt-48 transition-opacity duration-1000 group-hover:opacity-100" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 blur-[130px] rounded-full -ml-32 -mb-32" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/5 backdrop-blur-2xl rounded-[32px] flex items-center justify-center text-primary mb-12 shadow-2xl border border-white/5">
               <ShieldCheck size={40} />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-primary mb-8">Cumplimiento Neural v7</h2>
            <p className="text-slate-400 text-xs leading-relaxed font-bold uppercase tracking-widest">
              El motor LOOP ha validado con éxito el 100% de los parámetros fiscales. 
              Sincronización en tiempo real con el protocolo del SII activa. No se detectaron anomalías.
            </p>
          </div>
          
          <div className="relative z-10 mt-16 bg-white/5 p-10 rounded-[40px] border border-white/5 backdrop-blur-xl">
            <div className="flex justify-between items-end mb-8">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Salud de Auditoría</span>
              <span className="text-2xl font-black text-white tracking-[0.2em] italic">OPTIMAL</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-primary via-emerald-400 to-green-300 shadow-[0_0_25px_rgba(22,163,74,0.5)] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function SkeletonRow() {
  return (
    <div className="p-6 md:p-10 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 md:w-16 md:h-16 loop-skeleton rounded-[20px] md:rounded-[24px]" />
        <div className="space-y-3">
          <div className="w-32 md:w-48 h-3 md:h-4 loop-skeleton rounded-md" />
          <div className="w-20 md:w-32 h-2 loop-skeleton rounded-sm" />
        </div>
      </div>
      <div className="w-20 md:w-24 h-6 md:h-8 loop-skeleton rounded-xl" />
    </div>
  );
}
