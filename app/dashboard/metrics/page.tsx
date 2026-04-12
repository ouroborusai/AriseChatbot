'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
      <div className="flex h-full items-center justify-center text-slate-700">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-whatsapp-green border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        <p className="text-lg font-semibold">Error al cargar métricas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Industrial */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Bot Performance</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Actualizado {new Date(metrics.timestamp).toLocaleTimeString()}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Análisis de Automatización</h1>
            <p className="text-slate-500 mt-2 text-sm max-w-xl">Midiendo el ahorro de tiempo y la eficiencia de AriseChatbot en tu operación diaria.</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl min-w-[240px]">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-1">Tiempo Ahorrado Estimado</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-green-400">
                {Math.round(((metrics as any).total_docs_delivered * 5 + (metrics as any).total_appointments * 10) / 60)}h
              </span>
              <span className="text-sm font-medium text-slate-400">este mes</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[65%]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Docs Entregados" value={(metrics as any).total_docs_delivered} subtitle="Sin intervención" color="green" />
        <Card title="Citas Generadas" value={(metrics as any).total_appointments} subtitle="Agendadas por bot" color="green" />
        <Card title="Interacciones" value={metrics.total_messages} subtitle={`${metrics.messages_today} hoy`} />
        <Card title="Efectividad" value={`${metrics.resolution_rate}%`} subtitle="Tasa de cierre" color="green" />
      </div>

       <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Actividad de Conversaciones</h3>
          <div className="flex items-end gap-2 h-48">
            <div className="flex-1 bg-slate-100 rounded-t-lg h-[40%]" />
            <div className="flex-1 bg-slate-100 rounded-t-lg h-[60%]" />
            <div className="flex-1 bg-green-100 rounded-t-lg h-[80%]" />
            <div className="flex-1 bg-whatsapp-green rounded-t-lg h-[45%]" />
            <div className="flex-1 bg-green-600 rounded-t-lg h-[95%]" />
            <div className="flex-1 bg-slate-100 rounded-t-lg h-[30%]" />
            <div className="flex-1 bg-slate-100 rounded-t-lg h-[70%]" />
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 flex flex-col justify-center text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">Automatización 100%</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            El bot ha respondido el <b>{Math.round(((metrics as any).bot_responses / metrics.total_messages) * 100)}%</b> de todos los mensajes enviados.
          </p>
          <div className="mt-8 flex flex-col gap-2">
            <Link href="/dashboard" className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-sm text-slate-700">Ir a Chats</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'default' | 'green';
}) {
  const borderColor = {
    default: 'border-slate-200',
    green: 'border-whatsapp-border',
  }[color || 'default'];

  const valueColor = {
    default: 'text-slate-900',
    green: 'text-whatsapp-sidebar',
  }[color || 'default'];

  return (
    <div className={`card-base ${borderColor}`}>
      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className={`mt-4 text-4xl font-bold ${valueColor}`}>{value}</p>
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}
