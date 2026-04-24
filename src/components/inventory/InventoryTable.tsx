import React from 'react';
import { Boxes, Settings2, Package, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface InventoryTableProps {
  loading: boolean;
  items: any[];
}

export function InventoryTable({ loading, items }: InventoryTableProps) {
  return (
    <div className="loop-card bg-white/5 backdrop-blur-2xl border-white/5 shadow-2xl overflow-hidden rounded-[40px] p-8 md:p-12 mb-16 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Identidad / SKU</th>
              <th className="hidden lg:table-cell pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Especificación</th>
              <th className="pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] text-center">Volumen Actual</th>
              <th className="hidden md:table-cell pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocolo</th>
              <th className="pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="py-10"><div className="w-56 h-12 bg-white/5 animate-pulse rounded-2xl" /></td>
                  <td className="hidden lg:table-cell py-10"><div className="w-32 h-6 bg-white/5 animate-pulse rounded-xl" /></td>
                  <td className="py-10 text-center"><div className="w-20 h-10 bg-white/5 animate-pulse mx-auto rounded-xl" /></td>
                  <td className="hidden md:table-cell py-10"><div className="w-32 h-8 bg-white/5 animate-pulse rounded-full" /></td>
                  <td className="py-10 text-right"><div className="w-12 h-12 bg-white/5 animate-pulse ml-auto rounded-2xl" /></td>
                </tr>
              ))
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] transition-all cursor-pointer">
                  <td className="py-10">
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex w-14 h-14 bg-white/5 text-slate-500 rounded-[22px] items-center justify-center group-hover:bg-green-500 group-hover:text-slate-900 border border-white/5 group-hover:border-transparent transition-all duration-500 shadow-xl">
                        <Boxes size={22} className="group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-[15px] font-black text-white uppercase tracking-tight italic group-hover:text-green-500 transition-colors">{item.name}</p>
                          <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border ${
                            item.current_stock === 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            item.current_stock < (item.min_stock_alert || 5) ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                            'bg-green-500/10 text-green-500 border-green-500/20'
                          }`}>
                            {item.current_stock === 0 ? 'CRÍTICO' : 
                             item.current_stock < (item.min_stock_alert || 5) ? 'REPOSICIÓN' : 
                             'ÓPTIMO'}
                          </div>
                        </div>
                        <p className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-[0.3em]">{item.sku || 'SIN SKU'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell py-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic">{item.category || 'CARGA GENERAL'}</td>
                  <td className="py-10 text-xl font-black text-white text-center tracking-tighter italic">
                    {item.current_stock} 
                    <span className="text-[10px] text-slate-600 font-black ml-2 uppercase tracking-widest not-italic">{item.unit || 'uds'}</span>
                  </td>
                  <td className="hidden md:table-cell py-10">
                    <div className="flex items-center gap-2">
                       <span className={`text-[8px] font-black px-5 py-2.5 rounded-xl uppercase tracking-[0.2em] border shadow-2xl ${item.current_stock <= (item.min_stock_alert || 0) ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                         {item.current_stock <= (item.min_stock_alert || 0) ? 'INTERRUPCIÓN' : 'FLUJO NOMINAL'}
                       </span>
                    </div>
                  </td>
                  <td className="py-10 text-right">
                    <button className="w-12 h-12 flex ml-auto items-center justify-center bg-white/5 border border-white/5 text-slate-600 rounded-2xl hover:border-green-500/30 hover:text-white hover:bg-white/10 transition-all group/btn">
                      <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-32 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-24 h-24 bg-white/5 flex items-center justify-center rounded-[32px] text-slate-800 mb-10 border border-white/5 border-dashed">
                      <Package size={48} strokeWidth={1} />
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.5em] mb-6">Logística Vacía</h3>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-loose mb-12">
                      No se detectan activos en el nodo actual. Sincronice el inventario para iniciar el monitoreo.
                    </p>
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
