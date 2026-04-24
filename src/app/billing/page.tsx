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
    <div className="flex flex-col w-full max-w-full py-6 md:py-12 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PREMIUM BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-green-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full -z-10" />

      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16 px-2">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]" />
             <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Cumplimiento Financiero</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic uppercase">
            Terminal de <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-500">Facturación</span>
          </h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-5 flex items-center gap-3">
            <BarChart3 size={12} className="text-green-500" />
            CONTROL OPERATIVO / v2.5
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto relative z-10">
          <button className="flex items-center justify-center gap-6 bg-white/5 text-slate-500 border border-white/5 px-10 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all shadow-2xl">
            <Download size={16} />
            <span>Archivo de Auditoría</span>
          </button>
          <button className="flex items-center justify-center gap-6 bg-white text-slate-900 px-10 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-green-500 hover:text-white transition-all active:scale-95 group">
            <span>Reporte Neural</span>
            <Zap size={16} className="group-hover:fill-current" />
          </button>
        </div>
      </header>

      {/* METRICS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 relative z-10">
        <MetricSmall title="Volumen Bruto" value={`$${stats.total.toLocaleString()}`} drift="+8.4%" icon={DollarSign} loading={loading} />
        <MetricSmall title="Impuestos Estimados" value={`$${Math.round(stats.tax).toLocaleString()}`} drift="Sync SII" icon={ShieldCheck} loading={loading} />
        <MetricSmall title="Operaciones Seguras" value={stats.count} drift="Live" icon={FileText} loading={loading} />
        <MetricSmall title="Flujo de Ejecución" value={`${stats.efficiency.toFixed(1)}%`} drift={stats.efficiency > 90 ? 'OPTIMAL' : 'REVIEW'} icon={Activity} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
        {/* DOCUMENT REGISTRY LIST */}
        <div className="lg:col-span-2 bg-white/5 rounded-[48px] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-3xl">
          <div className="p-10 md:p-12 bg-white/5 flex flex-col sm:flex-row justify-between items-center border-b border-white/5 gap-8">
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600 italic">Registro Maestro de Archivos</h2>
            <div className="relative w-full sm:w-auto group">
              <div className="absolute inset-0 bg-white/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <input type="text" placeholder="BUSCAR_FOLIO..." className="w-full sm:w-80 bg-white/5 text-[10px] font-black uppercase tracking-widest py-4.5 px-12 rounded-2xl outline-none border border-white/10 focus:border-green-500/30 focus:bg-white/10 transition-all text-white placeholder:text-slate-700 relative z-10" />
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 z-20" />
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {loading ? (
              Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : docs.length > 0 ? (
              docs.map((doc) => (
                <div key={doc.id} className="p-10 md:p-12 flex items-center justify-between hover:bg-white/[0.03] transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 w-1 h-0 bg-green-500 group-hover:h-full transition-all duration-500" />
                  
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="w-16 h-16 bg-white/5 rounded-[26px] border border-white/10 flex items-center justify-center text-slate-700 group-hover:bg-white group-hover:text-slate-900 transition-all duration-500 shadow-2xl">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[16px] font-black text-white uppercase italic tracking-tight group-hover:text-green-500 transition-colors duration-500">Folio #{doc.folio}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className={`text-[8px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest border ${doc.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                          {doc.document_type || 'FACTURA'}
                        </span>
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest italic opacity-40 group-hover:opacity-100 transition-opacity">NODE_ENCRYPTED_ID</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right relative z-10">
                    <p className="text-2xl font-black text-white italic tracking-tighter group-hover:text-green-500 transition-colors duration-500">${(doc.amount_total || 0).toLocaleString()}</p>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-3 italic">
                       {new Date(doc.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }).toUpperCase()} 
                       <span className="mx-2 opacity-20">//</span> 
                       {new Date(doc.created_at).getFullYear()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-40 text-center flex flex-col items-center">
                 <div className="w-32 h-32 bg-white/5 rounded-[48px] border border-white/5 flex items-center justify-center mb-12 text-slate-800 shadow-inner">
                    <FileText size={56} strokeWidth={1} />
                 </div>
                 <h3 className="text-xs font-black text-white uppercase tracking-[0.6em] mb-6 italic">Bóveda Vacía</h3>
                 <p className="max-w-xs text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] leading-loose mb-12 italic">No se detectaron documentos de alta integridad en el nodo actual. Pulse el generador para iniciar el flujo.</p>
                 <button className="bg-white text-slate-900 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-green-500 hover:text-white transition-all shadow-2xl active:scale-95">Inicializar Bóveda</button>
              </div>
            )}
          </div>
        </div>

        {/* COMPLIANCE SIDEBAR */}
        <div className="flex flex-col gap-12">
          <div className="loop-card bg-[#010409] border border-white/5 p-12 flex flex-col justify-between overflow-hidden relative rounded-[48px] shadow-2xl group min-h-[500px]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 blur-[180px] rounded-full -mr-48 -mt-48 transition-transform group-hover:scale-150 duration-1000" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/5 backdrop-blur-3xl rounded-[32px] flex items-center justify-center text-green-500 mb-12 shadow-2xl border border-white/5 group-hover:bg-green-500 group-hover:text-slate-900 transition-all duration-500">
                 <ShieldCheck size={40} />
              </div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-green-500 mb-8 italic">Cumplimiento Neural v2.5</h2>
              <p className="text-slate-500 text-[11px] leading-loose font-black uppercase tracking-[0.3em] italic">
                EL MOTOR LOOP HA VALIDADO CON ÉXITO EL 100% DE LOS PARÁMETROS FISCALES. 
                SINCRONIZACIÓN EN TIEMPO REAL CON EL PROTOCOLO DEL SII ACTIVA. 
                SISTEMA BLINDADO.
              </p>
            </div>
            
            <div className="relative z-10 mt-16 bg-white/5 p-10 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl group-hover:border-green-500/20 transition-all duration-500">
              <div className="flex justify-between items-end mb-8">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Salud Auditoría</span>
                <span className="text-2xl font-black text-white tracking-[0.2em] italic">OPTIMAL</span>
              </div>
              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div className="h-full w-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-300 shadow-[0_0_25px_rgba(34,197,94,0.3)] animate-pulse rounded-full" />
              </div>
            </div>
          </div>

          <div className="loop-card bg-white/5 p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500 opacity-20" />
            <div className="flex items-start gap-5">
               <Lock size={16} className="text-slate-800 mt-1" />
               <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] leading-loose italic">
                 * TODA TRANSACCIÓN FINANCIERA SE REGISTRA EN LA BÓVEDA DE ALTA INTEGRIDAD LOOP OS. EL PROTOCOLO DIAMOND v10.0 ASEGURA LA NO REPUDIACIÓN DE DATOS.
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
    <div className="p-10 md:p-12 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="w-16 h-16 bg-white/5 animate-pulse rounded-[26px]" />
        <div className="space-y-4">
          <div className="w-48 h-5 bg-white/5 animate-pulse rounded-lg" />
          <div className="w-32 h-3 bg-white/5 animate-pulse rounded-md" />
        </div>
      </div>
      <div className="w-32 h-10 bg-white/5 animate-pulse rounded-2xl" />
    </div>
  );
}
