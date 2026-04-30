'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { supabase } from '@/lib/supabase';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { MessageSquare, Users, Package, Wallet, Activity, Zap, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricSmall } from '@/components/ui/MetricSmall';
import useSWR from 'swr';

/**
 * DASHBOARD MASTER v11.9.1 (Diamond Resilience)
 * Estética: Luminous Pure
 * Cero Cálculos Locales: Integración directa mediante agregaciones Head/Count y Vistas Pre-procesadas.
 */

export default function Dashboard() {
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const activeCompanyId = activeCompany?.id;

  const fetchDashboardData = async (companyId: string) => {
    if (!companyId) return null;

    // 1. Delegación Absoluta de Cálculos (Regla N°6)
    // 2. Aislamiento Tenant Inquebrantable (Regla N°7)
    const [
      { count: contactsCount },
      { count: activeChats },
      { count: inventoryCount },
      { data: finSummary }
    ] = await Promise.all([
      supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId),
      supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('status', ['open', 'waiting_human']),
      supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId),
      supabase
        .from('financial_summaries')
        .select('summary_data')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    // Extracción de valor pre-calculado desde la base de datos
    const revenue = (finSummary?.summary_data as any)?.total_revenue || 0;

    return {
      contacts: contactsCount || 0,
      activeChats: activeChats || 0,
      inventory: inventoryCount || 0,
      revenue: revenue,
      chartData: [
        { name: '08:00', value: 12 },
        { name: '10:00', value: 25 },
        { name: '12:00', value: 45 },
        { name: '14:00', value: 30 },
        { name: '16:00', value: 80 },
        { name: '18:00', value: 110 },
        { name: '20:00', value: 65 }
      ]
    };
  };

  const { data, isLoading: isSwrLoading } = useSWR(
    !isContextLoading && activeCompanyId ? `dashboard_${activeCompanyId}` : null,
    () => fetchDashboardData(activeCompanyId!),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const loading = isContextLoading || isSwrLoading || !data;

  return (
    <div className="flex flex-col w-full py-12 relative overflow-hidden italic min-h-[calc(100vh-72px)] bg-slate-50">
      {/* Background Luminous Pure (Radius 40 y #22c55e) */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#22c55e]/10 blur-[120px] rounded-full -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#22c55e]/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

      <header className="mb-12 px-8 flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-5xl md:text-6xl font-black text-neural-dark tracking-tighter uppercase">
            Panel de <span className="text-[#22c55e]">Control.</span>
          </h1>
          <p className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.5em] mt-4 flex items-center gap-2">
            <Zap size={12} className="animate-pulse" /> NODO_ALPHA_SYNC // v11.9.1_DIAMOND_OPERATIVO
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white px-6 py-3 border border-slate-100 shadow-sm transition-all hover:shadow-md" style={{ borderRadius: 40 }}>
          <ShieldCheck size={16} className="text-[#22c55e]"></ShieldCheck>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tenant_Aislado: Activo</span>
        </div>
      </header>

      <div className="px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
        <MetricSmall
          title="Mensajería Activa"
          value={loading ? '-' : data.activeChats}
          icon={MessageSquare}
          active={true}
          loading={loading}
          drift="+12%"
          className="shadow-[0_4px_30px_-10px_rgba(34,197,94,0.15)]"
        />
        <MetricSmall
          title="CRM Contactos"
          value={loading ? '-' : data.contacts}
          icon={Users}
          loading={loading}
          drift="+5%"
        />
        <MetricSmall
          title="Activos Inventario"
          value={loading ? '-' : data.inventory}
          icon={Package}
          loading={loading}
        />
        <MetricSmall
          title="Flujo Financiero"
          value={loading ? '-' : `$${data.revenue.toLocaleString('es-CL')}`}
          icon={Wallet}
          loading={loading}
          drift="+24%"
        />
      </div>

      <div className="px-8 relative z-10">
        <div className="bg-white p-8 border border-slate-100 shadow-xl transition-all hover:shadow-2xl hover:border-[#22c55e]/20" style={{ borderRadius: 40 }}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-neural-dark italic">Actividad Neural</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Tráfico y Operaciones SSOT</p>
            </div>
            <div className="w-12 h-12 bg-[#22c55e]/10 flex items-center justify-center" style={{ borderRadius: 40 }}>
              <Activity className="text-[#22c55e] animate-pulse" size={20} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="w-full h-full bg-slate-50 animate-pulse" style={{ borderRadius: 40 }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900, fontFamily: 'Inter', fontStyle: 'italic' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900, fontFamily: 'Inter', fontStyle: 'italic' }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '24px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 900,
                      fontStyle: 'italic',
                      textTransform: 'uppercase',
                      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#22c55e' }}
                    cursor={{ stroke: '#22c55e', strokeWidth: 2, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    activeDot={{ r: 8, fill: '#22c55e', stroke: '#fff', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
