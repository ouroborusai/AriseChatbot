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
      <MetricSmall title="Catálogo Maestro" value={totalCount} icon={Package} loading={loading} />
      <MetricSmall 
        title="Stock Crítico" 
        value={criticalCount} 
        icon={AlertTriangle} 
        warning={hasCritical} 
        loading={loading} 
      />
      <MetricSmall title="Optimización Neural" value="94.2%" icon={Zap} loading={loading} />
      <MetricSmall title="Uso de Terminal" value="72%" icon={Warehouse} loading={loading} />
    </div>
  );
}
