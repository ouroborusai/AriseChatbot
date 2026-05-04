'use client';

import Link from 'next/link';
import { Activity, ArrowLeft, Cpu, ShieldAlert } from 'lucide-react';
import MagicRings from '@/components/ui/MagicRings';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-white font-sans">
      
      {/* NEURAL BACKGROUND - TOKENIZED */}
      <MagicRings 
        ringCount={12}
        opacity={0.15}
        speed={0.4}
        color="var(--primary)"
        colorTwo="var(--accent)"
        noiseAmount={0.2}
      />

      <div className="z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="w-24 h-24 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-12 shadow-2xl relative group overflow-hidden">
           <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full animate-pulse" />
           <ShieldAlert size={48} className="text-red-500 relative z-10" />
        </div>
        
        <h1 className="text-[120px] md:text-[220px] font-black tracking-tighter leading-none italic opacity-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">404</h1>
        
        <div className="relative">
          <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">Nodo <span className="text-primary">Extraviado</span></h2>
          <div className="flex items-center justify-center gap-6 mb-12">
             <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_#ef4444]" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] italic">ERROR_CODE // RECURSO_NO_MAPEADO</p>
          </div>
        </div>

        <p className="max-w-xl text-slate-400 text-[12px] font-black uppercase tracking-[0.4em] leading-loose mb-16 italic px-4 opacity-60">
          La unidad operativa solicitada no responde o ha sido desmantelada por el protocolo de seguridad ARISE. Verifique el enlace de acceso.
        </p>

        <Link 
          href="/dashboard"
          className="flex items-center gap-6 bg-primary text-white px-12 py-6 rounded-sm text-[12px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-white hover:text-slate-950 transition-all active:scale-95 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" />
          <span>Volver al Control</span>
        </Link>
      </div>

      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-12 opacity-30 pointer-events-none">
         <div className="flex items-center gap-3">
            <Cpu size={16} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest">Protocolo: Diamond_v12.0</span>
         </div>
         <div className="flex items-center gap-3">
            <Activity size={16} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest">Estado: Anomalía_Aislada</span>
         </div>
      </div>
    </div>
  );
}
