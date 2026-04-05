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
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        Cargando métricas...
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-red-400">
        Error al cargar métricas
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard de Métricas</h1>
          <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">
            Volver al Chat
          </Link>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card title="Total Conversaciones" value={metrics.total_conversations} subtitle="Todas" />
          <Card title="Conversaciones Hoy" value={metrics.conversations_today} subtitle="24 horas" />
          <Card title="Esta Semana" value={metrics.conversations_this_week} subtitle="7 días" />
          <Card title="Abiertas" value={metrics.open_conversations} subtitle="Sin cerrar" color="yellow" />
          <Card title="Cerradas" value={metrics.closed_conversations} subtitle="Resueltas" color="green" />
          <Card title="Tasa Resolución" value={`${metrics.resolution_rate}%`} subtitle="Cerradas/Total" color="green" />
        </div>

        {/* Métricas de tiempo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card
            title="Tiempo Respuesta Promedio"
            value={`${metrics.average_response_time_minutes}m`}
            subtitle={`${metrics.average_response_time_ms}ms`}
          />
          <Card title="Total Mensajes" value={metrics.total_messages} subtitle={`${metrics.messages_today} hoy`} />
        </div>

        {/* Última actualización */}
        <p className="text-sm text-gray-500 text-center">
          Última actualización: {new Date(metrics.timestamp).toLocaleString('es')}
        </p>
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
  color?: 'default' | 'green' | 'yellow';
}) {
  const borderColor = {
    default: 'border-gray-800',
    green: 'border-green-900',
    yellow: 'border-yellow-900',
  }[color || 'default'];

  const valueColor = {
    default: 'text-white',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
  }[color || 'default'];

  return (
    <div className={`bg-gray-900 border ${borderColor} rounded-lg p-6`}>
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      {subtitle && <p className="text-gray-600 text-xs mt-2">{subtitle}</p>}
    </div>
  );
}
