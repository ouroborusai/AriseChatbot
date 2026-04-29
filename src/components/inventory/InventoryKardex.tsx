'use client';

import React from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Clock, Box } from 'lucide-react';

interface InventoryKardexProps {
  transactions: any[];
}

export function InventoryKardex({ transactions }: InventoryKardexProps) {
  return (
    <div className="bg-white p-12 border border-slate-100 relative overflow-hidden group rounded-xl shadow-2xl animate-in fade-in slide-in-from-left-8 duration-1000">
      {/* DECORATIVE BACKGROUND ACCENT */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] rounded-full -z-10 group-hover:bg-primary/10 transition-colors duration-1000" />
      
      <div className="flex items-center justify-between mb-16">
        <div>
          <h3 className="text-[14px] font-black uppercase tracking-tighter text-neural-dark italic">Registro de Movimientos.</h3>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mt-3 italic opacity-60">ÚLTIMAS_5_TRANSMISIONES_DE_NODO</p>
        </div>
        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-all duration-700 shadow-inner group-hover:shadow-lg">
          <Activity size={20} className="group-hover:scale-110 transition-transform" />
        </div>
      </div>

      <div className="space-y-10">
        {transactions.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6 border border-slate-100 border-dashed">
              <Clock size={32} className="text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">SIN_REGISTROS_RECIENTES</p>
          </div>
        ) : (
          transactions.map((t, i) => (
            <div key={t.id || i} className="flex items-center justify-between group/item">
              <div className="flex items-center gap-8">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center border transition-all duration-500 shadow-sm ${
                  t.type === 'IN' 
                    ? 'bg-primary/5 border-primary/10 text-primary group-hover/item:bg-primary group-hover/item:text-white' 
                    : 'bg-rose-50 border-rose-100 text-rose-500 group-hover/item:bg-rose-500 group-hover/item:text-white'
                }`}>
                  {t.type === 'IN' ? <ArrowDownRight size={22} /> : <ArrowUpRight size={22} />}
                </div>
                <div>
                  <p className="text-[13px] font-black text-neural-dark uppercase tracking-tight group-hover/item:text-primary transition-colors duration-500 italic">
                    {t.inventory_items?.name || 'Item Desconocido'}
                  </p>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1.5 italic opacity-60">
                    {t.type === 'IN' ? 'ENTRADA' : 'SALIDA'} • {new Date(t.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }).toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-black tracking-tighter italic ${t.type === 'IN' ? 'text-primary' : 'text-rose-500'}`}>
                  {t.type === 'IN' ? '+' : '-'}{t.quantity}
                </p>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 italic opacity-60">UNIDADES</p>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="mt-16 w-full py-5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] hover:bg-neural-dark hover:text-white hover:border-transparent transition-all duration-700 shadow-sm hover:shadow-2xl italic group/btn overflow-hidden relative">
         <div className="absolute inset-0 bg-primary/10 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-700" />
         <span className="relative z-10">VER_HISTORIAL_COMPLETO_//_KARDEX</span>
      </button>
    </div>
  );
}
