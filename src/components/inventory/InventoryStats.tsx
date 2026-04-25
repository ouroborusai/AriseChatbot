import React from 'react';
import { Package, AlertTriangle, Zap, Warehouse } from 'lucide-react';
import { MetricSmall } from '@/components/ui/MetricSmall';

interface InventoryStatsProps {
  totalCount: number;
  criticalCount: number;
  hasCritical: boolean;
  loading: boolean;
}

export function InventoryStats({ totalCount, criticalCount, hasCritical, loading }: InventoryStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <MetricSmall title="Catálogo Maestro" value={totalCount} drift="Live Sync" icon={Package} loading={loading} />
      <MetricSmall 
        title="Stock Crítico" 
        value={criticalCount} 
        drift={criticalCount > 0 ? "REQUIERE ACCIÓN" : "OK"}
        icon={AlertTriangle} 
        warning={hasCritical} 
        loading={loading} 
      />
      <MetricSmall title="Optimización Neural" value="94.2%" drift="+2.1%" icon={Zap} loading={loading} />
      <MetricSmall title="Uso de Terminal" value="72%" drift="Capacidad" icon={Warehouse} loading={loading} />
    </div>
  );
}
