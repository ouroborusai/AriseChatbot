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
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-300 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full -z-10" />

      {/* HEADER SECTION - ASLAS STYLE (Optimized Scales) */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-12 mb-24 px-4 relative z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="relative">
          <h1 className="text-h1-mobile md:text-h1 font-black text-neural-dark tracking-tighter leading-[0.85] uppercase italic">
            Control de <br/><span className="text-primary drop-shadow-xl">Stock.</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-10 flex items-center gap-4 italic opacity-60">
            <Package size={16} className="text-primary animate-pulse" />
            CATÁLOGO_MAESTRO_DE_ACTIVOS_//_v10.4_PLATINUM
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 relative z-10">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="BUSCAR_SKU_/_ITEM_..." 
              className="loop-input w-full lg:w-96 pl-14"
            />
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors z-20" />
          </div>
          
          <button className="btn-loop flex items-center justify-center gap-5">
            <Plus size={18} />
            <span>NUEVO_ITEM</span>
          </button>
        </div>
      </header>

      {/* STATS SECTION */}
      <div className="mb-12 px-2">
        <InventoryStats 
          totalCount={totalCount} 
          criticalCount={criticalCount} 
          hasCritical={hasCriticalStock} 
          loading={loading} 
        />
      </div>

      {/* MAIN TABLE */}
      <div className="px-2">
        <InventoryTable loading={loading} items={items} />
      </div>

      {/* PAGINATION - COMPACT PLATINUM */}
      <div className="loop-card p-8 flex flex-col sm:flex-row justify-between items-center mt-12 gap-8 relative z-10">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-inner">
              <Layers size={16} className="text-slate-300" />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic opacity-60">
              Página <span className="text-neural-dark opacity-100">{page + 1}</span> // <span className="text-primary opacity-100">{totalCount}</span> Unidades_Registradas
           </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-14 h-14 bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 disabled:opacity-20 transition-all group shadow-sm" style={{ borderRadius: 'var(--radius-md)' }}>
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/>
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-14 h-14 bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 disabled:opacity-20 transition-all group shadow-sm" style={{ borderRadius: 'var(--radius-md)' }}>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        </div>
      </div>

      {/* SECONDARY PANELS - COMPACT PLATINUM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-16 px-2">
        <div className="lg:col-span-2">
           <InventoryKardex transactions={transactions} />
        </div>
        <InventoryQuickActions />
      </div>
    </div>
  );
}
