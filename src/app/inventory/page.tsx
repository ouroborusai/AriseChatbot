'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  Activity,
  Sparkles,
  Package,
  Layers,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { InventoryStats } from '@/components/inventory/InventoryStats';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { InventoryKardex } from '@/components/inventory/InventoryKardex';
import { InventoryQuickActions } from '@/components/inventory/InventoryQuickActions';
import Image from 'next/image';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import useSWR from 'swr';

const PAGE_SIZE = 8;

export default function InventoryPage() {
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const [page, setPage] = useState(0);
  
  const activeCompanyId = activeCompany?.id;

  const fetchInventory = async (companyId: string, currentPage: number) => {
    const isGlobal = companyId === 'global';
    
    let countQuery = supabase
      .from('inventory_items')
      .select('*', { count: 'estimated', head: true });
    
    if (!isGlobal) countQuery = countQuery.eq('company_id', companyId);

    let dataQuery = supabase
      .from('inventory_items')
      .select('*');
    
    if (!isGlobal) dataQuery = dataQuery.eq('company_id', companyId);
    
    let transQuery = supabase
      .from('inventory_transactions')
      .select('*, inventory_items(name)');
    
    if (!isGlobal) transQuery = transQuery.eq('company_id', companyId);
    
    const [
      { count },
      { data, error },
      { data: transData }
    ] = await Promise.all([
      countQuery,
      dataQuery
        .order('current_stock', { ascending: true })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1),
      transQuery
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    if (error) throw error;
    
    return {
      totalCount: count || 0,
      items: data || [],
      transactions: transData || []
    };
  };

  const { data, error, isLoading: isSwrLoading } = useSWR(
    !isContextLoading && activeCompanyId ? `inventory_${activeCompanyId}_${page}` : null,
    () => fetchInventory(activeCompanyId || 'global', page),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const loading = isContextLoading || isSwrLoading || !data;
  const items = data?.items || [];
  const transactions = data?.transactions || [];
  const totalCount = data?.totalCount || 0;

  const hasCriticalStock = items.some(i => i.current_stock <= (i.min_stock_alert || 0));
  const criticalCount = items.filter(i => i.current_stock <= (i.min_stock_alert || 0)).length;

  return (
    <div className="flex flex-col w-full max-w-full py-4 md:py-8 animate-in fade-in duration-300 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#22c55e]/5 blur-[64px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#0f172a]/5 blur-[64px] rounded-full -z-10" />

      {/* HEADER SECTION - ASLAS STYLE (Optimized Scales) */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-10 px-2 relative z-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            Control de <span className="text-[#22c55e]">Stock</span>
          </h1>
          <p className="text-slate-400 text-[7px] font-black uppercase tracking-[0.4em] mt-3.5 flex items-center gap-2.5">
            <Package size={10} className="text-[#22c55e]" />
            CATÁLOGO MAESTRO DE REPUESTOS / v2.5
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group">
            <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#22c55e] transition-colors z-20" />
            <input 
              type="text" 
              placeholder="BUSCAR SKU / ITEM..." 
              className="w-full lg:w-72 pl-11 pr-4 py-3 bg-white text-[8px] font-black uppercase tracking-widest text-slate-900 rounded-xl outline-none border border-slate-100 focus:border-[#22c55e]/30 transition-all shadow-sm placeholder:text-slate-200"
            />
          </div>
          
          <button className="flex items-center justify-center gap-3 bg-[#0f172a] text-white px-6 py-3 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-[#22c55e] transition-all active:scale-95 group">
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            <span>Nuevo Item</span>
          </button>
        </div>
      </header>

      {/* STATS SECTION */}
      <div className="mb-10 px-1">
        <InventoryStats 
          totalCount={totalCount} 
          criticalCount={criticalCount} 
          hasCritical={hasCriticalStock} 
          loading={loading} 
        />
      </div>

      {/* MAIN TABLE */}
      <div className="px-1">
        <InventoryTable loading={loading} items={items} />
      </div>

      {/* PAGINATION - COMPACT */}
      <div className="p-3.5 flex flex-col sm:flex-row justify-between items-center bg-white mt-4 rounded-2xl border border-slate-50 shadow-sm gap-4">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center border border-slate-100">
              <Layers size={10} className="text-slate-300" />
           </div>
           <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Página <span className="text-slate-900">{page + 1}</span> // <span className="text-[#22c55e]">{totalCount}</span> Unidades
           </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-9 h-9 bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#22c55e] disabled:opacity-20 transition-all rounded-lg group shadow-sm">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform"/>
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-9 h-9 bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#22c55e] disabled:opacity-20 transition-all rounded-lg group shadow-sm">
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform"/>
          </button>
        </div>
      </div>

      {/* SECONDARY PANELS - COMPACT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 px-1">
        <div className="lg:col-span-2">
           <InventoryKardex transactions={transactions} />
        </div>
        <InventoryQuickActions />
      </div>
    </div>
  );
}
