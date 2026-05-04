import React from 'react';
import { LucideIcon, ArrowUpRight, Activity } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// METRIC SMALL v12.0 - DIAMOND INDUSTRIAL
// Componente de telemetría atómica de alta fidelidad.
// ════════════════════════════════════════════════════════════════════════════

interface MetricSmallProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  active?: boolean;
  warning?: boolean;
  loading?: boolean;
  drift?: string;
  className?: string;
}

export function MetricSmall({ 
  title, 
  value, 
  icon: Icon, 
  active, 
  warning, 
  loading, 
  drift,
  className = "" 
}: MetricSmallProps) {
  if (loading) return (
    <div className={`p-10 bg-slate-50 border-none animate-pulse h-40 ${className} relative overflow-hidden rounded-xl`}>
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/20 to-transparent animate-shimmer" />
    </div>
  );
  
  const bgClass = active
    ? 'bg-accent text-white border-transparent shadow-2xl'
    : warning
      ? 'bg-rose-50 text-rose-500 border-rose-100 shadow-sm'
      : 'bg-white text-neural-dark border-slate-100 shadow-2xl hover:border-primary/30';

  const titleClass = active ? 'text-white/60' : 'text-slate-400';
  const iconBgClass = active
    ? 'bg-white/10 text-white'
    : warning
      ? 'bg-rose-100 text-rose-500'
      : 'bg-slate-50 text-slate-300 group-hover:text-primary group-hover:bg-primary/5 transition-all shadow-inner';

  return (
    <div className={`p-10 transition-all duration-700 group relative overflow-hidden border ${bgClass} ${className} rounded-xl`}>
      
      {/* DECORATIVE MESH ACCENT */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full opacity-10 transition-opacity group-hover:opacity-30 ${active ? 'bg-white' : 'bg-primary'}`} />

      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="space-y-3">
          <p className={`text-[9px] font-black uppercase tracking-[0.4em] italic ${titleClass}`}>{title}</p>
          {drift && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border italic ${active ? 'bg-white/10 border-white/10 text-white' : 'bg-primary/5 border-primary/10 text-primary'}`}>
              <ArrowUpRight size={10} className={active ? '' : 'animate-pulse'} />
              {drift}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 border border-transparent shadow-sm group-hover:scale-110 ${iconBgClass}`}>
          <Icon size={20} />
        </div>
      </div>
      
      <div className="flex items-end justify-between relative z-10">
         <h3 className="text-3xl font-black tracking-tighter leading-none uppercase italic">{value}</h3>
         <div className="opacity-10 group-hover:opacity-30 transition-opacity">
            <Activity size={16} className={`${active ? 'text-white' : 'text-primary'} animate-pulse`} />
         </div>
      </div>
    </div>
  );
}
