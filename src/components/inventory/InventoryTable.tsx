import React from 'react';
import { Boxes, Settings2, Package, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface InventoryTableProps {
  loading: boolean;
  items: any[];
}

export function InventoryTable({ loading, items }: InventoryTableProps) {
  return (
    <div className="loop-card overflow-hidden relative animate-in fade-in zoom-in-95 duration-1000">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100 italic opacity-60">Identidad_/_SKU</th>
              <th className="hidden lg:table-cell px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100 italic opacity-60">Especificación</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-center border-b border-slate-100 italic opacity-60">Volumen_Neto</th>
              <th className="hidden md:table-cell px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100 italic opacity-60">Estado_Neural</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-right border-b border-slate-100 italic opacity-60">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="px-8 py-8"><div className="w-48 h-10 bg-slate-50 animate-pulse rounded-xl" /></td>
                  <td className="hidden lg:table-cell px-8 py-8"><div className="w-32 h-6 bg-slate-50 animate-pulse rounded-lg" /></td>
                  <td className="px-8 py-8 text-center"><div className="w-16 h-10 bg-slate-50 animate-pulse mx-auto rounded-xl" /></td>
                  <td className="hidden md:table-cell px-8 py-8"><div className="w-28 h-8 bg-slate-50 animate-pulse rounded-xl" /></td>
                  <td className="px-8 py-8 text-right"><div className="w-12 h-12 bg-slate-50 animate-pulse ml-auto rounded-xl" /></td>
                </tr>
              ))
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50 transition-all cursor-pointer relative">
                  <td className="px-8 py-8 border-b border-slate-50 relative">
                    <div className="absolute left-0 top-0 w-1.5 h-0 bg-primary group-hover:h-full transition-all duration-700" />
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="hidden sm:flex w-14 h-14 bg-white text-slate-300 rounded-xl items-center justify-center group-hover:bg-primary group-hover:text-white border border-slate-100 group-hover:border-transparent transition-all duration-700 shadow-sm shadow-inner italic font-black text-lg">
                        <Boxes size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <p className="text-[14px] font-black text-neural-dark uppercase tracking-tight group-hover:text-primary transition-colors duration-500 italic">{item.name}</p>
                          <div className={`px-3 py-1 rounded-xl text-[9px] font-black tracking-widest uppercase border shadow-sm italic ${
                            item.current_stock === 0 ? 'bg-rose-50 text-rose-500 border-rose-100 shadow-rose-100' : 
                            item.current_stock < (item.min_stock_alert || 5) ? 'bg-amber-50 text-amber-500 border-amber-100 shadow-amber-100' : 
                            'bg-primary/5 text-primary border-primary/10 shadow-primary/5'
                          }`}>
                            {item.current_stock === 0 ? 'CRÍTICO' : 
                             item.current_stock < (item.min_stock_alert || 5) ? 'REPOSICIÓN' : 
                             'ÓPTIMO'}
                          </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic opacity-60">{item.sku || 'NODO_UNNAMED'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-8 py-8 border-b border-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest italic opacity-80">{item.category || 'CARGA GENERAL'}</td>
                  <td className="px-8 py-8 border-b border-slate-50 text-2xl font-black text-neural-dark text-center tracking-tighter italic">
                    {item.current_stock} 
                    <span className="text-[11px] text-slate-300 font-black ml-2 uppercase tracking-widest opacity-60">{item.unit || 'uds'}</span>
                  </td>
                  <td className="hidden md:table-cell px-8 py-8 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                       <span className={`text-[9px] font-black px-5 py-2.5 rounded-xl uppercase tracking-[0.2em] border shadow-sm italic ${item.current_stock <= (item.min_stock_alert || 0) ? 'bg-rose-50 text-rose-500 border-rose-100 shadow-xl' : 'bg-primary/10 text-primary border-primary/20'}`}>
                         {item.current_stock <= (item.min_stock_alert || 0) ? 'INTERRUPCIÓN' : 'FLUJO NOMINAL'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-8 border-b border-slate-50 text-right">
                    <button className="btn-loop w-14 h-14 flex ml-auto items-center justify-center">
                      <ArrowUpRight size={20} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-32 text-center bg-slate-50/30">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-white flex items-center justify-center rounded-xl text-slate-200 mb-6 border border-slate-100 border-dashed shadow-inner">
                      <Package size={40} />
                    </div>
                    <h3 className="text-[12px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Logística_Vacía</h3>
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
