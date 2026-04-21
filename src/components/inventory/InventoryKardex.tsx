import React from 'react';
import { Activity, ArrowLeft, ArrowRight } from 'lucide-react';

interface InventoryKardexProps {
  transactions: any[];
}

export function InventoryKardex({ transactions }: InventoryKardexProps) {
  return (
    <div className="lg:col-span-2">
      <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 mb-12 px-6 flex items-center gap-4">
        <Activity size={14} className="text-primary animate-pulse" />
        Neural_Kardex_Terminal
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {transactions.map(t => (
          <div key={t.id} className="arise-card bg-white/90 p-8 flex items-center justify-between group rounded-[32px] hover:shadow-2xl transition-all">
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 \${t.type === 'in' ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'}`}>
                {t.type === 'in' ? <ArrowLeft size={20} className="-rotate-45" /> : <ArrowRight size={20} className="-rotate-45" />}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight italic truncate pr-4">{t.inventory_items?.name}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">
                  {t.type === 'in' ? 'Kardex_Input' : t.type === 'out' ? 'Kardex_Output' : 'Audit_Sync'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xl font-black italic tracking-tighter \${t.type === 'in' ? 'text-emerald-600' : 'text-rose-500'}`}>
                {t.type === 'in' ? '+' : '-'}{t.quantity}
              </p>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-3">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="col-span-full p-20 text-center bg-slate-50/30 rounded-[40px] border-2 border-dashed border-slate-100/50 backdrop-blur-sm">
             <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em]">No recent flux detected</p>
          </div>
        )}
      </div>
    </div>
  );
}
