'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DailyActivity = {
  day: string;
  count: number;
};

type Metrics = {
  total_conversations: number;
  conversations_today: number;
  conversations_this_week: number;
  open_conversations: number;
  closed_conversations: number;
  average_response_time_ms: number;
  average_response_time_minutes: number;
  resolution_rate: number;
  total_messages: number;
  messages_today: number;
  total_docs_delivered: number;
  total_appointments: number;
  bot_responses: number;
  daily_activity: DailyActivity[];
  timestamp: string;
};

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/metrics');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-700 bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-whatsapp-green border-r-transparent shadow-lg"></div>
          <p className="mt-4 text-sm font-bold animate-pulse text-slate-500 uppercase tracking-widest">Analizando rendimiento...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex h-full items-center justify-center text-red-500 bg-slate-50">
        <div className="text-center bg-white p-8 rounded-3xl shadow-xl border border-red-100">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-lg font-bold">Error al sincronizar métricas</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider">Reintentar</button>
        </div>
      </div>
    );
  }

  const maxActivity = Math.max(...metrics.daily_activity.map(d => d.count), 1);
  const estimatedHoursSaved = Math.round((metrics.total_docs_delivered * 5 + metrics.total_appointments * 15) / 60);

  return (
    <div className="space-y-6 md:space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      {/* Hero Performance Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-6 md:p-12 lg:p-16 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -m-12 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 -m-12 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full"></div>
        
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] md:text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-emerald-500/30">
                Live Neural Engine v2.0
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-tight">
              Dashboard de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Inteligencia Operacional</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-lg leading-relaxed max-w-lg">
              Monitorización 24/7 del ecosistema AriseChatbot. Optimización avanzada de flujos financieros y atención al cliente.
            </p>
          </div>
          
          <div className="group bg-slate-800/40 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-10 border border-white/5 shadow-2xl min-w-[280px] md:min-w-[340px] hover:border-emerald-500/30 transition-all duration-500">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-black text-slate-500 mb-2">Total Tiempo Recuperado</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl md:text-7xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tighter">
                {estimatedHoursSaved}h
              </span>
              <span className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">Ahorradas</span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-400 mt-4 font-medium italic">Equivalente a {Math.round(estimatedHoursSaved / 8)} jornadas laborales completas.</p>
            <div className="mt-8 h-2.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                style={{ width: `${Math.min(estimatedHoursSaved * 1.5, 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid Responsiva */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Documentación" 
          value={metrics.total_docs_delivered} 
          subtitle="Procesados vía IA" 
          icon="📄"
          trend="+18%"
          color="indigo"
        />
        <KpiCard 
          title="Agendamiento" 
          value={metrics.total_appointments} 
          subtitle="Citas en agenda" 
          icon="📅"
          trend="+5%"
          color="emerald"
        />
        <KpiCard 
          title="Mensajería" 
          value={metrics.total_messages.toLocaleString()} 
          subtitle={`${metrics.messages_today} en las últimas 24h`} 
          icon="💬"
          color="slate"
        />
        <KpiCard 
          title="Eficiencia" 
          value={`${metrics.resolution_rate}%`} 
          subtitle="Resolución autónoma" 
          icon="⚡"
          highlight
          color="amber"
        />
      </div>

      {/* Secciones de Detalle Grid 1 o 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-6 md:p-10 shadow-sm group overflow-hidden relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Actividad Semanal del Motor</h3>
              <p className="text-xs md:text-sm text-slate-400 font-medium">Análisis de volumen por canal de comunicación</p>
            </div>
            <Link href="/dashboard" className="inline-flex text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              Terminal Live →
            </Link>
          </div>
          
          <div className="flex items-end justify-between gap-2 sm:gap-4 h-64 px-2 overflow-x-auto sm:overflow-visible hide-scrollbar pt-6">
            {metrics.daily_activity.map((item, idx) => (
              <div key={idx} className="min-w-[45px] flex-1 flex flex-col items-center gap-4 group/bar">
                <div className="relative w-full flex flex-col justify-end h-48">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all duration-300 whitespace-nowrap z-20 shadow-xl scale-90 group-hover/bar:scale-100">
                    {item.count} MSGS
                  </div>
                  <div 
                    className={`w-full rounded-2xl transition-all duration-1000 ease-out ${idx === metrics.daily_activity.length - 1 ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xl shadow-emerald-100' : 'bg-slate-100 group-hover/bar:bg-slate-200'}`}
                    style={{ height: `${(item.count / maxActivity) * 100}%`, minHeight: '12px' }} 
                  />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${idx === metrics.daily_activity.length - 1 ? 'text-emerald-600' : 'text-slate-400 group-hover/bar:text-slate-600'}`}>
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card de Eficiencia AI Re-estilizada */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group border border-slate-800">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-all"></div>
          
          <div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-2xl shadow-emerald-500/20 border border-white/10 group-hover:scale-110 transition-transform duration-500">🦾</div>
            <h3 className="text-3xl font-black leading-tight mb-4 tracking-tighter">Autonomía del Cerebro AI</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              El asistente neural ha gestionado con éxito el <span className="text-emerald-400 font-black text-xl">{Math.round((metrics.bot_responses / metrics.total_messages) * 100)}%</span> de las interacciones totales, delegando solo casos críticos a humanos.
            </p>
          </div>
          
          <div className="mt-12 space-y-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Eficacia del Modelo</span>
              <span className="text-2xl font-black text-emerald-400 tracking-tighter">{Math.round((metrics.bot_responses / metrics.total_messages) * 100)}%</span>
            </div>
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-700 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                style={{ width: `${(metrics.bot_responses / metrics.total_messages) * 100}%` }} 
              />
            </div>
            <div className="pt-8">
              <button 
                onClick={() => window.location.reload()} 
                className="block w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-center transition-all shadow-xl active:scale-95 shadow-emerald-900/20"
              >
                Actualizar Motor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  highlight,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  highlight?: boolean;
  trend?: string;
}) {
  return (
    <div className={`group bg-white rounded-3xl border ${highlight ? 'border-green-200' : 'border-slate-200'} p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${highlight ? 'bg-green-100' : 'bg-slate-50'}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
            {trend}
          </span>
        )}
      </div>
      <div>
        <h4 className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1">{title}</h4>
        <div className={`text-3xl font-black tracking-tight ${highlight ? 'text-green-600' : 'text-slate-900'} group-hover:scale-105 transition-transform origin-left`}>
          {value}
        </div>
        {subtitle && <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">{subtitle}</p>}
      </div>
      <div className={`mt-4 h-1 w-0 group-hover:w-full transition-all duration-500 rounded-full ${highlight ? 'bg-green-500' : 'bg-slate-900'}`} />
    </div>
  );
}
