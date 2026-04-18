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
  Boxes
} from 'lucide-react';

const PAGE_SIZE = 8;

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchInventory = async (currentPage: number) => {
    setLoading(true);
    const activeCompanyId = typeof window !== 'undefined' ? localStorage.getItem('arise_active_company') : null;
    
    // Bloqueo estricto de nulos
    if (!activeCompanyId || activeCompanyId === 'null' || activeCompanyId === 'undefined') {
      return;
    }

    const { count } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', activeCompanyId);

    setTotalCount(count || 0);

    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('company_id', activeCompanyId)
      .order('current_stock', { ascending: true })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory(page);
  }, [page]);

  return (
    <main className="p-4 md:p-10">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-12">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Operaciones</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">OS Ejecutivo Neural / v6.22 Industrial Edition</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-none">
            <input 
              type="text" 
              placeholder="Filtrar base maestra..." 
              className="arise-input w-full lg:w-80 pl-12"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
          <button className="btn-arise flex items-center justify-center gap-3 w-full sm:w-auto">
            <Plus size={16} />
            <span>Agregar Activo</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricSmall title="Catálogo de Activos" value={totalCount} icon={Package} loading={loading} />
        <MetricSmall title="Alertas de Stock" value={items.filter(i => i.current_stock <= i.min_stock_alert).length} icon={AlertTriangle} warning={items.some(i => i.current_stock <= i.min_stock_alert)} loading={loading} />
        <MetricSmall title="Prioridad Neural" value="Optimizar" icon={Zap} loading={loading} />
        <MetricSmall title="Carga de Almacén" value="68%" icon={Warehouse} loading={loading} />
      </div>

      <div className="arise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificador / SKU</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría de Protocolo</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vol. Actual</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Salud de Stock</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="p-8"><div className="w-48 h-10 arise-skeleton" /></td>
                  <td className="p-8"><div className="w-32 h-6 arise-skeleton" /></td>
                  <td className="p-8 text-center"><div className="w-20 h-8 arise-skeleton mx-auto" /></td>
                  <td className="p-8"><div className="w-28 h-6 arise-skeleton rounded-full" /></td>
                  <td className="p-8 text-right"><div className="w-10 h-10 arise-skeleton ml-auto" /></td>
                </tr>
              ))
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-[18px] flex items-center justify-center text-slate-300 group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                        <Boxes size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{item.sku || 'NÚCLEO-SIN-SKU'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-tighter">{item.category || 'Carga General'}</td>
                  <td className="p-8 text-sm font-black text-slate-900 text-center">{item.current_stock} <span className="text-[10px] text-slate-300 font-bold ml-1 uppercase">{item.unit || 'uds'}</span></td>
                  <td className="p-8">
                    <span className={item.current_stock <= item.min_stock_alert ? 'badge-arise-danger' : 'badge-arise-success'}>
                      {item.current_stock <= item.min_stock_alert ? 'REPONER' : 'ÓPTIMO'}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-[18px] hover:bg-accent hover:text-white transition-all">
                      <Settings2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-24 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-24 h-24 bg-slate-50 flex items-center justify-center rounded-[32px] text-slate-200 mb-8 border border-slate-100 shadow-inner">
                      <Boxes size={48} strokeWidth={1} />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Nodo de Inventario Vacío</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-relaxed mb-8">
                      No hemos detectado activos vinculados a este nodo de empresa. 
                      Inicia la cadena de suministro agregando tu primer producto.
                    </p>
                    <button 
                      onClick={() => {/* Lógica para abrir modal */}}
                      className="text-primary text-[10px] font-black uppercase tracking-widest px-8 py-3 bg-primary/5 rounded-full hover:bg-primary hover:text-white transition-all border border-primary/10"
                    >
                      Inicializar Inventario
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-8 border-t border-slate-50 flex justify-between items-center bg-slate-50/10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Pool Maestro: {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount} registros
        </p>
        <div className="flex gap-3">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-12 h-12 arise-card flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all shadow-sm"><ArrowLeft size={18}/></button>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-12 h-12 arise-card flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all shadow-sm"><ArrowRight size={18}/></button>
        </div>
      </div>
     </div>
    </main>
  );
}

function MetricSmall({ title, value, icon: Icon, warning, loading }: any) {
  if (loading) {
    return (
      <div className="arise-card p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="w-20 h-2 arise-skeleton" />
          <div className="w-10 h-10 arise-skeleton rounded-xl" />
        </div>
        <div className="w-16 h-8 arise-skeleton" />
      </div>
    );
  }
  return (
    <div className="arise-card p-6 group">
      <div className="flex justify-between items-start mb-6">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${warning ? 'bg-red-50 text-red-500 shadow-lg shadow-red-100' : 'bg-slate-50 text-slate-300 group-hover:text-primary group-hover:bg-primary/5'}`}>
          <Icon size={18} />
        </div>
      </div>
      <h3 className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{value}</h3>
    </div>
  );
}
