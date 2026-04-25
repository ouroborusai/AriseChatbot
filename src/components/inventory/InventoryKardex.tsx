'use client';

import React from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Clock, Box } from 'lucide-react';

interface InventoryKardexProps {
  transactions: any[];
}

export function InventoryKardex({ transactions }: InventoryKardexProps) {
  return (
    <div className="bg-white p-10 border border-slate-100 relative overflow-hidden group rounded-[32px] shadow-sm">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/5 blur-3xl rounded-full" />
      
      <div className="flex items-center justify-between mb-12">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tighter text-slate-900">Registro de Movimientos</h3>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">Últimas 5 transacciones de nodo</p>
        </div>
        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#22c55e] transition-colors shadow-sm">
          <Activity size={18} />
        </div>
      </div>

      <div className="space-y-8">
        {transactions.length === 0 ? (
          <div className="py-20 text-center">
            <Clock size={32} className="mx-auto text-slate-100 mb-4" />
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sin registros recientes</p>
          </div>
        ) : (
          transactions.map((t, i) => (
            <div key={t.id || i} className="flex items-center justify-between group/item">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shadow-sm ${
                  t.type === 'IN' 
                    ? 'bg-[#22c55e]/5 border-[#22c55e]/20 text-[#22c55e]' 
                    : 'bg-rose-50 border-rose-100 text-rose-500'
                }`}>
                  {t.type === 'IN' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight group-hover/item:text-[#22c55e] transition-colors">
                    {t.inventory_items?.name || 'Item Desconocido'}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {t.type === 'IN' ? 'Entrada' : 'Salida'} • {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black tracking-tighter ${t.type === 'IN' ? 'text-[#22c55e]' : 'text-rose-500'}`}>
                  {t.type === 'IN' ? '+' : '-'}{t.quantity}
                </p>
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">UNIDADES</p>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="mt-12 w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] hover:bg-[#22c55e] hover:text-white hover:border-transparent transition-all shadow-sm">
         Ver Historial Completo (Kardex)
      </button>
    </div>
  );
}
