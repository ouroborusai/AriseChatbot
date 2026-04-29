'use client';

import React from 'react';
import { 
  Zap, 
  FileDown, 
  RefreshCw, 
  BarChart3, 
  Settings, 
  ShieldCheck,
  ChevronRight,
  Database
} from 'lucide-react';

export function InventoryQuickActions() {
  const actions = [
    { title: 'Sincronización Neural', desc: 'SINC_WAREHOUSE_SYNC', icon: RefreshCw, color: 'text-primary' },
    { title: 'Generar Reporte PDF', desc: 'DOC_ASSET_STATUS', icon: FileDown, color: 'text-accent' },
    { title: 'Auditoría de Nodo', desc: 'PHYSICAL_INTEGRITY', icon: ShieldCheck, color: 'text-primary' },
    { title: 'Métrica de Consumo', desc: 'PREDICTIVE_AI_ANALYTICS', icon: BarChart3, color: 'text-neural-dark' },
  ];

  return (
    <div className="bg-white p-12 border border-slate-100 relative overflow-hidden group rounded-xl shadow-2xl animate-in fade-in slide-in-from-right-8 duration-1000">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] rounded-full -z-10 group-hover:bg-primary/10 transition-colors duration-1000" />
      
      <h3 className="text-[14px] font-black uppercase tracking-tighter text-neural-dark mb-12 flex items-center justify-between italic">
        <span>Comandos_Rápidos.</span>
        <Zap size={18} className="text-primary animate-pulse" />
      </h3>

      <div className="space-y-6">
        {actions.map((action, i) => (
          <button 
            key={i} 
            className="w-full flex items-center justify-between p-8 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-white hover:border-primary/30 transition-all duration-500 group/item shadow-sm hover:shadow-xl active:scale-[0.98] italic"
          >
            <div className="flex items-center gap-8">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center transition-all duration-700 group-hover/item:scale-110 shadow-inner border border-slate-50">
                <action.icon size={22} className={action.color} />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-black text-neural-dark uppercase tracking-tight group-hover/item:text-primary transition-colors duration-500">
                  {action.title}
                </p>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1.5 opacity-60">
                  {action.desc}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-200 group-hover/item:text-primary group-hover/item:translate-x-2 transition-all duration-500" />
          </button>
        ))}
      </div>

      <div className="mt-16 p-10 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden italic shadow-inner">
        <div className="flex items-center gap-6 mb-5">
           <Database size={20} className="text-primary animate-pulse" />
           <span className="text-[11px] font-black text-neural-dark uppercase tracking-[0.3em]">DATABASE_UP_PLATINUM</span>
        </div>
        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] leading-relaxed opacity-60">
           Todos los cambios se sincronizan en tiempo real con el clúster regional de Supabase.
        </p>
      </div>
    </div>
  );
}
