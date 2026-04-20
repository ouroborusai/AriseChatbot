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
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-8 mb-12">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">Inventory_Node</h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <Boxes size={10} className="text-primary" />
            Asset Management Protocol / v7.0
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-none">
            <input 
              type="text" 
              placeholder="QUER_ASSETS_..." 
              className="w-full lg:w-96 pl-12 pr-6 py-4 bg-[#f2f4f6] text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-2xl outline-none focus:bg-white focus:shadow-arise transition-all"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
          <button className="flex items-center justify-center gap-4 bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Plus size={16} />
            <span>Deploy_Asset</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricSmall title="Master_Catalog" value={totalCount} icon={Package} loading={loading} />
        <MetricSmall title="Active_Alerts" value={items.filter(i => i.current_stock <= i.min_stock_alert).length} icon={AlertTriangle} warning={items.some(i => i.current_stock <= i.min_stock_alert)} loading={loading} />
        <MetricSmall title="Optimization_Priority" value="High" icon={Zap} loading={loading} />
        <MetricSmall title="Warehouse_Load" value="68%" icon={Warehouse} loading={loading} />
      </div>

      <div className="arise-card bg-white border-none shadow-arise overflow-hidden rounded-[24px] md:rounded-[32px] p-6 md:p-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px] md:min-w-[800px]">
          <thead>
            <tr>
              <th className="pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity / SKU</th>
              <th className="hidden lg:table-cell pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol_Category</th>
              <th className="pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Current_Vol</th>
              <th className="hidden md:table-cell pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Stock_Health</th>
              <th className="pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="py-6"><div className="w-48 h-10 arise-skeleton rounded-xl" /></td>
                  <td className="hidden lg:table-cell py-6"><div className="w-32 h-6 arise-skeleton rounded-lg" /></td>
                  <td className="py-6 text-center"><div className="w-20 h-8 arise-skeleton mx-auto rounded-lg" /></td>
                  <td className="hidden md:table-cell py-6"><div className="w-28 h-6 arise-skeleton rounded-full" /></td>
                  <td className="py-6 text-right"><div className="w-10 h-10 arise-skeleton ml-auto rounded-lg" /></td>
                </tr>
              ))
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="group hover:bg-[#f7f9fb] transition-all cursor-pointer">
                  <td className="py-6">
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex w-12 h-12 bg-slate-900 text-white rounded-[18px] items-center justify-center group-hover:bg-primary transition-all shadow-md">
                        <Boxes size={20} />
                      </div>
                      <div>
                        <p className="text-[13px] md:text-[14px] font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                        <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-widest">{item.sku || 'SKU_VOID'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{item.category || 'GEN_LOAD'}</td>
                  <td className="py-6 text-sm font-black text-slate-900 text-center">{item.current_stock} <span className="text-[8px] text-slate-300 font-black ml-1 uppercase">{item.unit || 'uds'}</span></td>
                  <td className="hidden md:table-cell py-6">
                    <span className={`text-[8px] font-black px-4 py-2 rounded-lg uppercase tracking-widest ${item.current_stock <= item.min_stock_alert ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                      {item.current_stock <= item.min_stock_alert ? 'REPLENISH' : 'OPTIMAL_FLUX'}
                    </span>
                  </td>
                  <td className="py-6 text-right">
                    <button className="w-10 h-10 flex ml-auto items-center justify-center bg-white border border-slate-100 text-slate-400 rounded-[12px] hover:border-primary hover:text-primary transition-all shadow-sm">
                      <Settings2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-20 h-20 bg-[#f7f9fb] flex items-center justify-center rounded-[28px] text-slate-300 mb-6 shadow-inner">
                      <Boxes size={40} strokeWidth={1} />
                    </div>
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] mb-4">Inventory_Node_Empty</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-10">
                      No assets detected in this company's logistics chain.
                    </p>
                    <button 
                      className="text-[9px] font-black uppercase tracking-[0.3em] px-10 py-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    >
                      Initialize_Logistics
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 md:p-10 flex flex-col sm:flex-row justify-between items-center bg-[#f7f9fb] mt-4 rounded-[24px] gap-6">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Inventory_Pool: {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} // Total: {totalCount}
        </p>
          <div className="flex gap-4">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-12 h-12 md:w-14 md:h-14 bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all rounded-2xl"><ArrowLeft size={18}/></button>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-12 h-12 md:w-14 md:h-14 bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all rounded-2xl"><ArrowRight size={18}/></button>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="mt-16">
          <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 px-4 flex items-center gap-3">
            <Activity size={12} className="text-primary" />
            Neural_Kardex_Flux
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {transactions.map(t => (
              <div key={t.id} className="bg-white p-8 flex items-center justify-between group hover:bg-[#f7f9fb] transition-all rounded-[28px] shadow-sm">
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {t.type === 'in' ? <ArrowLeft size={18} className="-rotate-45" /> : <ArrowRight size={18} className="-rotate-45" />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight italic truncate max-w-[200px]">{t.inventory_items?.name}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                      {t.type === 'in' ? 'Supply_Input' : t.type === 'out' ? 'Dispatch_Output' : 'Audit_Adjustment'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-black ${t.type === 'in' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {t.type === 'in' ? '+' : '-'}{t.quantity}
                  </p>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {transactions.length === 0 && (
          <div className="col-span-full p-12 text-center bg-slate-50/50 rounded-[32px] border border-dashed border-slate-100">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin movimientos registrados hoy</p>
          </div>
        )}
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
