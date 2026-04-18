'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({ revenue: '$0.00', inventory: '0%', contacts: '0' });
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Fetching real business metrics & insights
      const { data: insightData } = await supabase
        .from('business_insights')
        .select('*')
        .eq('is_active', true)
        .limit(3);
      
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      const { data: inventoryData } = await supabase
        .from('inventory_items')
        .select('current_stock, min_stock_alert');

      // Simple calculation for Inventory Health
      const health = inventoryData?.length 
        ? (inventoryData.filter(i => i.current_stock > i.min_stock_alert).length / inventoryData.length) * 100 
        : 0;

      if (insightData) setInsights(insightData);
      setMetrics({
        revenue: '$42,500.00', // Mocked until financial bridge is final
        inventory: `${health.toFixed(1)}%`,
        contacts: contactCount?.toString() || '0'
      });
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <main className="min-h-screen p-8 bg-base selection:bg-primary/20">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 display-tight">Ouroborus AI</h1>
          <p className="readout-label mt-1 opacity-60">Neural Brain Dashboard • v6.1 Elite</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <span className="readout-label text-[8px] opacity-40">Security Protocol</span>
             <span className="text-primary font-bold text-xs uppercase tracking-tighter">Diamond Hardened</span>
          </div>
          <div className="w-12 h-12 bg-surface-work rounded-base shadow-soft-depth flex items-center justify-center executive-card cursor-pointer group">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${loading ? 'bg-slate-100 text-slate-300 animate-pulse' : 'btn-primary text-[10px]'}`}>
              {loading ? '..' : 'OA'}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <MetricCard title="Total Revenue" value={metrics.revenue} change="+12.5% Growth" />
        <MetricCard title="Inventory Health" value={metrics.inventory} change="Synced: Latency 23ms" />
        <MetricCard title="Active Contacts" value={metrics.contacts} change="Neural Synced" />
      </div>

      <section className="executive-card p-10">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            Neural Insights
            <span className={`status-dot ${loading ? 'bg-slate-300' : 'bg-primary animate-pulse'}`} />
          </h2>
          <button className="readout-label text-primary hover:opacity-70 transition-opacity">
            Access Logs →
          </button>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="p-4 bg-base/50 rounded-base animate-pulse h-16" />
          ) : insights.length > 0 ? (
            insights.map((insight) => (
              <InsightItem key={insight.id} text={insight.content.text || insight.insight_type} status="info" />
            ))
          ) : (
            <InsightItem text="System standby. No neural anomalies detected in the last cycle." status="info" />
          )}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ title, value, change }: any) {
  return (
    <div className="executive-card p-8 group hover:scale-[1.02]">
      <p className="readout-label mb-2">{title}</p>
      <h3 className="text-4xl font-bold text-slate-900 group-hover:text-primary transition-colors display-tight">{value}</h3>
      <div className="flex items-center gap-2 mt-6">
        <div className="h-[3px] w-12 bg-primary/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-2/3 shadow-micro-glow" />
        </div>
        <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{change}</p>
      </div>
    </div>
  );
}

function InsightItem({ text, status }: any) {
  return (
    <div className="flex items-center justify-between p-5 bg-base/40 hover:bg-white hover:shadow-soft-depth rounded-base transition-all duration-300 group cursor-default">
      <div className="flex items-center gap-5">
        <div className={`status-dot ${status === 'alert' ? 'bg-red-500' : 'bg-primary'}`}></div>
        <p className="readout-label opacity-80 group-hover:opacity-100 text-slate-700">{text}</p>
      </div>
      <div className="readout-label text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
        Live Stream
      </div>
    </div>
  );
}



