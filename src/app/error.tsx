'use client';

import { useEffect } from 'react';
import { Activity, RefreshCcw, ShieldAlert, Cpu } from 'lucide-react';
import MagicRings from '@/components/ui/MagicRings';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CRITICAL_SYSTEM_FAILURE:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-white font-sans">
      
      {/* NEURAL BACKGROUND - ERROR STATE */}
      <MagicRings 
        ringCount={15}
        opacity={0.15}
        speed={1.2}
        color="var(--primary)"
        colorTwo="#ef4444"
        noiseAmount={0.3}
      />

      <div className="z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="w-24 h-24 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-12 shadow-2xl relative group overflow-hidden">
           <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full animate-pulse" />
           <ShieldAlert size={48} className="text-red-500 relative z-10" />
        </div>
        
        <div className="relative">
          <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">Fallo de <span className="text-primary">Sistema</span></h2>
          <div className="flex items-center justify-center gap-6 mb-12">
             <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_#ef4444]" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] italic">CRITICAL_RUNTIME_EXCEPTION // v10.4 PLATINUM</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-xl border border-white/5 max-w-2xl mb-16 shadow-2xl relative overflow-hidden">
           <div className="absolute left-0 top-0 w-1 h-full bg-red-500/50" />
           <p className="text-red-400 text-[12px] font-mono uppercase tracking-widest leading-loose text-left">
             {error.message || 'Se ha detectado una inestabilidad en el núcleo neural. El protocolo de seguridad ha aislado el módulo para prevenir corrupción de datos.'}
           </p>
           {error.digest && (
             <p className="mt-6 text-slate-600 text-[9px] font-mono text-left uppercase tracking-tighter opacity-50">
               DIGEST_ID: {error.digest}
             </p>
           )}
        </div>

        <button 
          onClick={() => reset()}
          className="flex items-center gap-6 bg-white text-slate-950 px-12 py-6 rounded-sm text-[12px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-primary hover:text-white transition-all active:scale-95 group"
        >
          <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-1000" />
          <span>Reiniciar Núcleo</span>
        </button>
      </div>

      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-12 opacity-30 pointer-events-none">
         <div className="flex items-center gap-3">
            <Cpu size={16} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest">Aislamiento: Activo</span>
         </div>
         <div className="flex items-center gap-3">
            <Activity size={16} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest">Telemetría: Sincronizada</span>
         </div>
      </div>
    </div>
  );
}
