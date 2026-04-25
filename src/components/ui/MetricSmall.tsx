import React from 'react';
import { LucideIcon, ArrowUpRight, Activity } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// METRIC SMALL v10.0 - DIAMOND INDUSTRIAL
// Componente de telemetría atómica de alta fidelidad
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
    <div className={`loop-card p-10 bg-slate-50 border-none animate-pulse h-40 ${className} relative overflow-hidden`}>
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/50 to-transparent animate-shimmer" />
    </div>
  );
  
  const bgClass = active
    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl shadow-green-500/20 border-transparent'
    : warning
      ? 'bg-red-50 text-red-500 border-red-100 shadow-[0_0_40px_rgba(239,68,68,0.05)]'
      : 'bg-white text-slate-900 hover:scale-[1.02] border border-slate-100 shadow-xl';

  const titleClass = active ? 'text-white/80' : 'text-slate-500';
  const iconBgClass = active
    ? 'bg-white/20 text-white shadow-lg'
    : warning
      ? 'bg-red-100 text-red-500'
      : 'bg-slate-50 text-slate-400 group-hover:text-green-500 group-hover:bg-green-50/50 group-hover:border-green-500/20 border border-slate-100 shadow-sm';

  return (
    <div className={`loop-card p-8 transition-all duration-700 group relative overflow-hidden ${bgClass} ${className} rounded-[32px] md:rounded-[48px]`}>
      {/* GLOW EFFECT */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full transition-all duration-1000 ${active ? 'bg-slate-900/10' : (warning ? 'bg-red-500/10' : 'bg-green-500/10 opacity-0 group-hover:opacity-100 scale-150')}`} />
      
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="space-y-3">
          <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${titleClass} italic`}>{title}</p>
          {drift && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${active ? 'bg-slate-900/10 border-slate-900/20 text-slate-900' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
              <ArrowUpRight size={10} />
              {drift}
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-500 shadow-2xl border ${iconBgClass} group-hover:scale-110`}>
          <Icon size={24} className="transition-transform duration-500" />
        </div>
      </div>
      
      <div className="flex items-end justify-between relative z-10">
         <h3 className="text-3xl md:text-5xl font-black tracking-tighter leading-none italic uppercase">{value}</h3>
         <div className="pb-1 opacity-20">
            <Activity size={16} className={active ? 'text-slate-900' : 'text-green-500'} />
         </div>
      </div>
      
      {/* TECHNICAL INDICATOR */}
      <div className={`absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-transparent via-transparent to-transparent ${active ? 'group-hover:via-slate-900/30' : 'group-hover:via-green-500/30'} transition-all duration-1000`} />
    </div>
  );
}
