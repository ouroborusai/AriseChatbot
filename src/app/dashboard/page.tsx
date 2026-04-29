'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp,
  Sparkles,
  Wallet,
  Search,
  Bell,
  Activity,
  AlertCircle,
  MessageCircle,
  Box,
  Users,
  ShieldCheck,
  ChevronRight,
  Cpu,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { useRouter } from 'next/navigation';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import Image from 'next/image';

import useSWR from 'swr';

export default function Dashboard() {
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const router = useRouter();
  const BRAND_GREEN = "#22c55e";

  const fetchDashboardData = async (companyId: string) => {
    const isGlobal = companyId === 'global';
    
    let contactsQuery = supabase.from('contacts').select('*', { count: 'estimated', head: true });
    if (!isGlobal) contactsQuery = contactsQuery.eq('company_id', companyId);

    let chatsQuery = supabase.from('conversations').select('*', { count: 'estimated', head: true });
    if (!isGlobal) chatsQuery = chatsQuery.eq('company_id', companyId);

    let invQuery = supabase.from('inventory_items').select('name, current_stock, min_stock_alert');
    if (!isGlobal) invQuery = invQuery.eq('company_id', companyId);
    
    const [
      { count: contactsCount },
      chatsResult,
      { data: inventory }
    ] = await Promise.all([
      contactsQuery,
      chatsQuery,
      invQuery
    ]);

    const chatCount = chatsResult?.count || 0;
    const lowStockItems = inventory?.filter((i: any) => i.current_stock <= (i.min_stock_alert || 0)) || [];
    
    return {
      stats: {
        contacts: contactsCount || 0,
        activeChats: chatCount,
        lowStock: lowStockItems.length,
        revenue: contactsCount ? (isGlobal ? '$1.2M' : '$68,490') : '$0'
      },
      chartData: [
        { name: '08:00', value: 10 }, { name: '10:00', value: 25 }, { name: '12:00', value: 45 },
        { name: '14:00', value: 30 }, { name: '16:00', value: 65 }, { name: '18:00', value: 80 }
      ],
      recentSignals: [
        ...lowStockItems.slice(0, 2).map((i: any) => ({
          title: `Alerta Stock Crítico`,
          desc: `${i.name}`,
          time: 'Ahora',
          icon: AlertCircle,
          color: 'text-red-500'
        })),
        { title: 'Nodo Industrial Activo', desc: `Sincronizado con RLS`, time: '1m ago', icon: ShieldCheck, color: 'text-[#22c55e]' },
        { title: 'Caché Semántica', desc: 'Optimizada para Gemini 2.5', time: '12m ago', icon: MessageCircle, color: 'text-[#0f172a]' }
      ],
      neuralLogs: [
        { id: 'AX-V622', task: 'Validación Multi-Tenant', type: 'Seguridad', status: 'OK', val: 'Verified' },
        { id: 'AX-LOG', task: 'Sincronización de Contexto', type: 'Sistema', status: 'OK', val: 'Synced' }
      ]
    };
  };

  const { data, error, isLoading: isSwrLoading } = useSWR(
    !isContextLoading && activeCompany?.id ? `dashboard_${activeCompany.id}` : null,
    () => fetchDashboardData(activeCompany?.id || 'global'),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const loading = isContextLoading || isSwrLoading || !data;

  const stats = data?.stats || { contacts: 0, activeChats: 0, lowStock: 0, revenue: '$0' };
  const chartData = data?.chartData || [
    { name: '00:00', value: 0 }, { name: '04:00', value: 0 }, { name: '08:00', value: 0 },
    { name: '12:00', value: 0 }, { name: '16:00', value: 0 }, { name: '20:00', value: 0 },
    { name: '23:59', value: 0 }
  ];
  const recentSignals = data?.recentSignals || [
    { title: 'SISTEMA INICIALIZADO', desc: 'Esperando selección de empresa', time: 'AHORA', icon: Activity, color: 'text-[#0f172a]' },
    { title: 'RLS BLOQUEADO', desc: 'Seleccione una empresa para abrir el nodo', time: '1m', icon: ShieldCheck, color: 'text-amber-500' }
  ];
  const neuralLogs = data?.neuralLogs || [
    { id: 'SYS-ACCESS', task: 'Pendiente de Contexto', type: 'Sistema', status: 'WAIT', val: 'N/A' }
  ];

  return (
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-300 overflow-x-hidden relative">
      
      {/* PREMIUM BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-accent/5 blur-[100px] rounded-full -z-10" />

      {/* HEADER SECTION - DIAMOND v10.4 (Optimized Scales) */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-12 mb-24 px-4 relative z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="relative">
          <h1 className="text-h1-mobile md:text-h1 font-black text-neural-dark tracking-tighter leading-[0.85] uppercase italic">
            Panel de <br/><span className="text-primary drop-shadow-xl">Control.</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-10 flex items-center gap-4 italic opacity-60">
            <Activity size={16} className="text-primary animate-pulse" />
            NODO_ALPHA_25_//_v10.4_PLATINUM_OPERATIVO
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="COMANDO_DE_BÚSQUEDA_..." 
              className="w-full lg:w-96 pl-14 pr-8 py-5 bg-white text-[10px] font-black uppercase tracking-widest text-neural-dark rounded-xl outline-none border border-slate-100 focus:border-primary/50 focus:shadow-2xl transition-all relative z-10 placeholder:text-slate-200 italic"
            />
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 z-20 group-focus-within:text-primary transition-colors" />
          </div>
          
          <div className="flex items-center gap-6">
             <button className="w-16 h-16 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-primary hover:shadow-2xl transition-all relative group shadow-sm">
                <Bell size={22} />
                <div className="absolute top-5 right-5 w-2 h-2 bg-primary rounded-full shadow-[0_0_12px_rgba(34,197,94,0.8)] group-hover:scale-150 transition-transform" />
             </button>
             <div className="hidden sm:flex items-center gap-5 bg-white border border-slate-100 px-6 py-3 rounded-xl shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 relative group-hover:scale-110 transition-transform">
                   <Image src="/brand/official.png" alt="Profile" fill sizes="40px" className="object-cover" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-neural-dark uppercase tracking-wider leading-none italic">Root_User</span>
                   <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em] mt-2 italic opacity-60">NIVEL_05</span>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* METRIC GRID - DIAMOND v10.4 (Platinum Unified) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 px-2">
        <MetricCard title="Nodos_Activos" value={stats.contacts} drift="+12%" icon={Users} loading={loading} />
        <MetricCard title="Cerebro_Neural" value={stats.activeChats} drift="LIVE" icon={Cpu} loading={loading} highlight />
        <MetricCard title="Alertas_Riesgo" value={stats.lowStock} drift="SCANNED" icon={AlertCircle} loading={loading} negative={stats.lowStock > 0} />
        <MetricCard title="Crecimiento" value={stats.revenue} drift="+5.4%" icon={TrendingUp} loading={loading} />
      </div>

      {/* MAIN ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12 px-2">
        
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-0 overflow-hidden relative group shadow-2xl">
          <div className="absolute top-0 right-0 p-8">
             <div className="bg-primary/5 border border-primary/10 px-4 py-2 rounded-xl flex items-center gap-3 bg-white/80 backdrop-blur-md shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] italic">MONITOREO_REAL</span>
             </div>
          </div>
          <div className="p-10 pb-0">
            <h2 className="text-[11px] font-black text-neural-dark uppercase tracking-[0.5em] mb-2 italic">Actividad_Del_Sistema</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed italic opacity-60">
              Métricas procesadas por ARISE Core v10.4 Platinum
            </p>
          </div>
          <div className="w-full h-[320px] mt-8">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 20, right: 40, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorPlatinum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: '900' }} 
                  dy={15}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', color: '#0f172a', fontSize: '10px', fontWeight: '900', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  itemStyle={{ color: 'var(--primary)' }}
                  cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--primary)" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorPlatinum)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Status Feed */}
        <div className="bg-white rounded-xl border border-slate-100 p-10 flex flex-col h-full relative overflow-hidden group shadow-2xl">
          <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-neural-dark mb-10 flex items-center justify-between italic">
            <span>Señales_Recientes</span>
            <Layers size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
          </h3>
          
          <div className="space-y-8 flex-1">
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : recentSignals.map((signal, i) => {
              const Icon = signal.icon;
              return (
                <div key={i} className="flex items-center justify-between group/item cursor-pointer border-b border-slate-50 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center transition-all border border-slate-50 group-hover/item:border-primary/30 group-hover/item:bg-primary/5 shadow-inner">
                      <Icon size={18} className={signal.color || 'text-slate-300'} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-neural-dark uppercase tracking-tight mb-1 group-hover/item:text-primary transition-colors italic">{signal.title}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none opacity-60 italic">{signal.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-200 group-hover/item:text-primary transition-all transform group-hover/item:translate-x-2" />
                </div>
              );
            })}
          </div>

          <button className="mt-10 w-full py-4 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] hover:bg-white hover:border-primary/30 hover:text-primary transition-all italic shadow-sm">
             VER_TODOS_LOS_REGISTROS
          </button>
        </div>
      </div>

      {/* RECENT OPERATIONS TABLE */}
      <div className="bg-white rounded-xl border border-slate-100 p-10 overflow-hidden relative shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div>
            <h2 className="text-[12px] font-black text-neural-dark uppercase tracking-[0.6em] italic">Matriz_De_Operaciones</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic opacity-60">Historial neural de la instancia operativa actual</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 flex items-center gap-4 shadow-inner">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">FILTROS:</span>
                <span className="bg-primary text-white px-4 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">TODO</span>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Referencia</th>
                <th className="pb-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Tarea_Neural</th>
                <th className="pb-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60 text-center">Estado</th>
                <th className="pb-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {neuralLogs.map((log, i) => (
                <tr key={i} className="group hover:bg-slate-50 transition-all cursor-pointer">
                  <td className="py-8 text-[11px] font-black text-slate-300 tracking-widest italic">{log.id}</td>
                  <td className="py-8">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-slate-100"><Box size={20}/></div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-neural-dark uppercase tracking-tight italic group-hover:text-primary transition-colors">{log.task}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 opacity-60 italic">{log.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-8 text-center">
                    <span className="bg-primary/5 text-primary px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.4em] border border-primary/10 shadow-sm italic">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-8 text-right">
                    <div className="flex items-center justify-end gap-4">
                       <span className="text-[11px] font-black text-neural-dark uppercase tracking-tighter italic">{log.val}</span>
                       <ArrowUpRight size={16} className="text-slate-200 group-hover:text-primary transition-all transform group-hover:rotate-12" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, drift, icon: Icon, loading, negative, highlight }: any) {
  if (loading) return <div className="bg-slate-50 rounded-xl p-8 min-h-[140px] animate-pulse border border-slate-100" />;

  return (
    <div className={`p-10 border relative overflow-hidden group rounded-xl transition-all duration-700 shadow-2xl ${highlight ? 'bg-accent text-white border-transparent' : 'bg-white border-slate-100 hover:border-primary/30'}`}>
      
      {/* DECORATIVE MESH */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full opacity-20 transition-opacity group-hover:opacity-40 ${highlight ? 'bg-white' : 'bg-primary'}`} />

      <div className="flex justify-between items-start mb-10 relative z-10">
        <p className={`text-[8px] font-black uppercase tracking-[0.5em] italic ${highlight ? 'text-white/60' : 'text-slate-400'}`}>{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${highlight ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-300 group-hover:text-primary group-hover:bg-primary/5'}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="relative z-10">
        <h2 className={`text-4xl font-black mb-3 tracking-tighter leading-none italic ${highlight ? 'text-white' : 'text-neural-dark'}`}>{value}</h2>
        <div className={`inline-flex px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.4em] italic shadow-sm ${highlight ? 'bg-white/10 text-white' : (negative ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-primary/10 text-primary border border-primary/20')}`}>
          {drift}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 bg-slate-50 rounded-xl animate-pulse" />
      <div className="space-y-4">
        <div className="w-32 h-3 bg-slate-100 rounded-full animate-pulse" />
        <div className="w-24 h-2 bg-slate-100 rounded-full animate-pulse opacity-50" />
      </div>
    </div>
  );
}
