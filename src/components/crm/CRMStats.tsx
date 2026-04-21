import React from 'react';
import { Users, MessageSquare, Activity, ShieldCheck } from 'lucide-react';
import { MetricSmall } from '@/components/ui/MetricSmall';

interface CRMStatsProps {
  totalCount: number;
  activeChats: number;
  loading: boolean;
}

export function CRMStats({ totalCount, activeChats, loading }: CRMStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
      <MetricSmall title="Registros Maestro" value={totalCount} icon={Users} loading={loading} />
      <MetricSmall title="Vínculos Neurales" value={activeChats} icon={MessageSquare} active loading={loading} />
      <MetricSmall title="Estado de Sincronía" value="Online" icon={Activity} loading={loading} />
      <MetricSmall title="Integridad de Datos" value="99.9%" icon={ShieldCheck} loading={loading} />
    </div>
  );
}
