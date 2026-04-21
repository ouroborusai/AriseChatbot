'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, Activity, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-sans selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Structural Minimal Grid */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      {/* Atmospheric Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full animate-pulse" style={{ filter: 'blur(160px)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full animate-pulse" style={{ filter: 'blur(160px)', animationDelay: '3s' }} />

      <header className="relative z-10 w-full p-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_10px_30px_rgba(var(--primary-rgb),0.2)]">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <span className="text-xl font-black text-slate-900 italic uppercase tracking-widest leading-none">Arise</span>
        </div>
        <Link 
          href="/auth/login"
          className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-700 uppercase tracking-widest transition-all shadow-sm hover:shadow-md"
        >
          Acceso Node
          <ArrowRight size={14} className="text-slate-400" />
        </Link>
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto w-full mt-10 lg:mt-0">
        <div className="flex items-center gap-3 mb-8 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
           <Activity size={12} className="text-primary animate-pulse" />
           <p className="text-primary text-[9px] font-black uppercase tracking-[0.4em]">Business Engine v9.0</p>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8 uppercase italic filter drop-shadow-sm">
          El Sistema Operativo<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-[#70a1fc] filter drop-shadow-[0_10px_20px_rgba(19,91,236,0.15)]">
            Neural
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mb-14 tracking-tight leading-relaxed">
          Diseñado para MTZ Consultores. Automatización contable, consolidación RAG y agente cognitivo en tiempo real conectado a WhatsApp.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Link 
            href="/auth/login"
            className="w-full sm:w-auto h-16 px-10 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.2)] hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4 hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)]"
          >
            Iniciar Uplink
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full">
          <FeatureCard icon={Shield} title="Multi-Tenant RLS" desc="Aislamiento profundo y seguro por cluster y nodos de compañía." />
          <FeatureCard icon={Globe} title="Sincronía SII" desc="Centralización masiva de documentos tributarios sin interrupción." />
          <FeatureCard icon={Zap} title="Motor Gemini" desc="Procesamiento ultrarrápido y análisis predictivo en milisegundos." />
        </div>
      </main>

      <footer className="relative z-10 p-8 text-center mt-auto border-t border-slate-200">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">© 2026 Arise_Intelligence. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left flex flex-col items-start group">
      <div className="w-14 h-14 bg-[#f7f9fb] group-hover:bg-primary/5 rounded-2xl flex items-center justify-center mb-6 transition-colors shadow-inner">
        <Icon size={24} className="text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="text-slate-900 text-[13px] font-black uppercase tracking-widest mb-3">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
