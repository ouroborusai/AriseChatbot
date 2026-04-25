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
    
    // Execute queries concurrently to avoid waterfall
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
        { title: 'Nodo Industrial Activo', desc: `Sincronizado con RLS`, time: '1m ago', icon: ShieldCheck, color: 'text-emerald-500' },
        { title: 'Caché Semántica', desc: 'Optimizada para Gemini 2.5', time: '12m ago', icon: MessageCircle, color: 'text-primary' }
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
      dedupingInterval: 60000, // 1 minute deduplication
    }
  );

  // Authentication check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/auth/login');
    });
  }, [router]);

  const loading = isContextLoading || isSwrLoading || !data;

  const stats = data?.stats || { contacts: 0, activeChats: 0, lowStock: 0, revenue: '$0' };
  const chartData = data?.chartData || [
    { name: '00:00', value: 0 }, { name: '04:00', value: 0 }, { name: '08:00', value: 0 },
    { name: '12:00', value: 0 }, { name: '16:00', value: 0 }, { name: '20:00', value: 0 },
    { name: '23:59', value: 0 }
  ];
  const recentSignals = data?.recentSignals || [
    { title: 'SISTEMA INICIALIZADO', desc: 'Esperando selección de empresa', time: 'AHORA', icon: Activity, color: 'text-primary' },
    { title: 'RLS BLOQUEADO', desc: 'Seleccione una empresa para abrir el nodo', time: '1m', icon: ShieldCheck, color: 'text-amber-500' }
  ];
  const neuralLogs = data?.neuralLogs || [
    { id: 'SYS-ACCESS', task: 'Pendiente de Contexto', type: 'Sistema', status: 'WAIT', val: 'N/A' }
  ];

  return (
    <div className="flex flex-col w-full max-w-full py-6 md:py-12 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PREMIUM BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-green-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full -z-10" />

      {/* HEADER SECTION - DIAMOND v10.0 */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16 px-2">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]" />
             <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Consola de Comando</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
            Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500">Control</span>
          </h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-5 flex items-center gap-3">
            <Activity size={12} className="text-green-500" />
            SISTEMA OPERATIVO NEURAL / NODO ALPHA-25
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-white rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity shadow-sm" />
            <input 
              type="text" 
              placeholder="COMANDO DE BÚSQUEDA..." 
              className="w-full lg:w-96 pl-14 pr-6 py-4.5 bg-white text-[10px] font-black uppercase tracking-widest text-slate-900 rounded-[24px] outline-none border border-slate-200 focus:border-green-500/50 focus:shadow-lg transition-all relative z-10 placeholder:text-slate-400"
            />
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 z-20" />
          </div>
          
          <div className="flex items-center gap-5">
             <button className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:shadow-lg transition-all relative group">
                <Bell size={20} />
                <div className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] group-hover:scale-125 transition-transform" />
             </button>
             <div className="hidden sm:flex items-center gap-4 bg-white border border-slate-200 px-5 py-2.5 rounded-2xl shadow-sm">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 relative">
                   <Image src="/brand/official.png" alt="Profile" fill className="object-cover" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-900 uppercase tracking-wider leading-none">Root User</span>
                   <span className="text-[7px] font-bold text-green-500 uppercase tracking-widest mt-1">Nivel 5</span>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* METRIC GRID - DIAMOND v10.0 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 px-1">
        <MetricCard title="Nodos Activos" value={stats.contacts} drift="+12%" icon={Users} loading={loading} />
        <MetricCard title="Cerebro Neural" value={stats.activeChats} drift="LIVE" icon={Cpu} loading={loading} highlight />
        <MetricCard title="Alertas de Riesgo" value={stats.lowStock} drift="SCANNED" icon={AlertCircle} loading={loading} negative={stats.lowStock > 0} />
        <MetricCard title="Crecimiento" value={stats.revenue} drift="+5.4%" icon={TrendingUp} loading={loading} />
      </div>

      {/* MAIN ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16 px-1">
        
        {/* Activity Chart */}
        <div className="lg:col-span-2 loop-card-light p-0 overflow-hidden relative group border-none">
          <div className="absolute top-0 right-0 p-8">
             <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl flex items-center gap-3 bg-white/80 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse"></span>
                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Monitoreo en Tiempo Real</span>
             </div>
          </div>
          <div className="p-10 pb-0">
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] italic mb-2">Actividad del Sistema</h2>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed max-w-xs">
              Métricas de interacción neural procesadas por LOOP Core v2.5
            </p>
          </div>
          <div className="w-full h-[360px] mt-8">
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 8, fontWeight: '900' }} 
                  dy={15}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '10px', fontWeight: '900', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#22c55e' }}
                  cursor={{ stroke: '#22c55e', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#22c55e" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorPulse)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Status Feed */}
        <div className="loop-card-light p-10 flex flex-col h-full relative overflow-hidden group border-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900 italic mb-12 flex items-center justify-between">
            <span>Señales Recientes</span>
            <Layers size={14} className="text-slate-600" />
          </h3>
          
          <div className="space-y-10 flex-1">
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : recentSignals.map((signal, i) => {
              const Icon = signal.icon;
              return (
                <div key={i} className="flex items-center justify-between group/item cursor-pointer">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center transition-all border border-slate-100 group-hover/item:border-green-500/30 group-hover/item:bg-white shadow-sm group-hover/item:shadow-md">
                      <Icon size={20} className={signal.color || 'text-slate-400'} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1 group-hover/item:text-green-600 transition-colors">{signal.title}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">{signal.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover/item:text-slate-900 transition-all transform group-hover/item:translate-x-1" />
                </div>
              );
            })}
          </div>

          <button className="mt-10 w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] hover:bg-white hover:border-slate-200 hover:text-slate-900 hover:shadow-sm transition-all">
             Ver Todos los Registros
          </button>
        </div>
      </div>

      {/* RECENT OPERATIONS TABLE */}
      <div className="loop-card-light p-10 overflow-hidden relative border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] italic">Matriz de Operaciones</h2>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-2">Historial neural de la instancia actual</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-100 flex items-center gap-4 shadow-sm">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Filtros Activos:</span>
                <span className="bg-green-500 text-white px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest">TODO</span>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Referencia</th>
                <th className="pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Tarea Neural</th>
                <th className="pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Estado</th>
                <th className="pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {neuralLogs.map((log, i) => (
                <tr key={i} className="group hover:bg-slate-50 transition-all cursor-pointer">
                  <td className="py-10 text-[11px] font-mono text-slate-500 tracking-widest">{log.id}</td>
                  <td className="py-10">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-green-500 group-hover:text-white transition-all shadow-sm group-hover:shadow-md"><Box size={16}/></div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{log.task}</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{log.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-10 text-center">
                    <span className="bg-green-500/10 text-green-600 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-green-500/20">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-10 text-right">
                    <div className="flex items-center justify-end gap-3">
                       <span className="text-[11px] font-black text-slate-900 uppercase italic tracking-tighter">{log.val}</span>
                       <ArrowUpRight size={14} className="text-slate-400 group-hover:text-green-500 transition-colors" />
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
  if (loading) return <div className="loop-card-light p-12 min-h-[220px] animate-pulse bg-slate-50 border-none" />;

  return (
    <div className={`loop-card-light p-10 border-none relative overflow-hidden group hover:scale-[1.02] ${highlight ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl shadow-green-500/20' : 'bg-white'}`}>
      
      {/* Visual Accents */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full transition-all duration-700 ${highlight ? 'bg-white/20' : 'bg-green-500/5 group-hover:bg-green-500/10'}`} />
      
      <div className="flex justify-between items-start mb-12 relative z-10">
        <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${highlight ? 'text-white/80' : 'text-slate-500 group-hover:text-slate-700 transition-colors'}`}>{title}</p>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${highlight ? 'bg-white/20 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:text-green-500 border border-slate-100 group-hover:border-green-500/20 group-hover:shadow-sm'}`}>
          <Icon size={24} />
        </div>
      </div>

      <div className="relative z-10">
        <h2 className={`text-5xl font-black mb-4 tracking-tighter leading-none ${highlight ? 'text-white' : 'text-slate-900'}`}>{value}</h2>
        <div className={`inline-flex px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${highlight ? 'bg-white/20 text-white' : (negative ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100')}`}>
          {drift}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl animate-pulse" />
      <div className="space-y-3">
        <div className="w-32 h-3 bg-slate-100 rounded-full animate-pulse" />
        <div className="w-20 h-2 bg-slate-100 rounded-full animate-pulse opacity-50" />
      </div>
    </div>
  );
}
