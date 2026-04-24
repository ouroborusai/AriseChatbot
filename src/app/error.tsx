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
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden text-white font-sans">
      
      {/* NEURAL BACKGROUND */}
      <MagicRings 
        ringCount={12}
        opacity={0.2}
        speed={1.5}
        color="#ef4444"
        colorTwo="#7f1d1d"
        noiseAmount={0.3}
      />

      <div className="z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="w-24 h-24 bg-white/5 rounded-[40px] border border-white/5 flex items-center justify-center mb-12 shadow-2xl relative group">
           <div className="absolute inset-0 bg-red-600/30 blur-2xl rounded-full animate-pulse" />
           <ShieldAlert size={48} className="text-red-500 relative z-10" />
        </div>
        
        <div className="relative">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-6">Fallo de <span className="text-red-500">Sistema</span></h2>
          <div className="flex items-center justify-center gap-4 mb-12">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Critical_Runtime_Exception // v10.0</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[32px] border border-white/5 max-w-lg mb-16 shadow-2xl">
           <p className="text-red-400 text-[10px] font-mono uppercase tracking-widest leading-loose text-left overflow-hidden">
             {error.message || 'Se ha detectado una inestabilidad en el núcleo neural. El protocolo de seguridad ha aislado el módulo para prevenir corrupción de datos.'}
           </p>
           {error.digest && (
             <p className="mt-4 text-slate-700 text-[8px] font-mono text-left uppercase tracking-tighter">
               Digest_ID: {error.digest}
             </p>
           )}
        </div>

        <button 
          onClick={() => reset()}
          className="flex items-center gap-6 bg-white text-slate-900 px-12 py-6 rounded-[28px] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-red-500 hover:text-white transition-all active:scale-95 group"
        >
          <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
          <span>Reiniciar Núcleo</span>
        </button>
      </div>

      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-10 opacity-20 pointer-events-none">
         <div className="flex items-center gap-3">
            <Cpu size={14} />
            <span className="text-[8px] font-black uppercase tracking-widest">Aislamiento: Activo</span>
         </div>
         <div className="flex items-center gap-3">
            <Activity size={14} />
            <span className="text-[8px] font-black uppercase tracking-widest">Telemetría: Enviada</span>
         </div>
      </div>
    </div>
  );
}
