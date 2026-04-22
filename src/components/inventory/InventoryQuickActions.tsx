import React from 'react';
import { Zap, Activity } from 'lucide-react';

export function InventoryQuickActions() {
  return (
    <div className="loop-card bg-[#0b1326] p-10 flex flex-col rounded-[48px] shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32" />
      <div className="relative z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-10">Intake_Quick_Action</h3>
        
        <div className="space-y-10">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4">Quantity_Pulse</label>
            <div className="grid grid-cols-2 gap-4">
              {[6, 12, 24, 48].map(n => (
                <button key={n} className="py-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10 text-white text-lg font-black italic transition-all group active:scale-95">
                  +{n} <span className="text-[8px] text-white/30 not-italic ml-1 font-bold group-hover:text-primary transition-colors">UDS</span>
                </button>
              ))}
            </div>
          </div>

          {/* SCANNER TRIGGER */}
          <div className="flex flex-col gap-4 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 relative overflow-hidden group">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                   <Zap size={16} />
                </div>
                <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">Neural Scanner v1.0</span>
             </div>
             <p className="text-[10px] font-bold text-emerald-700/70 leading-relaxed">
               Carga una factura o foto para procesar stock automáticamente vía IA.
             </p>
             <input type="file" className="hidden" id="scanner-input" />
             <button onClick={() => document.getElementById('scanner-input')?.click()} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-200 active:scale-95">
               Escanear Factura
             </button>
             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>

          <div className="pt-6 border-t border-white/5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4">Manual_Sequence</label>
            <div className="flex gap-4">
               <input type="number" placeholder="000" className="w-full bg-white/5 border-none rounded-2xl p-5 text-white font-black italic text-xl outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
               <button className="btn-loop px-10">Exec</button>
            </div>
          </div>
        </div>

        <div className="mt-16 p-6 rounded-[32px] bg-primary/10 border border-primary/20 backdrop-blur-xl">
           <div className="flex items-center gap-4 text-primary">
              <Activity size={16} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">Neural_Ready</span>
           </div>
           <p className="text-white/40 text-[9px] font-bold mt-4 leading-relaxed uppercase tracking-widest">Select an item and quantity to commit a real-time Kardex entry.</p>
        </div>
      </div>
    </div>
  );
}
