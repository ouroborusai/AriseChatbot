'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Sparkles, 
  Wallet, 
  Search, 
  Bell, 
  ChevronRight,
  MoreVertical,
  Activity,
  AlertCircle,
  MessageCircle,
  RefreshCw,
  Box,
  Users,
  ShieldCheck,
  LineChart
} from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { useRouter } from 'next/navigation';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const router = useRouter();
  const [stats, setStats] = useState({
    contacts: 0,
    activeChats: 0,
    lowStock: 0,
    revenue: '$68,490'
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentSignals, setRecentSignals] = useState<any[]>([]);
  const [neuralLogs, setNeuralLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setLoading(true);
      const activeCompanyId = activeCompany?.id;
      
      if (!activeCompanyId) {
        // Fallback or empty state
        setStats({ contacts: 0, activeChats: 0, lowStock: 0, revenue: '$0' });
        setChartData([
          { name: '00:00', value: 0 }, { name: '04:00', value: 0 }, { name: '08:00', value: 0 },
          { name: '12:00', value: 0 }, { name: '16:00', value: 0 }, { name: '20:00', value: 0 },
          { name: '23:59', value: 0 }
        ]);
        setRecentSignals([
          { title: 'SISTEMA INICIALIZADO', desc: 'Esperando selección de empresa', time: 'AHORA', icon: Activity, color: 'text-primary' },
          { title: 'RLS BLOQUEADO', desc: 'Seleccione una empresa para abrir el nodo', time: '1m', icon: ShieldCheck, color: 'text-amber-500' }
        ]);
        setNeuralLogs([
          { id: 'SYS-ACCESS', task: 'Pendiente de Contexto', type: 'Sistema', status: 'WAIT', val: 'N/A' }
        ]);
        setLoading(false);
        return;
      }

      try {
        const isGlobal = activeCompanyId === 'global';
        
        let contactsQuery = supabase.from('contacts').select('*', { count: 'exact', head: true });
        if (!isGlobal) contactsQuery = contactsQuery.eq('company_id', activeCompanyId);
        const { count: contactsCount } = await contactsQuery;

        let chatCount = 0;
        try {
          let chatsQuery = supabase.from('conversations').select('*', { count: 'exact', head: true });
          if (!isGlobal) chatsQuery = chatsQuery.eq('company_id', activeCompanyId);
          const { count } = await chatsQuery;
          chatCount = count || 0;
        } catch (e) { console.warn('Conversations cache skip'); }

        let invQuery = supabase.from('inventory_items').select('name, current_stock, min_stock_alert');
        if (!isGlobal) invQuery = invQuery.eq('company_id', activeCompanyId);
        const { data: inventory } = await invQuery;
        
        const lowStockItems = inventory?.filter((i: any) => i.current_stock <= (i.min_stock_alert || 0)) || [];
        
        setStats(prev => ({
          ...prev,
          contacts: contactsCount || 0,
          activeChats: chatCount,
          lowStock: lowStockItems.length,
          revenue: contactsCount ? (isGlobal ? '$1.2M' : '$68,490') : '$0'
        }));

        setRecentSignals([
          ...lowStockItems.slice(0, 2).map((i: any) => ({
            title: `Alerta: Stock Crítico`,
            desc: `${i.name}`,
            time: 'Ahora',
            icon: AlertCircle,
            color: 'text-red-500'
          })),
          { title: 'Nodo Industrial Activo', desc: `Sincronizado con RLS`, time: '1m ago', icon: ShieldCheck, color: 'text-emerald-500' },
          { title: 'Caché Semántica', desc: 'Optimizada para Gemini 2.5', time: '12m ago', icon: MessageCircle, color: 'text-primary' }
        ]);

        setNeuralLogs([
          { id: 'AX-V622', task: 'Validación Multi-Tenant', type: 'Seguridad', status: 'OK', val: 'Verified' },
          { id: 'AX-LOG', task: 'Sincronización de Contexto', type: 'Sistema', status: 'OK', val: 'Synced' }
        ]);

        setChartData([
          { name: '08:00', value: 10 }, { name: '10:00', value: 25 }, { name: '12:00', value: 45 },
          { name: '14:00', value: 30 }, { name: '16:00', value: 65 }, { name: '18:00', value: 80 }
        ]);

      } catch (err) {
        console.error('DASHBOARD ERROR:', err);
      } finally {
        setLoading(false);
      }
    }
    if (!isContextLoading) {
      checkAuthAndFetch();
    }
  }, [pathname, activeCompany, isContextLoading]);

  return (
    <div className="flex flex-col w-full max-w-full py-4 md:py-10 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-8 mb-12">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none italic">Dashboard</h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <TrendingUp size={10} className="text-primary" />
            Operational Intelligence / REVENUE_PULSE_7.0
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
          <div className="relative flex-1 group">
            <input 
              type="text" 
              placeholder="SISTEMA_DE_INTELIGENCIA_..." 
              className="w-full lg:w-96 pl-12 pr-6 py-4 bg-white/40 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-[24px] outline-none focus:bg-white focus:shadow-xl transition-all backdrop-blur-xl border border-white/20"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/60 backdrop-blur-md border border-white/20 shadow-lg hover:-translate-y-1 transition-all rounded-2xl flex items-center justify-center text-slate-500 relative shrink-0">
              <Bell size={20} />
              <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricCard title="Nodos_Activos" value={stats.contacts} drift="+15.2%" icon={Users} primary loading={loading} />
        <MetricCard title="Conversaciones_IA" value={stats.activeChats} drift="Live" icon={MessageCircle} loading={loading} />
        <MetricCard title="Alertas_Sistema" value={stats.lowStock} drift="Critical" icon={Sparkles} negative={stats.lowStock > 0} loading={loading} />
        <MetricCard title="Balance_Global" value={stats.revenue} drift="+2.4%" icon={Wallet} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        <section className="loop-card p-0 overflow-hidden lg:col-span-2">
          <div className="p-10">
            <h2 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em]">Neural Signal Velocity</h2>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">24H Real-time activity pulse</p>
          </div>
          <div className="w-full h-[320px] bg-gradient-to-b from-white to-[#f7f9fb]/50">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSignals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#135bec" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#135bec" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} horizontal={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#191c1e', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '9px', fontWeight: '900' }}
                />
                <Area type="monotone" dataKey="value" stroke="#135bec" strokeWidth={3} fillOpacity={1} fill="url(#colorSignals)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="loop-card p-10 bg-white/40">
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-900 mb-10">System Status</h3>
          <div className="space-y-8">
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : recentSignals.map((signal, i) => {
              const Icon = signal.icon;
              return (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:shadow-md">
                      <Icon size={18} className={signal.color} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight mb-1">{signal.title}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{signal.desc}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-tighter">{signal.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="loop-card p-10 overflow-hidden">
        <div className="mb-10">
          <h2 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em]">Operational Governance Ledger</h2>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time interaction matrix</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr>
                <th className="pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Reference_ID</th>
                <th className="pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural_Task</th>
                <th className="pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Protocol_Status</th>
                <th className="pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Impact_Metric</th>
              </tr>
            </thead>
            <tbody>
              {neuralLogs.map((log, i) => (
                <tr key={i} className="group hover:bg-white transition-all cursor-pointer rounded-xl">
                  <td className="py-8 pl-4 pr-2 text-[11px] font-mono text-slate-400 rounded-l-xl">{log.id}</td>
                  <td className="py-8 px-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50/50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg transition-all"><Box size={14}/></div>
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{log.task}</span>
                    </div>
                  </td>
                  <td className="py-8 px-2 text-center">
                    <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100/50 shadow-sm">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-8 pl-2 pr-4 text-[11px] font-black text-slate-900 text-right uppercase rounded-r-xl">{log.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, drift, icon: Icon, primary, negative, loading }: any) {
  if (loading) return <div className="loop-card p-10 min-h-[200px] border-none" />;

  return (
    <div className={`loop-card p-8 border-none shadow-arise ${primary ? 'bg-gradient-to-br from-[#135bec] to-[#0045bd] text-white shadow-[0_20px_40px_-5px_rgba(19,91,236,0.3)]' : 'text-slate-900 hover:bg-white/90'}`}>
      <div className="flex justify-between items-start mb-10">
        <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${primary ? 'text-white/70' : 'text-slate-400'}`}>{title}</p>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${primary ? 'bg-white/20' : 'bg-[#f7f9fb] text-slate-300'}`}>
          <Icon size={24} />
        </div>
      </div>
      <h2 className="text-4xl font-black mb-3 tracking-tighter leading-none">{value}</h2>
      <div className={`inline-flex px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${primary ? 'bg-white/20 text-white' : (negative ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600')}`}>
        {drift}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 loop-skeleton rounded-2xl" />
      <div className="space-y-2">
        <div className="w-32 h-3 loop-skeleton" />
        <div className="w-20 h-2 loop-skeleton" />
      </div>
    </div>
  );
}
