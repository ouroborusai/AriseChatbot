import React from 'react';
import { Boxes, Settings2, Package, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface InventoryTableProps {
  loading: boolean;
  items: any[];
}

export function InventoryTable({ loading, items }: InventoryTableProps) {
  return (
    <div className="bg-white border border-slate-100 shadow-xl overflow-hidden rounded-[2rem] relative animate-in fade-in zoom-in-95 duration-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-5 text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100">Identidad / SKU</th>
              <th className="hidden lg:table-cell px-6 py-5 text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100">Especificación</th>
              <th className="px-6 py-5 text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] text-center border-b border-slate-100">Volumen</th>
              <th className="hidden md:table-cell px-6 py-5 text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100">Estado Neural</th>
              <th className="px-6 py-5 text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] text-right border-b border-slate-100">Acciones</th>
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
                <tr key={item.id} className="group hover:bg-slate-50 transition-all cursor-pointer relative">
                  <td className="px-6 py-5 border-b border-slate-50 relative">
                    <div className="absolute left-0 top-0 w-1 h-0 bg-[#22c55e] group-hover:h-full transition-all duration-300" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="hidden sm:flex w-11 h-11 bg-white text-slate-900 rounded-xl items-center justify-center group-hover:bg-[#22c55e] group-hover:text-white border border-slate-100 group-hover:border-transparent transition-all duration-500 shadow-sm">
                        <Boxes size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight group-hover:text-[#22c55e] transition-colors duration-500">{item.name}</p>
                          <div className={`px-2 py-0.5 rounded-md text-[7px] font-black tracking-widest uppercase border shadow-sm ${
                            item.current_stock === 0 ? 'bg-rose-50 text-rose-500 border-rose-100' : 
                            item.current_stock < (item.min_stock_alert || 5) ? 'bg-amber-50 text-amber-500 border-amber-100' : 
                            'bg-emerald-50 text-emerald-500 border-emerald-100'
                          }`}>
                            {item.current_stock === 0 ? 'CRÍTICO' : 
                             item.current_stock < (item.min_stock_alert || 5) ? 'REPOSICIÓN' : 
                             'ÓPTIMO'}
                          </div>
                        </div>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">{item.sku || 'NODO_UNNAMED'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-5 border-b border-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{item.category || 'CARGA GENERAL'}</td>
                  <td className="px-6 py-5 border-b border-slate-50 text-xl font-black text-slate-900 text-center tracking-tighter">
                    {item.current_stock} 
                    <span className="text-[9px] text-slate-300 font-black ml-1.5 uppercase tracking-widest">{item.unit || 'uds'}</span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-5 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                       <span className={`text-[8px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] border shadow-sm ${item.current_stock <= (item.min_stock_alert || 0) ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                         {item.current_stock <= (item.min_stock_alert || 0) ? 'INTERRUPCIÓN' : 'FLUJO NOMINAL'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 border-b border-slate-50 text-right">
                    <button className="w-10 h-10 flex ml-auto items-center justify-center bg-white border border-slate-100 text-slate-300 rounded-xl hover:bg-[#0f172a] hover:text-white hover:border-transparent transition-all shadow-sm active:scale-90 group/btn">
                      <ArrowUpRight size={16} />
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
