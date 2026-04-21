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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
      <MetricSmall title="Master_Catalog" value={totalCount} icon={Package} loading={loading} />
      <MetricSmall 
        title="Critical_Stock" 
        value={criticalCount} 
        icon={AlertTriangle} 
        warning={hasCritical} 
        loading={loading} 
      />
      <MetricSmall title="Neural_Optimization" value="94.2%" icon={Zap} loading={loading} />
      <MetricSmall title="Terminal_Utilization" value="72%" icon={Warehouse} loading={loading} />
    </div>
  );
}
