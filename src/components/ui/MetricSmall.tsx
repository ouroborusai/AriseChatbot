import React from 'react';
import { LucideIcon } from 'lucide-react';

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
  if (loading) return <div className={`arise-card p-6 md:p-10 bg-white border-none shadow-arise animate-pulse h-32 md:h-40 ${className}`} />;
  
  const bgClass = active 
    ? 'bg-gradient-to-br from-[#135bec] to-[#0045bd] text-white shadow-[0_20px_40px_-5px_rgba(19,91,236,0.3)]' 
    : warning 
      ? 'bg-rose-500/10 text-rose-600 border border-rose-100 shadow-xl shadow-rose-100'
      : 'bg-white text-slate-900 hover:bg-slate-50/50 border-none shadow-arise';

  const titleClass = active ? 'text-white/70' : 'text-slate-400';
  const iconBgClass = active 
    ? 'bg-white/20 text-white' 
    : warning 
      ? 'bg-rose-500/10 text-rose-600' 
      : 'bg-[#f7f9fb] text-slate-300 group-hover:text-primary group-hover:bg-primary/5';

  return (
    <div className={`arise-card p-6 md:p-8 transition-all duration-500 group relative overflow-hidden ${bgClass} ${className}`}>
      <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
        <div className="space-y-1">
          <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] ${titleClass}`}>{title}</p>
          {drift && (
            <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {drift}
            </span>
          )}
        </div>
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${iconBgClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <h3 className="text-2xl md:text-4xl font-black tracking-tighter leading-none relative z-10 italic uppercase">{value}</h3>
      
      {/* Micro-animation detail */}
      {!active && (
        <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-primary/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-1000" />
      )}
    </div>
  );
}
