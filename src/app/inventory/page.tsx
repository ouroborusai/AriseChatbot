'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Package, Activity, Filter } from 'lucide-react';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import useSWR from 'swr';
import type { InventoryItem } from '@/types/database';

const PAGE_SIZE = 10;

export default function InventoryPage() {
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);

  const activeCompanyId = activeCompany?.id;

  const fetchInventory = async (companyId: string, currentPage: number) => {
    if (!companyId) return { items: [], totalCount: 0 };
    
    const { count } = await supabase
      .from('inventory_items')
      .select('*', { count: 'estimated', head: true })
      .eq('company_id', companyId);

    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    return { totalCount: count || 0, items: data as InventoryItem[] || [] };
  };

  const { data, isLoading: isSwrLoading } = useSWR(
    !isContextLoading && activeCompanyId ? `inventory_${activeCompanyId}_${page}` : null,
    () => fetchInventory(activeCompanyId!, page),
    { revalidateOnFocus: false }
  );

  const loading = isContextLoading || isSwrLoading || !data;
  const items = data?.items || [];
  const totalCount = data?.totalCount || 0;

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-700 overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#22c55e]/5 blur-[100px] rounded-full -z-10 animate-pulse" />
      
      <div className="px-8 lg:px-12 max-w-7xl mx-auto w-full">
        <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e]" style={{ borderRadius: 40 }}>
                <Package size={20} />
              </div>
              <p className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.5em] mt-4 flex items-center gap-2 italic">
                <Activity size={12} className="animate-pulse" />
                CATÁLOGO_MAESTRO_DE_ACTIVOS
              </p>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-[#1a1a1a] tracking-tighter italic uppercase">
              Control de <span className="text-[#22c55e]">Stock.</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-3 bg-white text-[#1a1a1a] px-8 py-4 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all border border-slate-100 shadow-sm italic" style={{ borderRadius: 40 }}>
              <Filter size={16} />
              Filtrar
            </button>
            <button className="flex items-center gap-3 bg-[#22c55e] text-white px-8 py-4 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#1a1a1a] transition-all shadow-xl shadow-[#22c55e]/20 hover:shadow-2xl hover:shadow-[#1a1a1a]/20 hover:-translate-y-1 italic" style={{ borderRadius: 40 }}>
              <Plus size={16} />
              Nuevo Item
            </button>
          </div>
        </header>

        <div className="mb-8 flex items-center bg-white p-2 border border-slate-100 shadow-sm relative z-10" style={{ borderRadius: 40 }}>
          <div className="flex items-center pl-6 pr-4">
            <Search className="text-slate-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="BUSCAR_POR_NOMBRE_O_SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent py-4 outline-none text-[11px] font-black text-[#1a1a1a] uppercase tracking-widest placeholder:text-slate-300 italic"
          />
        </div>

        <InventoryTable 
          loading={loading} 
          items={filteredItems} 
        />
      </div>
    </div>
  );
}
