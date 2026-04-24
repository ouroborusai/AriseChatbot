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
    { title: 'Sincronización Neural', desc: 'Actualizar con Warehouse', icon: RefreshCw, color: 'text-blue-500' },
    { title: 'Generar Reporte PDF', desc: 'Estado de stock actual', icon: FileDown, color: 'text-emerald-500' },
    { title: 'Auditoría de Nodo', desc: 'Validar integridad física', icon: ShieldCheck, color: 'text-green-500' },
    { title: 'Métrica de Consumo', desc: 'Análisis predictivo IA', icon: BarChart3, color: 'text-indigo-500' },
  ];

  return (
    <div className="loop-card p-10 bg-slate-900/40 border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full" />
      
      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white italic mb-12 flex items-center justify-between">
        <span>Comandos Rápidos</span>
        <Zap size={14} className="text-green-500 animate-pulse" />
      </h3>

      <div className="space-y-6">
        {actions.map((action, i) => (
          <button 
            key={i} 
            className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-green-500/20 transition-all group/item shadow-xl"
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center transition-all group-hover/item:scale-110">
                <action.icon size={18} className={action.color} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-white uppercase tracking-tight group-hover/item:text-green-500 transition-colors">
                  {action.title}
                </p>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">
                  {action.desc}
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-800 group-hover/item:text-white group-hover/item:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      <div className="mt-12 p-8 bg-green-500/5 border border-green-500/10 rounded-[32px] relative overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
           <Database size={16} className="text-green-500" />
           <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Base de Datos Conectada</span>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
           Todos los cambios se sincronizan en tiempo real con el clúster regional de Supabase.
        </p>
      </div>
    </div>
  );
}
