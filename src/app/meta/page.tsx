'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  MessageSquare, 
  Package, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Zap
} from 'lucide-react';
import { MetricSmall } from '@/components/ui/MetricSmall';

interface Template {
  id: string;
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  category: string;
  language: string;
}

interface Product {
  id: string;
  name: string;
  review_status: string;
  image_url: string;
}

export default function MetaConsolePage() {
  const [data, setData] = useState<{
    templates: Template[];
    catalog: Product[];
    business_id: string;
    catalog_id: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meta/status');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="bg-[#22c55e]/10 text-[#22c55e] px-2 py-1 rounded-lg text-[8px] font-black border border-[#22c55e]/20 flex items-center gap-1.5"><CheckCircle2 size={10} /> APROBADA</span>;
      case 'PENDING':
        return <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg text-[8px] font-black border border-amber-500/20 flex items-center gap-1.5"><Clock size={10} /> PENDIENTE</span>;
      case 'REJECTED':
        return <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded-lg text-[8px] font-black border border-red-500/20 flex items-center gap-1.5"><AlertCircle size={10} /> RECHAZADA</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-500 px-2 py-1 rounded-lg text-[8px] font-black border border-slate-500/20 uppercase">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col w-full max-w-full py-4 md:py-8 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#22c55e]/5 blur-[64px] rounded-full -z-10" />
      
      <header className="flex justify-between items-center mb-10 px-4 relative z-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            Meta <span className="text-[#22c55e]">Console</span>
          </h1>
          <p className="text-slate-400 text-[7px] font-black uppercase tracking-[0.4em] mt-3.5 flex items-center gap-2.5">
            <Zap size={10} className="text-[#22c55e]" />
            ESTADO DE SINCRONIZACIÓN NEURAL / WHATSAPP API
          </p>
        </div>

        <button 
          onClick={fetchData}
          disabled={loading}
          className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-[#22c55e]/30 transition-all group active:scale-90"
        >
          <RefreshCw size={16} className={`text-slate-400 group-hover:text-[#22c55e] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 px-4 relative z-10">
        <MetricSmall 
          title="Plantillas Totales" 
          value={loading ? '..' : data?.templates.length || 0} 
          icon={MessageSquare} 
        />
        <MetricSmall 
          title="Aprobadas" 
          value={loading ? '..' : data?.templates.filter(t => t.status === 'APPROVED').length || 0} 
          icon={CheckCircle2} 
        />
        <MetricSmall 
          title="Productos Catálogo" 
          value={loading ? '..' : data?.catalog.length || 0} 
          icon={Package} 
        />
        <MetricSmall 
          title="Estado Conexión" 
          value="ACTIVA" 
          icon={ShieldCheck} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 relative z-10">
        
        {/* TEMPLATES CARD */}
        <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
               <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Mensajería (HSM Templates)</h2>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center opacity-50 uppercase text-[8px] font-black tracking-widest">Sincronizando con Meta...</div>
            ) : data?.templates.length === 0 ? (
              <div className="p-12 text-center opacity-30 uppercase text-[8px] font-black tracking-widest">No hay plantillas registradas</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {data?.templates.map(t => (
                  <div key={t.id} className="p-5 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="text-[10px] font-black text-slate-900 tracking-tight uppercase">{t.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">{t.category}</span>
                        <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">• {t.language}</span>
                      </div>
                    </div>
                    {getStatusBadge(t.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CATALOG CARD */}
        <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
               <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Inventario Meta Catalog</h2>
            </div>
            <a 
              href={`https://business.facebook.com/commerce_manager/catalogs/${data?.catalog_id}/products`} 
              target="_blank" 
              className="text-[8px] font-black text-[#22c55e] flex items-center gap-1.5 hover:underline"
            >
              GESTIONAR <ExternalLink size={10} />
            </a>
          </div>
          <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center opacity-50 uppercase text-[8px] font-black tracking-widest">Sincronizando Catálogo...</div>
            ) : data?.catalog.length === 0 ? (
              <div className="p-12 text-center opacity-30 uppercase text-[8px] font-black tracking-widest">El catálogo está vacío</div>
            ) : (
              <div className="grid grid-cols-2 gap-px bg-slate-50">
                {data?.catalog.map(p => (
                  <div key={p.id} className="bg-white p-4 flex flex-col items-center text-center gap-3">
                    {p.image_url ? (
                      <img src={p.image_url} className="w-16 h-16 rounded-xl object-cover border border-slate-100" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center"><Package size={20} className="text-slate-200" /></div>
                    )}
                    <div>
                      <p className="text-[9px] font-black text-slate-900 tracking-tight uppercase line-clamp-1">{p.name}</p>
                      <span className={`text-[7px] font-black uppercase tracking-widest ${p.review_status === 'approved' ? 'text-[#22c55e]' : 'text-amber-500'}`}>
                        {p.review_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="mt-8 px-4">
        <div className="bg-[#0f172a] p-6 rounded-[32px] flex items-center justify-between border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/10 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <LayoutDashboard size={18} className="text-[#22c55e]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Business ID: <span className="text-white/40">{data?.business_id || 'Cargando...'}</span></p>
              <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Conexión establecida vía Ouroborus Cloud Pipeline</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
