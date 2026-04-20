'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  AlertTriangle, 
  Zap, 
  Warehouse, 
  Search, 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  Settings2,
  Boxes,
  Activity
} from 'lucide-react';

const PAGE_SIZE = 8;

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchInventory = async (currentPage: number) => {
    setLoading(true);
    const activeCompanyId = typeof window !== 'undefined' ? localStorage.getItem('arise_active_company') : null;
    
    // Bloqueo estricto de nulos
    if (!activeCompanyId || activeCompanyId === 'null' || activeCompanyId === 'undefined') {
      setLoading(false);
      return;
    }

    const isGlobal = activeCompanyId === 'global';
    
    try {
      // 1. Contador Maestro
      let countQuery = supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true });
      
      if (!isGlobal) countQuery = countQuery.eq('company_id', activeCompanyId);
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // 2. Fetch de Datos
      let dataQuery = supabase
        .from('inventory_items')
        .select('*');
      
      if (!isGlobal) dataQuery = dataQuery.eq('company_id', activeCompanyId);
      
      const { data, error } = await dataQuery
        .order('current_stock', { ascending: true })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      if (data) setItems(data);

      // 3. Fetch de Transacciones (Kardex)
      let transQuery = supabase
        .from('inventory_transactions')
        .select('*, inventory_items(name)');
      
      if (!isGlobal) transQuery = transQuery.eq('company_id', activeCompanyId);
      
      const { data: transData } = await transQuery
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (transData) setTransactions(transData);
    } catch (err) {
      console.error('INVENTORY NODE ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(page);
  }, [page]);

  return (
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-700 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">Inventory_Node</h1>
            {typeof window !== 'undefined' && localStorage.getItem('arise_active_company') === 'global' && (
              <span className="bg-primary/10 text-primary text-[8px] font-black px-3 py-1 rounded-full tracking-[0.2em] uppercase border border-primary/20">Consolidated</span>
            )}
          </div>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] flex items-center gap-2">
            <Activity size={10} className="text-primary animate-pulse" />
            Asset Management Protocol / Diamond v7.9
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto relative z-10">
          <div className="relative group flex-1 lg:flex-none">
            <input 
              type="text" 
              placeholder="QUER_ASSETS_..." 
              className="w-full lg:w-96 pl-12 pr-6 py-5 bg-white/50 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-2xl outline-none border border-white/50 focus:bg-white focus:shadow-arise transition-all"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
          <button className="flex items-center justify-center gap-4 bg-primary text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all">
            <Plus size={16} />
            <span>Deploy_Asset</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <MetricSmall title="Master_Catalog" value={totalCount} drift="Live" icon={Package} loading={loading} />
        <MetricSmall title="Critical_Stock" value={items.filter(i => i.current_stock <= i.min_stock_alert).length} drift={items.some(i => i.current_stock <= i.min_stock_alert) ? 'ACTION' : 'CLEAR'} icon={AlertTriangle} warning={items.some(i => i.current_stock <= i.min_stock_alert)} loading={loading} />
        <MetricSmall title="Neural_Optimization" value="94.2%" drift="Optimal" icon={Zap} loading={loading} />
        <MetricSmall title="Terminal_Utilization" value="72%" drift="Stable" icon={Warehouse} loading={loading} />
      </div>

      <div className="arise-card bg-white/80 backdrop-blur-2xl border-white/50 shadow-arise overflow-hidden rounded-[40px] p-8 md:p-12 mb-16">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr>
              <th className="pb-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Asset_Identity / SKU</th>
              <th className="hidden lg:table-cell pb-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Protocol_Spec</th>
              <th className="pb-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] text-center">Current_Vol</th>
              <th className="hidden md:table-cell pb-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Health_Status</th>
              <th className="pb-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="py-8"><div className="w-56 h-12 arise-skeleton rounded-2xl" /></td>
                  <td className="hidden lg:table-cell py-8"><div className="w-32 h-6 arise-skeleton rounded-xl" /></td>
                  <td className="py-8 text-center"><div className="w-20 h-10 arise-skeleton mx-auto rounded-xl" /></td>
                  <td className="hidden md:table-cell py-8"><div className="w-32 h-8 arise-skeleton rounded-full" /></td>
                  <td className="py-8 text-right"><div className="w-12 h-12 arise-skeleton ml-auto rounded-2xl" /></td>
                </tr>
              ))
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="group hover:bg-[#f8fafc]/80 transition-all cursor-pointer">
                  <td className="py-8">
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex w-14 h-14 bg-slate-900 text-white rounded-[22px] items-center justify-center group-hover:bg-primary group-hover:shadow-[0_0_20px_#0045bd33] transition-all duration-500">
                        <Boxes size={22} className="group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-[15px] font-black text-slate-900 uppercase tracking-tight italic">{item.name}</p>
                          <div className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-tighter uppercase ${
                            item.current_stock === 0 ? 'bg-red-50 text-red-500' : 
                            item.current_stock < 5 ? 'bg-amber-50 text-amber-500' : 
                            'bg-emerald-50 text-emerald-500'
                          }`}>
                            {item.current_stock === 0 ? 'STOCK_CRITICAL' : 
                             item.current_stock < 5 ? 'STOCK_WARNING' : 
                             'STOCK_OPTIMAL'}
                          </div>
                        </div>
                        <p className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-[0.2em]">{item.sku || 'SKU_VOID'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell py-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">{item.category || 'GEN_CARGO'}</td>
                  <td className="py-8 text-lg font-black text-slate-900 text-center tracking-tighter italic">
                    {item.current_stock} 
                    <span className="text-[9px] text-slate-300 font-black ml-2 uppercase tracking-widest not-italic">{item.unit || 'uds'}</span>
                  </td>
                  <td className="hidden md:table-cell py-8">
                    <span className={`text-[8px] font-black px-5 py-2.5 rounded-xl uppercase tracking-[0.2em] shadow-sm ${item.current_stock <= item.min_stock_alert ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20 shadow-rose-100' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-emerald-100'}`}>
                      {item.current_stock <= item.min_stock_alert ? 'REPLENISH' : 'MAX_FLOW'}
                    </span>
                  </td>
                  <td className="py-8 text-right">
                    <button className="w-12 h-12 flex ml-auto items-center justify-center bg-white border border-slate-100 text-slate-400 rounded-2xl hover:border-primary hover:text-primary hover:shadow-lg transition-all">
                      <Settings2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-32 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-24 h-24 bg-[#f8fafc] flex items-center justify-center rounded-[32px] text-slate-200 mb-10 shadow-inner">
                      <Boxes size={48} strokeWidth={1} />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.5em] mb-6">Inventory_Void</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose mb-12">
                      Zero operational assets detected in this node. Initialize logistics to establish control.
                    </p>
                    <button className="btn-arise px-12">Initialize_Protocol</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-8 flex flex-col sm:flex-row justify-between items-center bg-[#f8fafc]/50 backdrop-blur-sm mt-4 rounded-[32px] border border-white/50 border-dashed gap-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
          Flux_Pool: {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} // Total_Catalog: {totalCount}
        </p>
          <div className="flex gap-4">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-14 h-14 bg-white shadow-arise flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all rounded-2xl group"><ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/></button>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-14 h-14 bg-white shadow-arise flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all rounded-2xl group"><ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-16">
        <div className="lg:col-span-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 mb-12 px-6 flex items-center gap-4">
            <Activity size={14} className="text-primary animate-pulse" />
            Neural_Kardex_Terminal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {transactions.map(t => (
              <div key={t.id} className="arise-card bg-white/90 p-8 flex items-center justify-between group rounded-[32px] hover:shadow-2xl transition-all">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${t.type === 'in' ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'}`}>
                    {t.type === 'in' ? <ArrowLeft size={20} className="-rotate-45" /> : <ArrowRight size={20} className="-rotate-45" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight italic truncate pr-4">{t.inventory_items?.name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">
                      {t.type === 'in' ? 'Kardex_Input' : t.type === 'out' ? 'Kardex_Output' : 'Audit_Sync'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-black italic tracking-tighter ${t.type === 'in' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {t.type === 'in' ? '+' : '-'}{t.quantity}
                  </p>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-3">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="col-span-full p-20 text-center bg-slate-50/30 rounded-[40px] border-2 border-dashed border-slate-100/50 backdrop-blur-sm">
                 <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em]">No recent flux detected</p>
              </div>
            )}
          </div>
        </div>

        <div className="arise-card bg-[#0b1326] p-10 flex flex-col rounded-[48px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32" />
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-10">Intake_Quick_Action</h3>
            
            <div className="space-y-10">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4">Quantity_Pulse</label>
                <div className="grid grid-cols-2 gap-4">
                  {[6, 12, 24, 48].map(n => (
                    <button key={n} className="py-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10 text-white text-lg font-black italic transition-all group active:scale-95">
                      +{n} <span className="text-[8px] text-white/30 not-italic ml-1 font-bold group-hover:text-primary transition-colors">UDS</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SCANNER TRIGGER */}
              <div className="flex flex-col gap-4 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 relative overflow-hidden group">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                       <Zap size={16} />
                    </div>
                    <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">Neural Scanner v1.0</span>
                 </div>
                 <p className="text-[10px] font-bold text-emerald-700/70 leading-relaxed">
                   Carga una factura o foto para procesar stock automáticamente vía IA.
                 </p>
                 <input type="file" className="hidden" id="scanner-input" />
                 <button onClick={() => document.getElementById('scanner-input')?.click()} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-200 active:scale-95">
                   Escanear Factura
                 </button>
                 <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>

              <div className="pt-6 border-t border-white/5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4">Manual_Sequence</label>
                <div className="flex gap-4">
                   <input type="number" placeholder="000" className="w-full bg-white/5 border-none rounded-2xl p-5 text-white font-black italic text-xl outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                   <button className="btn-arise px-10">Exec</button>
                </div>
              </div>
            </div>

            <div className="mt-16 p-6 rounded-[32px] bg-primary/10 border border-primary/20 backdrop-blur-xl">
               <div className="flex items-center gap-4 text-primary">
                  <Activity size={16} className="animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Neural_Ready</span>
               </div>
               <p className="text-white/40 text-[9px] font-bold mt-4 leading-relaxed uppercase tracking-widest">Select an item and quantity to commit a real-time Kardex entry.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricSmall({ title, value, icon: Icon, warning, loading }: any) {
  if (loading) return <div className="arise-card p-10 bg-white border-none shadow-arise animate-pulse h-40" />;
  
  return (
    <div className={`arise-card p-10 border-none shadow-arise group bg-white text-slate-900`}>
      <div className="flex justify-between items-start mb-10">
        <p className={`text-[8px] font-black uppercase tracking-[0.4em] text-slate-400`}>{title}</p>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${warning ? 'bg-rose-500/10 text-rose-600 shadow-xl shadow-rose-100' : 'bg-[#f7f9fb] text-slate-300 group-hover:text-primary group-hover:bg-primary/5'}`}>
          <Icon size={20} />
        </div>
      </div>
      <h3 className="text-3xl md:text-4xl font-black tracking-tighter leading-none italic uppercase">{value}</h3>
    </div>
  );
}
