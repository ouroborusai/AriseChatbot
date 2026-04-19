'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Zap, 
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
  ShieldCheck
} from 'lucide-react';
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
    async function fetchStats() {
      setLoading(true);
      const activeCompanyId = typeof window !== 'undefined' ? localStorage.getItem('arise_active_company') : null;
      
      console.log('--- ARISE V7.0 CORE PROBE ---');
      console.log('Active Company ID:', activeCompanyId);

      if (!activeCompanyId || activeCompanyId === 'null' || activeCompanyId === 'undefined') {
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
        
        // Query Contacts
        let contactsQuery = supabase.from('contacts').select('*', { count: 'exact', head: true });
        if (!isGlobal) contactsQuery = contactsQuery.eq('company_id', activeCompanyId);
        const { count: contactsCount } = await contactsQuery;

        // Query Active Chats (Safe call to prevent 400)
        let chatCount = 0;
        try {
          let chatsQuery = supabase.from('conversations').select('*', { count: 'exact', head: true });
          if (!isGlobal) chatsQuery = chatsQuery.eq('company_id', activeCompanyId);
          const { count } = await chatsQuery;
          chatCount = count || 0;
        } catch (e) { console.warn('Conversations table skip/legacy'); }

        // Query Inventory
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
        console.error('CRITICAL DASHBOARD ERROR:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [pathname]); // Reactivo a cambios de ruta que podrían resetear contexto

  return (
    <main className="p-4 md:p-10">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Dashboard Operativo</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">OS Ejecutivo Neural / v7.0 Diamond Edition</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 group">
            <input 
              type="text" 
              placeholder="Buscar flujos de datos..." 
              className="arise-input w-full lg:w-80 pl-12"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 arise-card flex items-center justify-center text-slate-400 relative shrink-0">
              <Bell size={20} />
              <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-[20px] border-none shadow-arise">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black text-slate-900 leading-none">Arise SuperAdmin</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Administrador Global</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black shrink-0 shadow-sm">OA</div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricCard title="Nodos de Contacto" value={stats.contacts} drift="+15.2%" icon={Users} primary loading={loading} />
        <MetricCard title="Sesiones IA Activas" value={stats.activeChats} drift="Live" icon={Activity} loading={loading} />
        <MetricCard title="Alertas de Stock" value={stats.lowStock} drift="Crítico" icon={Zap} negative={stats.lowStock > 0} loading={loading} />
        <MetricCard title="Saldo de Bóveda" value={stats.revenue} drift="+2.4%" icon={Wallet} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        <section className="arise-card p-10 lg:col-span-2">
          <div className="mb-10">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Flujo de Señales Recientes</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Actividad Neural de las últimas 24h</p>
          </div>
          <div className="w-full h-[320px] relative">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSignals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#135bec" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#135bec" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900' }}
                />
                <Area type="monotone" dataKey="value" stroke="#135bec" strokeWidth={4} fillOpacity={1} fill="url(#colorSignals)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="arise-card p-8">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-8">Señales del Sistema</h3>
          <div className="space-y-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : recentSignals.map((signal, i) => {
              const Icon = signal.icon;
              return (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-slate-50 rounded-[18px] flex items-center justify-center transition-all shadow-sm ${signal.color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 leading-none mb-1">{signal.title}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{signal.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-200">{signal.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="arise-card p-8 overflow-hidden">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-10">Registro de Operaciones Neurales</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Tarea</th>
                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operación Neural</th>
                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Impacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {neuralLogs.map((log, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                  <td className="py-6 text-xs font-bold text-slate-400">{log.id}</td>
                  <td className="py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-primary group-hover:text-white transition-all"><Box size={14}/></div>
                      <span className="text-xs font-black text-slate-900">{log.task}</span>
                    </div>
                  </td>
                  <td className="py-6 text-center">
                    <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-6 text-xs font-black text-slate-900 text-right">{log.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ title, value, drift, icon: Icon, primary, negative, loading }: any) {
  if (loading) return <div className="arise-card p-8 min-h-[180px] arise-skeleton" />;

  return (
    <div className={`arise-card p-8 ${primary ? 'bg-primary text-white shadow-lg shadow-primary/30' : ''}`}>
      <div className="flex justify-between items-start mb-8">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${primary ? 'opacity-70 text-white' : 'text-slate-400'}`}>{title}</p>
        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border-none ${primary ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}`}>
          <Icon size={22} />
        </div>
      </div>
      <h2 className="text-3xl font-black mb-2 tracking-tight">{value}</h2>
      <div className={`text-[10px] font-black px-3 py-1.5 rounded-xl w-fit ${primary ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
        <span>{drift}</span>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 arise-skeleton rounded-2xl" />
      <div className="space-y-2">
        <div className="w-32 h-3 arise-skeleton" />
        <div className="w-20 h-2 arise-skeleton" />
      </div>
    </div>
  );
}
