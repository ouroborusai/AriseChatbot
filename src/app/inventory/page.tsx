'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  Activity,
  Sparkles
} from 'lucide-react';
import { InventoryStats } from '@/components/inventory/InventoryStats';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { InventoryKardex } from '@/components/inventory/InventoryKardex';
import { InventoryQuickActions } from '@/components/inventory/InventoryQuickActions';

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

  const hasCriticalStock = items.some(i => i.current_stock <= i.min_stock_alert);
  const criticalCount = items.filter(i => i.current_stock <= i.min_stock_alert).length;

  return (
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-700 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">Logística MMC</h1>
            {typeof window !== 'undefined' && localStorage.getItem('arise_active_company') === 'global' && (
              <span className="bg-primary/10 text-primary text-[8px] font-black px-3 py-1 rounded-full tracking-[0.2em] uppercase border border-primary/20">Consolidado</span>
            )}
          </div>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] flex items-center gap-2">
            <Sparkles size={10} className="text-primary animate-pulse" />
            Gestión de Repuestos / Arise Business OS
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto relative z-10">
          <div className="relative group flex-1 lg:flex-none">
            <input 
              type="text" 
              placeholder="BUSCAR_REPUESTOS_..." 
              className="w-full lg:w-96 pl-12 pr-6 py-5 bg-white/40 backdrop-blur-xl text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-[24px] outline-none border border-white/20 focus:bg-white focus:shadow-xl transition-all"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors" />
          </div>
          <button className="flex items-center justify-center gap-4 bg-primary text-white px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 transition-all">
            <Plus size={16} />
            <span>Ingresar Repuesto</span>
          </button>
        </div>
      </header>

      <InventoryStats 
        totalCount={totalCount} 
        criticalCount={criticalCount} 
        hasCritical={hasCriticalStock} 
        loading={loading} 
      />

      <InventoryTable loading={loading} items={items} />

      <div className="p-8 flex flex-col sm:flex-row justify-between items-center bg-[#f8fafc]/50 backdrop-blur-sm mt-4 rounded-[32px] border border-white/50 border-dashed gap-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
          Flux_Pool: {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} // Total_Catalog: {totalCount}
        </p>
        <div className="flex gap-4">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-14 h-14 bg-white shadow-arise flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all rounded-2xl group"><ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/></button>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-14 h-14 bg-white shadow-arise flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all rounded-2xl group"><ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-16">
        <InventoryKardex transactions={transactions} />
        <InventoryQuickActions />
      </div>
    </div>
  );
}
