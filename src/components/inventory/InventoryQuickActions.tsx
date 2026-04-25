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
    <div className="bg-white p-10 border border-slate-100 relative overflow-hidden group rounded-[32px] shadow-sm">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/5 blur-3xl rounded-full" />
      
      <h3 className="text-sm font-black uppercase tracking-tighter text-slate-900 mb-12 flex items-center justify-between">
        <span>Comandos Rápidos</span>
        <Zap size={14} className="text-[#22c55e] animate-pulse" />
      </h3>

      <div className="space-y-4">
        {actions.map((action, i) => (
          <button 
            key={i} 
            className="w-full flex items-center justify-between p-6 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white hover:border-[#22c55e]/30 transition-all group/item shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center transition-all group-hover/item:scale-110 shadow-sm border border-slate-50">
                <action.icon size={18} className={action.color} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight group-hover/item:text-[#22c55e] transition-colors">
                  {action.title}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {action.desc}
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover/item:text-[#22c55e] group-hover/item:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      <div className="mt-12 p-8 bg-slate-50 border border-slate-100 rounded-[32px] relative overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
           <Database size={16} className="text-[#22c55e]" />
           <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Base de Datos Conectada</span>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
           Todos los cambios se sincronizan en tiempo real con el clúster regional de Supabase.
        </p>
      </div>
    </div>
  );
}
