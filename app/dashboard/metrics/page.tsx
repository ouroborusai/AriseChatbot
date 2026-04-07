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
    <div className="space-y-6">
      <div className="card-base">
        <div className="card-header">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-whatsapp-border font-semibold">WhatsApp</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard de Métricas</h1>
            <p className="text-sm text-slate-500">Analiza el rendimiento de los chats y la respuesta del agente.</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex rounded-3xl bg-whatsapp-green px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-whatsapp-greenHover"
          >
            Volver al chat
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Total conversaciones" value={metrics.total_conversations} subtitle="Todas" />
        <Card title="Conversaciones hoy" value={metrics.conversations_today} subtitle="Últimas 24h" />
        <Card title="Esta semana" value={metrics.conversations_this_week} subtitle="Últimos 7 días" />
        <Card title="Abiertas" value={metrics.open_conversations} subtitle="Pendientes" color="green" />
        <Card title="Cerradas" value={metrics.closed_conversations} subtitle="Resueltas" color="default" />
        <Card title="Tasa de resolución" value={`${metrics.resolution_rate}%`} subtitle="Objetivo" color="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Tiempo respuesta promedio"
          value={`${metrics.average_response_time_minutes}m`}
          subtitle={`${metrics.average_response_time_ms} ms`}
        />
        <Card title="Total mensajes" value={metrics.total_messages} subtitle={`${metrics.messages_today} hoy`} />
      </div>

      <p className="text-sm text-slate-500 text-center">
        Última actualización: {new Date(metrics.timestamp).toLocaleString('es')}
      </p>
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
