import React from 'react';
import { Package, AlertTriangle, ArrowUpRight } from 'lucide-react';
import type { InventoryItem } from '@/types/database';

interface InventoryTableProps {
  loading: boolean;
  items: InventoryItem[];
}

export function InventoryTable({ loading, items }: InventoryTableProps) {
  return (
    <div className="bg-white shadow-[0_4px_30px_-10px_rgba(34,197,94,0.15)] overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-1000 border border-slate-100" style={{ borderRadius: 40 }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Activo_Identidad</th>
              <th className="hidden md:table-cell px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">SKU_Code</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-center italic opacity-60">Stock_Nivel</th>
              <th className="hidden lg:table-cell px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-right italic opacity-60">Valorización</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-right italic opacity-60">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="px-8 py-8"><div className="w-48 h-10 bg-slate-50 animate-pulse" style={{ borderRadius: 40 }} /></td>
                  <td className="hidden md:table-cell px-8 py-8"><div className="w-32 h-6 bg-slate-50 animate-pulse" style={{ borderRadius: 40 }} /></td>
                  <td className="px-8 py-8 text-center"><div className="w-24 h-8 bg-slate-50 animate-pulse mx-auto" style={{ borderRadius: 40 }} /></td>
                  <td className="hidden lg:table-cell px-8 py-8 text-right"><div className="w-28 h-6 bg-slate-50 animate-pulse ml-auto" style={{ borderRadius: 40 }} /></td>
                  <td className="px-8 py-8 text-right"><div className="w-12 h-12 bg-slate-50 animate-pulse ml-auto" style={{ borderRadius: 40 }} /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                        <Package size={48} className="text-slate-200 mx-auto mb-6 opacity-50" />
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic">NO_HAY_ACTIVOS_REGISTRADOS</p>
                    </td>
                </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-50 text-slate-300 flex items-center justify-center font-black border border-slate-100 shadow-inner group-hover:bg-[#22c55e] group-hover:text-white group-hover:border-transparent transition-all duration-500 italic" style={{ borderRadius: 40 }}>
                        <Package size={16} />
                      </div>
                      <div>
                        <span className="text-[12px] font-black text-[#1a1a1a] uppercase tracking-tight group-hover:text-[#22c55e] transition-colors italic">
                          {item.name || 'ACTIVO_SIN_NOMBRE'}
                        </span>
                        <p className="md:hidden text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest italic opacity-60">
                          {item.sku || 'NO_SKU'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-8 py-8">
                    <p className="text-[11px] font-black text-[#1a1a1a] tracking-tight italic opacity-80">{item.sku || 'N/A'}</p>
                    {item.category && (
                      <span className="inline-block mt-2 text-[8px] font-black bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 uppercase tracking-widest italic shadow-sm" style={{ borderRadius: 40 }}>
                        {item.category}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-8 text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 border shadow-sm ${
                      (item.current_stock || 0) <= (item.min_stock_alert || 0) 
                        ? 'bg-rose-50 border-rose-100 text-rose-500' 
                        : 'bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e]'
                    }`} style={{ borderRadius: 40 }}>
                      {(item.current_stock || 0) <= (item.min_stock_alert || 0) && <AlertTriangle size={12} className="animate-pulse" />}
                      <span className="text-[11px] font-black tracking-widest italic">
                        {item.current_stock || 0} {item.unit || 'UN'}
                      </span>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-8 py-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest italic opacity-80">
                    ${(item.price || 0).toLocaleString('es-CL')}
                  </td>
                  <td className="px-8 py-8 text-right">
                    <button className="w-12 h-12 flex ml-auto items-center justify-center bg-[#22c55e] text-white font-black text-[10px] uppercase tracking-[0.4em] transition-all hover:bg-[#1a1a1a] hover:scale-[1.02] active:scale-95 shadow-xl shadow-[#22c55e]/20 italic" style={{ borderRadius: 40 }}>
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
