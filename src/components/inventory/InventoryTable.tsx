import React from 'react';
import { Boxes, Settings2 } from 'lucide-react';

interface InventoryTableProps {
  loading: boolean;
  items: any[];
}

export function InventoryTable({ loading, items }: InventoryTableProps) {
  return (
    <div className="loop-card bg-white/80 backdrop-blur-2xl border-white/50 shadow-arise overflow-hidden rounded-[40px] p-8 md:p-12 mb-16">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr>
              <th className="pb-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Asset_Identity / SKU</th>
              <th className="hidden lg:table-cell pb-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Protocol_Spec</th>
              <th className="pb-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] text-center">Current_Vol</th>
              <th className="hidden md:table-cell pb-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Health_Status</th>
              <th className="pb-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="py-8"><div className="w-56 h-12 loop-skeleton rounded-2xl" /></td>
                  <td className="hidden lg:table-cell py-8"><div className="w-32 h-6 loop-skeleton rounded-xl" /></td>
                  <td className="py-8 text-center"><div className="w-20 h-10 loop-skeleton mx-auto rounded-xl" /></td>
                  <td className="hidden md:table-cell py-8"><div className="w-32 h-8 loop-skeleton rounded-full" /></td>
                  <td className="py-8 text-right"><div className="w-12 h-12 loop-skeleton ml-auto rounded-2xl" /></td>
                </tr>
              ))
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="group hover:bg-[#f8fafc]/80 transition-all cursor-pointer">
                  <td className="py-8">
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex w-14 h-14 bg-slate-900 text-white rounded-[22px] items-center justify-center group-hover:bg-primary group-hover:shadow-[0_0_20px_#0045bd33] transition-all duration-500">
                        <Boxes size={22} className="group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-[15px] font-black text-slate-900 uppercase tracking-tight italic">{item.name}</p>
                          <div className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-tighter uppercase \${
                            item.current_stock === 0 ? 'bg-red-50 text-red-500' : 
                            item.current_stock < 5 ? 'bg-amber-50 text-amber-500' : 
                            'bg-emerald-50 text-emerald-500'
                          }`}>
                            {item.current_stock === 0 ? 'STOCK_CRITICAL' : 
                             item.current_stock < 5 ? 'STOCK_WARNING' : 
                             'STOCK_OPTIMAL'}
                          </div>
                        </div>
                        <p className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-[0.2em]">{item.sku || 'SKU_VOID'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell py-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">{item.category || 'GEN_CARGO'}</td>
                  <td className="py-8 text-lg font-black text-slate-900 text-center tracking-tighter italic">
                    {item.current_stock} 
                    <span className="text-[9px] text-slate-300 font-black ml-2 uppercase tracking-widest not-italic">{item.unit || 'uds'}</span>
                  </td>
                  <td className="hidden md:table-cell py-8">
                    <span className={`text-[8px] font-black px-5 py-2.5 rounded-xl uppercase tracking-[0.2em] shadow-sm \${item.current_stock <= item.min_stock_alert ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20 shadow-rose-100' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-emerald-100'}`}>
                      {item.current_stock <= item.min_stock_alert ? 'REPLENISH' : 'MAX_FLOW'}
                    </span>
                  </td>
                  <td className="py-8 text-right">
                    <button className="w-12 h-12 flex ml-auto items-center justify-center bg-white border border-slate-100 text-slate-400 rounded-2xl hover:border-primary hover:text-primary hover:shadow-lg transition-all">
                      <Settings2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-32 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-24 h-24 bg-[#f8fafc] flex items-center justify-center rounded-[32px] text-slate-200 mb-10 shadow-inner">
                      <Boxes size={48} strokeWidth={1} />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.5em] mb-6">Inventory_Void</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose mb-12">
                      Zero operational assets detected in this node. Initialize logistics to establish control.
                    </p>
                    <button className="btn-loop px-12">Initialize_Protocol</button>
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
