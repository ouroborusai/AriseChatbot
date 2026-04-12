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
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-whatsapp-green border-r-transparent shadow-lg" />
          <p className="mt-4 text-sm font-bold text-slate-500 uppercase tracking-widest">Analizando rendimiento...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex h-full items-center justify-center text-red-500 bg-slate-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-red-100">
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
    <div className="space-y-6 md:space-y-8 p-4 md:p-8">
      {/* Hero Section Industrial */}
      <div className="relative overflow-hidden bg-slate-800 rounded-2xl p-6 md:p-10 text-white border border-slate-700 shadow-sm">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                Motor Neural v2.0
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 uppercase">
              Inteligencia <span className="text-emerald-400">Operacional</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-lg uppercase tracking-wide">
              Análisis de rendimiento en tiempo real del ecosistema AriseChatbot.
            </p>
          </div>

          <div className="bg-slate-700/50 rounded-2xl p-6 md:p-8 border border-slate-600 min-w-[280px] shadow-inner">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Tiempo Recuperado</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tighter">
                {estimatedHoursSaved}h
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Ahorradas</span>
            </div>
            <div className="mt-6 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(estimatedHoursSaved * 1.5, 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Documentación" 
          value={metrics.total_docs_delivered} 
          subtitle="Procesados vía IA" 
          icon="📄"
          trend="+18%"
        />
        <KpiCard 
          title="Agendamiento" 
          value={metrics.total_appointments} 
          subtitle="Citas en agenda" 
          icon="📅"
          trend="+5%"
        />
        <KpiCard 
          title="Mensajería" 
          value={metrics.total_messages.toLocaleString()} 
          subtitle={`${metrics.messages_today} hoy`} 
          icon="💬"
        />
        <KpiCard 
          title="Eficiencia" 
          value={`${metrics.resolution_rate}%`} 
          subtitle="Resolución autónoma" 
          icon="⚡"
          highlight
        />
      </div>

      {/* Gráficos y Autonomía */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Actividad Semanal</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Volumen de datos por canal</p>
            </div>
            <Link href="/dashboard" className="text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
              Ver Terminal →
            </Link>
          </div>
          
          <div className="flex items-end justify-between gap-2 h-48 pt-4">
            {metrics.daily_activity.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                <div className="relative w-full flex flex-col justify-end h-32">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-500 ${idx === metrics.daily_activity.length - 1 ? 'bg-emerald-500' : 'bg-slate-100'}`}
                    style={{ height: `${(item.count / maxActivity) * 100}%`, minHeight: '4px' }} 
                  />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-tighter ${idx === metrics.daily_activity.length - 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card de Autonomía Sólida */}
        <div className="bg-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-sm flex flex-col justify-between border border-slate-700">
          <div>
            <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm border border-slate-600">🦾</div>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-3">Autonomía AI</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed font-bold uppercase tracking-wide">
              Gestión autónoma del <span className="text-emerald-400 text-lg">{Math.round((metrics.bot_responses / metrics.total_messages) * 100)}%</span> del flujo operativo.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Eficiencia de Modelo</span>
              <span className="text-xl font-bold text-emerald-400">{Math.round((metrics.bot_responses / metrics.total_messages) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${(metrics.bot_responses / metrics.total_messages) * 100}%` }} 
              />
            </div>
            <div className="pt-4">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-4 bg-slate-100 hover:bg-white text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm active:bg-slate-200 transition-colors"
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
    <div className={`bg-white rounded-2xl border ${highlight ? 'border-emerald-500' : 'border-slate-200'} p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${highlight ? 'bg-emerald-50' : 'bg-slate-50'}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">
            {trend}
          </span>
        )}
      </div>
      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{title}</h4>
        <div className={`text-2xl font-bold tracking-tight ${highlight ? 'text-emerald-600' : 'text-slate-800'}`}>
          {value}
        </div>
        {subtitle && <p className="mt-1 text-[9px] text-slate-500 font-bold uppercase tracking-widest">{subtitle}</p>}
      </div>
    </div>
  );
}
