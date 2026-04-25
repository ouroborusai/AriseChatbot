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
    () => fetchInventory(activeCompanyId!, page),
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
    <div className="flex flex-col w-full max-w-full py-6 md:py-12 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PREMIUM BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-green-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full -z-10" />

      {/* HEADER SECTION - DIAMOND v10.0 */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16 px-2">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]" />
             <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Logística Industrial</span>
          </div>
          <div className="flex items-center gap-6">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
              Control de <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500">Stock</span>
            </h1>
            {typeof window !== 'undefined' && localStorage.getItem('arise_active_company') === 'global' && (
              <span className="bg-green-500/10 text-green-500 text-[9px] font-black px-4 py-2 rounded-xl tracking-[0.2em] uppercase border border-green-500/20 shadow-lg">Global</span>
            )}
          </div>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-5 flex items-center gap-3">
            <Package size={12} className="text-green-500" />
            CATÁLOGO MAESTRO DE REPUESTOS / PROTOCOLO LOOP
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input 
              type="text" 
              placeholder="BUSCAR SKU / ITEM..." 
              className="w-full lg:w-96 pl-14 pr-6 py-4.5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white rounded-[24px] outline-none border border-white/10 focus:border-green-500/30 focus:bg-white/10 transition-all relative z-10"
            />
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 z-20" />
          </div>
          
          <button className="flex items-center justify-center gap-4 bg-white text-slate-900 px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-green-500 hover:text-white transition-all active:scale-95">
            <Plus size={18} />
            <span>Nuevo Item</span>
          </button>
        </div>
      </header>

      {/* STATS SECTION */}
      <div className="mb-12 px-1">
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

      {/* PAGINATION */}
      <div className="p-10 flex flex-col sm:flex-row justify-between items-center bg-white/5 backdrop-blur-xl mt-8 rounded-[40px] border border-white/5 border-dashed gap-10">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
              <Layers size={16} className="text-slate-500" />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
              Página <span className="text-white">{page + 1}</span> // Catálogo Maestro <span className="text-green-500">{totalCount}</span> Unidades
           </p>
        </div>
        <div className="flex gap-5">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-16 h-16 bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-green-500 disabled:opacity-20 transition-all rounded-2xl group shadow-2xl">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform"/>
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-16 h-16 bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-green-500 disabled:opacity-20 transition-all rounded-2xl group shadow-2xl">
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        </div>
      </div>

      {/* SECONDARY PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-16 px-1">
        <div className="lg:col-span-2">
           <InventoryKardex transactions={transactions} />
        </div>
        <InventoryQuickActions />
      </div>
    </div>
  );
}
