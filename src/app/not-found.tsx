'use client';

import Link from 'next/link';
import { Activity, ArrowLeft, Cpu, ShieldAlert } from 'lucide-react';
import MagicRings from '@/components/ui/MagicRings';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden text-white font-sans">
      
      {/* NEURAL BACKGROUND */}
      <MagicRings 
        ringCount={8}
        opacity={0.3}
        speed={0.5}
        color="#22c55e"
        colorTwo="#065f46"
        noiseAmount={0.2}
      />

      <div className="z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="w-24 h-24 bg-white/5 rounded-[40px] border border-white/5 flex items-center justify-center mb-12 shadow-2xl relative group">
           <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
           <ShieldAlert size={48} className="text-red-500 relative z-10" />
        </div>
        
        <h1 className="text-[120px] md:text-[180px] font-black tracking-tighter leading-none italic opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">404</h1>
        
        <div className="relative">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-6">Nodo <span className="text-red-500">Extraviado</span></h2>
          <div className="flex items-center justify-center gap-4 mb-12">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Error_404 // Recurso_No_Mapeado</p>
          </div>
        </div>

        <p className="max-w-md text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] leading-loose mb-16 italic px-4">
          La unidad operativa solicitada no responde o ha sido desmantelada por el protocolo de seguridad LOOP. Verifique el enlace e intente reconectar.
        </p>

        <Link 
          href="/dashboard"
          className="flex items-center gap-6 bg-white text-slate-900 px-12 py-6 rounded-[28px] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-green-500 hover:text-white transition-all active:scale-95 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform" />
          <span>Volver al Centro de Control</span>
        </Link>
      </div>

      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-10 opacity-20 pointer-events-none">
         <div className="flex items-center gap-3">
            <Cpu size={14} />
            <span className="text-[8px] font-black uppercase tracking-widest">Protocolo: Diamond_v10</span>
         </div>
         <div className="flex items-center gap-3">
            <Activity size={14} />
            <span className="text-[8px] font-black uppercase tracking-widest">Estado: Anomalía_Detectada</span>
         </div>
      </div>
    </div>
  );
}
