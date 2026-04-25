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
    () => fetchDashboardData(activeCompany!.id),
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
    <div className="flex flex-col w-full max-w-full py-6 md:py-8 animate-in fade-in duration-300 overflow-x-hidden relative">
      
      {/* PREMIUM BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#22c55e]/5 blur-[64px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[#0f172a]/5 blur-[64px] rounded-full -z-10" />

      {/* HEADER SECTION - DIAMOND v10.1 (Optimized Scales) */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6 px-2">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            Panel de <span className="text-[#22c55e]">Control</span>
          </h1>
          <p className="text-slate-400 text-[6px] font-black uppercase tracking-[0.3em] mt-2.5 flex items-center gap-2">
            <Activity size={8} className="text-[#22c55e]" />
            NODO ALPHA-25 // SINC_STATUS: OK
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-white rounded-[20px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity shadow-sm" />
            <input 
              type="text" 
              placeholder="COMANDO DE BÚSQUEDA..." 
              className="w-full lg:w-80 pl-12 pr-5 py-3.5 bg-white text-[9px] font-black uppercase tracking-widest text-slate-900 rounded-[20px] outline-none border border-slate-200 focus:border-[#22c55e]/50 focus:shadow-lg transition-all relative z-10 placeholder:text-slate-300"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-20" />
          </div>
          
          <div className="flex items-center gap-4">
             <button className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:shadow-lg transition-all relative group">
                <Bell size={18} />
                <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e] group-hover:scale-125 transition-transform" />
             </button>
             <div className="hidden sm:flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 relative">
                   <Image src="/brand/official.png" alt="Profile" fill sizes="32px" className="object-cover" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-slate-900 uppercase tracking-wider leading-none">Root User</span>
                   <span className="text-[7px] font-bold text-[#22c55e] uppercase tracking-widest mt-1">Nivel 5</span>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* METRIC GRID - DIAMOND v10.1 (Optimized Compactness) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 px-1">
        <MetricCard title="Nodos Activos" value={stats.contacts} drift="+12%" icon={Users} loading={loading} />
        <MetricCard title="Cerebro Neural" value={stats.activeChats} drift="LIVE" icon={Cpu} loading={loading} highlight />
        <MetricCard title="Alertas de Riesgo" value={stats.lowStock} drift="SCANNED" icon={AlertCircle} loading={loading} negative={stats.lowStock > 0} />
        <MetricCard title="Crecimiento" value={stats.revenue} drift="+5.4%" icon={TrendingUp} loading={loading} />
      </div>

      {/* MAIN ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 px-1">
        
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-0 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4">
             <div className="bg-[#22c55e]/5 border border-[#22c55e]/10 px-2.5 py-1 rounded-lg flex items-center gap-2 bg-white/80 backdrop-blur-sm">
                <span className="flex h-1 w-1 rounded-full bg-[#22c55e] animate-pulse"></span>
                <span className="text-[7px] font-black text-[#22c55e] uppercase tracking-widest">Monitoreo Real</span>
             </div>
          </div>
          <div className="p-6 pb-0">
            <h2 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.4em] mb-1">Actividad del Sistema</h2>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Métricas procesadas por LOOP Core v2.5
            </p>
          </div>
          <div className="w-full h-[240px] mt-4">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.02)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 7, fontWeight: '900' }} 
                  dy={10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', color: '#1e293b', fontSize: '9px', fontWeight: '900', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                  itemStyle={{ color: '#22c55e' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#22c55e" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPulse)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Status Feed */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col h-full relative overflow-hidden group">
          <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-900 mb-6 flex items-center justify-between">
            <span>Señales Recientes</span>
            <Layers size={10} className="text-slate-300" />
          </h3>
          
          <div className="space-y-6 flex-1">
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : recentSignals.map((signal, i) => {
              const Icon = signal.icon;
              return (
                <div key={i} className="flex items-center justify-between group/item cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center transition-all border border-slate-100 group-hover/item:border-[#22c55e]/30 group-hover/item:bg-[#22c55e]/5 shadow-sm">
                      <Icon size={14} className={signal.color || 'text-slate-400'} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-900 uppercase tracking-tight mb-0.5 group-hover/item:text-[#22c55e] transition-colors">{signal.title}</p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">{signal.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={10} className="text-slate-200 group-hover/item:text-slate-900 transition-all transform group-hover/item:translate-x-1" />
                </div>
              );
            })}
          </div>

          <button className="mt-6 w-full py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] hover:bg-white hover:border-slate-200 hover:text-slate-900 transition-all">
             Ver Todos los Registros
          </button>
        </div>
      </div>

      {/* RECENT OPERATIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.4em]">Matriz de Operaciones</h2>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Historial neural de la instancia actual</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-2 shadow-sm">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Filtros:</span>
                <span className="bg-[#22c55e] text-white px-2 py-0.5 rounded text-[6px] font-black uppercase tracking-widest">TODO</span>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-6 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Referencia</th>
                <th className="pb-6 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Tarea Neural</th>
                <th className="pb-6 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Estado</th>
                <th className="pb-6 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {neuralLogs.map((log, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                  <td className="py-6 text-[10px] font-mono text-slate-400 tracking-widest">{log.id}</td>
                  <td className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#22c55e] group-hover:text-white transition-all shadow-sm"><Box size={14}/></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{log.task}</span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 text-center">
                    <span className="bg-[#22c55e]/10 text-[#22c55e] px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border border-[#22c55e]/10">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{log.val}</span>
                       <ArrowUpRight size={12} className="text-slate-300 group-hover:text-[#22c55e] transition-colors" />
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
  if (loading) return <div className="bg-slate-50 rounded-2xl p-4 min-h-[100px] animate-pulse border-none" />;

  return (
    <div className={`p-4 border relative overflow-hidden group rounded-2xl transition-all duration-300 ${highlight ? 'bg-slate-900 text-white border-transparent shadow-lg shadow-slate-900/10' : 'bg-white border-slate-100 shadow-sm'}`}>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className={`text-[6.5px] font-black uppercase tracking-[0.4em] ${highlight ? 'text-white/60' : 'text-slate-400'}`}>{title}</p>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${highlight ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-300 group-hover:text-[#22c55e] group-hover:bg-[#22c55e]/5'}`}>
          <Icon size={14} />
        </div>
      </div>

      <div className="relative z-10">
        <h2 className={`text-xl font-black mb-1.5 tracking-tighter leading-none ${highlight ? 'text-white' : 'text-slate-900'}`}>{value}</h2>
        <div className={`inline-flex px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest ${highlight ? 'bg-white/10 text-white' : (negative ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20')}`}>
          {drift}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 bg-slate-50 rounded-xl animate-pulse" />
      <div className="space-y-2">
        <div className="w-24 h-2.5 bg-slate-100 rounded-full animate-pulse" />
        <div className="w-16 h-1.5 bg-slate-100 rounded-full animate-pulse opacity-50" />
      </div>
    </div>
  );
}
