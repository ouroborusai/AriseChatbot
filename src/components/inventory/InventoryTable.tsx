import React from 'react';
import { Boxes, Settings2, Package, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface InventoryTableProps {
  loading: boolean;
  items: any[];
}

export function InventoryTable({ loading, items }: InventoryTableProps) {
  return (
    <div className="bg-white border border-slate-100 shadow-sm overflow-hidden rounded-2xl relative">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-[0.4em]">Identidad / SKU</th>
              <th className="hidden lg:table-cell px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-[0.4em]">Especificación</th>
              <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] text-center">Volumen</th>
              <th className="hidden md:table-cell px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-[0.4em]">Estado Neural</th>
              <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><div className="w-32 h-8 bg-slate-50 animate-pulse rounded-lg" /></td>
                  <td className="hidden lg:table-cell px-6 py-4"><div className="w-24 h-4 bg-slate-50 animate-pulse rounded-md" /></td>
                  <td className="px-6 py-4 text-center"><div className="w-12 h-6 bg-slate-50 animate-pulse mx-auto rounded-md" /></td>
                  <td className="hidden md:table-cell px-6 py-4"><div className="w-24 h-6 bg-slate-50 animate-pulse rounded-full" /></td>
                  <td className="px-6 py-4 text-right"><div className="w-8 h-8 bg-slate-50 animate-pulse ml-auto rounded-lg" /></td>
                </tr>
              ))
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex w-9 h-9 bg-slate-50 text-slate-400 rounded-lg items-center justify-center group-hover:bg-[#22c55e] group-hover:text-white border border-slate-100 group-hover:border-transparent transition-all shadow-sm">
                        <Boxes size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight group-hover:text-[#22c55e] transition-colors">{item.name}</p>
                          <div className={`px-1.5 py-0.5 rounded text-[6px] font-black tracking-widest uppercase border ${
                            item.current_stock === 0 ? 'bg-rose-50 text-rose-500 border-rose-100' : 
                            item.current_stock < (item.min_stock_alert || 5) ? 'bg-amber-50 text-amber-500 border-amber-100' : 
                            'bg-emerald-50 text-emerald-500 border-emerald-100'
                          }`}>
                            {item.current_stock === 0 ? 'CRÍTICO' : 
                             item.current_stock < (item.min_stock_alert || 5) ? 'REPOSICIÓN' : 
                             'ÓPTIMO'}
                          </div>
                        </div>
                        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{item.sku || 'SIN SKU'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{item.category || 'CARGA GENERAL'}</td>
                  <td className="px-6 py-4 text-base font-black text-slate-900 text-center tracking-tighter">
                    {item.current_stock} 
                    <span className="text-[8px] text-slate-300 font-black ml-1 uppercase tracking-widest">{item.unit || 'uds'}</span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`text-[7px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border shadow-sm ${item.current_stock <= (item.min_stock_alert || 0) ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                         {item.current_stock <= (item.min_stock_alert || 0) ? 'INTERRUPCIÓN' : 'FLUJO NOMINAL'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="w-8 h-8 flex ml-auto items-center justify-center bg-white border border-slate-100 text-slate-300 rounded-lg hover:border-[#22c55e] hover:text-[#22c55e] transition-all group/btn">
                      <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-xl text-slate-200 mb-4 border border-slate-100 border-dashed">
                      <Package size={24} />
                    </div>
                    <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Logística Vacía</h3>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
