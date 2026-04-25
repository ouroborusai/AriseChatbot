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
    <div className={`loop-card p-6 bg-slate-50 border-none animate-pulse h-28 ${className} relative overflow-hidden rounded-2xl`}>
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/50 to-transparent animate-shimmer" />
    </div>
  );
  
  const bgClass = active
    ? 'bg-slate-900 text-white border-transparent'
    : warning
      ? 'bg-rose-50 text-rose-500 border-rose-100'
      : 'bg-white text-slate-900 border-slate-100 shadow-sm hover:border-[#22c55e]/20';

  const titleClass = active ? 'text-white/60' : 'text-slate-400';
  const iconBgClass = active
    ? 'bg-white/10 text-white'
    : warning
      ? 'bg-rose-100 text-rose-500'
      : 'bg-slate-50 text-slate-300 group-hover:text-[#22c55e] group-hover:bg-[#22c55e]/5 transition-all';

  return (
    <div className={`p-5 transition-all duration-300 group relative overflow-hidden border ${bgClass} ${className} rounded-2xl`}>
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="space-y-1.5">
          <p className={`text-[8px] font-black uppercase tracking-[0.3em] ${titleClass}`}>{title}</p>
          {drift && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${active ? 'bg-white/10 border-white/10 text-white' : 'bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e]'}`}>
              <ArrowUpRight size={8} />
              {drift}
            </div>
          )}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 border border-transparent shadow-sm ${iconBgClass}`}>
          <Icon size={16} />
        </div>
      </div>
      
      <div className="flex items-end justify-between relative z-10">
         <h3 className="text-xl md:text-2xl font-black tracking-tight leading-none uppercase">{value}</h3>
         <div className="opacity-10">
            <Activity size={12} className={active ? 'text-white' : 'text-[#22c55e]'} />
         </div>
      </div>
    </div>
  );
}
