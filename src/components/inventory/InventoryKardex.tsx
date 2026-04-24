'use client';

import React from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Clock, Box } from 'lucide-react';

interface InventoryKardexProps {
  transactions: any[];
}

export function InventoryKardex({ transactions }: InventoryKardexProps) {
  return (
    <div className="loop-card p-10 bg-white/5 border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full" />
      
      <div className="flex items-center justify-between mb-12">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white italic">Registro de Movimientos</h3>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-2">Últimas 5 transacciones de nodo</p>
        </div>
        <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-green-500 transition-colors">
          <Activity size={18} />
        </div>
      </div>

      <div className="space-y-8">
        {transactions.length === 0 ? (
          <div className="py-20 text-center">
            <Clock size={32} className="mx-auto text-slate-800 mb-4 opacity-20" />
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sin registros recientes</p>
          </div>
        ) : (
          transactions.map((t, i) => (
            <div key={t.id || i} className="flex items-center justify-between group/item">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  t.type === 'IN' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {t.type === 'IN' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <p className="text-[11px] font-black text-white uppercase tracking-tight group-hover/item:text-green-500 transition-colors">
                    {t.inventory_items?.name || 'Item Desconocido'}
                  </p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">
                    {t.type === 'IN' ? 'Entrada' : 'Salida'} \u2022 {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black italic tracking-tighter ${t.type === 'IN' ? 'text-green-500' : 'text-red-500'}`}>
                  {t.type === 'IN' ? '+' : '-'}{t.quantity}
                </p>
                <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-0.5">UNIDADES</p>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="mt-12 w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] hover:bg-white/10 hover:text-white transition-all">
         Ver Historial Completo (Kardex)
      </button>
    </div>
  );
}
