'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Bell, Layout, Heart, CreditCard, AlertCircle, Fingerprint, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#000000] flex flex-col font-sans selection:bg-[#06b6d4] selection:text-white relative overflow-hidden font-inter text-white">
      {/* High-Performance Neural Gradient - Now syncing with Pure Black */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#000000] via-[#083344]/30 to-[#000000] opacity-50" />
      <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:40px_40px]" />

      {/* Atmospheric Glows - Electric Sky Official Palette */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06b6d4]/15 rounded-full blur-[160px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0891b2]/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }} />

      <header className="relative z-20 w-full p-10 flex justify-between items-center max-w-[1600px] mx-auto">
        <div className="flex items-center gap-5 group cursor-pointer">
          <div className="w-16 h-16 relative group-hover:scale-110 transition-all duration-700">
             <img 
               src="/ourobot-logo.png" 
               alt="OUROBOT Logo" 
               className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
             />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-3xl font-black text-white italic uppercase tracking-[-0.05em] leading-none">OUROBOT</span>
            <span className="text-[9px] font-black text-[#06b6d4] uppercase tracking-[0.4em] mt-1 italic">Pure_Infinity_AI</span>
          </div>
        </div>
        <Link 
          href="/auth/login"
          className="flex items-center gap-3 px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-2xl rounded-2xl text-[11px] font-black text-white uppercase tracking-[0.4em] transition-all shadow-2xl hover:shadow-[#06b6d4]/20"
        >
          Acceso_Empresarial
          <ArrowRight size={16} className="text-[#06b6d4]" />
        </Link>
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4 max-w-[1600px] mx-auto w-full mt-12 lg:mt-16 pb-20">
        <div className="w-full flex flex-col lg:flex-row items-center lg:justify-between gap-12 lg:gap-20 mb-24">
          {/* The OUROBOT Pure Infinity Official Core (Left) */}
          <div className="relative group cursor-pointer flex-shrink-0 lg:ml-10">
            <div className="absolute inset-0 bg-[#06b6d4]/20 blur-[100px] rounded-full animate-pulse group-hover:bg-[#0891b2]/40 transition-all duration-1000" />
            
            <div className="relative w-64 h-64 md:w-[450px] md:h-[450px] flex items-center justify-center group-hover:scale-105 transition-all duration-1000">
               <img 
                 src="/ourobot-logo.png" 
                 alt="OUROBOT Official Logo" 
                 className="relative z-10 w-full h-full object-contain"
               />
            </div>
          </div>

          {/* Text Content (Right) */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left flex-1 max-w-3xl">
            {/* Badge Hero */}
            <div className="flex items-center gap-4 mb-10 bg-white/[0.02] backdrop-blur-3xl px-8 py-3 rounded-full border border-white/5 shadow-2xl group cursor-pointer hover:bg-[#06b6d4]/10 transition-all w-fit">
               <Heart size={16} className="text-[#06b6d4] fill-[#06b6d4] animate-pulse" />
               <p className="text-white text-[11px] font-black uppercase tracking-[0.7em]">Ouroborus_Neural_Infinity_v9.9</p>
            </div>
            
            <h1 className="text-5xl md:text-[85px] font-black text-white tracking-tight leading-none mb-8 uppercase italic">
              Tu Empresa en<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#22d3ee] to-[#0891b2] filter drop-shadow-[0_30px_60px_rgba(6,182,212,0.4)]">
                un Mensaje
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mb-12 tracking-normal leading-relaxed">
              Automatiza tu agenda, gestiona logística industrial y controla tu contabilidad desde WhatsApp con el poder de **OUROBOT**.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-6">
              <a 
                href="https://wa.me/56990062213?text=Hola%20OUROBOT!%20Activa%20mi%20negocio"
                className="w-full sm:w-auto h-16 md:h-20 px-10 md:px-12 bg-[#06b6d4] text-white rounded-full font-black text-[12px] md:text-[13px] uppercase tracking-[0.3em] md:tracking-[0.5em] shadow-[0_20px_50px_-10px_rgba(6,182,212,0.5)] hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4 md:gap-6 group"
              >
                Sincronizar con WhatsApp
                <ArrowRight size={24} className="group-hover:translate-x-3 transition-transform" />
              </a>
              <Link 
                href="/auth/login"
                className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-colors h-16 md:h-20 flex items-center"
              >
                Dashboard_Central
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mb-32 text-left">
          <FeatureCard 
            icon={Bell} 
            title="Auto-Respuesta IA" 
            desc="Sincronización total de citas y recordatorios mediante lenguaje natural. OUROBOT nunca olvida." 
            accent="bg-[#06b6d4]/10"
          />
          <FeatureCard 
            icon={Layout} 
            title="Logística MMC" 
            desc="Módulo especializado para talleres: reportes técnicos, actas de retiro e inventario en tiempo real." 
            accent="bg-[#0891b2]/10"
          />
          <FeatureCard 
            icon={Shield} 
            title="Bóveda Segura" 
            desc="Seguridad de grado militar para tus documentos comerciales. Tus datos están bajo control total." 
            accent="bg-white/5"
          />
        </div>

        {/* Pricing Section */}
        <section id="pricing" className="w-full max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic mb-6">Planes OUROBOT</h2>
            <div className="w-24 h-[4px] bg-[#06b6d4] mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[40px] p-10 lg:p-12 text-left hover:border-[#06b6d4]/30 transition-all duration-700">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-8">Uso Personal</h4>
              <h3 className="text-6xl font-black text-white mb-4 italic uppercase">Free</h3>
              <p className="text-slate-400 text-lg mb-12 font-medium leading-relaxed">Asistente personal inteligente para agendar tu vida diaria.</p>
              <ul className="space-y-6 mb-16">
                <PricingItem text="Agenda Neural 24/7" />
                <PricingItem text="Mensajes de Voz" />
                <PricingItem text="Caché de Datos 7 días" />
              </ul>
              <button className="w-full h-16 bg-white/5 text-white rounded-full font-black uppercase text-[11px] tracking-widest hover:bg-white hover:text-black transition-all">Empezar_Ahora</button>
            </div>

            <div className="bg-[#06b6d4] text-[#020617] rounded-[40px] p-10 lg:p-12 text-left shadow-[0_30px_60px_-15px_rgba(6,182,212,0.4)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-700">
              <div className="absolute top-0 right-0 p-10">
                <Sparkles size={48} className="text-white opacity-20 animate-pulse" />
              </div>
              <h4 className="text-[11px] font-black text-white/60 uppercase tracking-[0.5em] mb-8">Enterprise_Pro</h4>
              <div className="flex items-baseline gap-2 mb-4">
                <h3 className="text-6xl font-black italic uppercase">$49k</h3>
                <span className="text-[12px] font-black uppercase opacity-60">/ mes</span>
              </div>
              <p className="text-[#020617] text-lg mb-12 font-bold leading-relaxed text-balance italic">Poder total para Taller MMC y empresas industriales.</p>
              <ul className="space-y-6 mb-16">
                <PricingItem text="Módulo Logística Completo" isDark />
                <PricingItem text="Reportes PDF Oficiales" isDark />
                <PricingItem text="Inventario & Activos" isDark />
                <PricingItem text="Soporte Prioritario" isDark />
              </ul>
              <button className="w-full h-16 bg-[#020617] text-white rounded-full font-black uppercase text-[11px] tracking-widest shadow-2xl hover:scale-105 transition-all">Activar_Enterprise</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 p-12 text-center mt-auto border-t border-white/5 bg-white/[0.02] backdrop-blur-md">
         <div className="flex items-center justify-center gap-6 mb-8 opacity-20">
            <Shield size={16} />
            <Bell size={16} />
            <Sparkles size={16} />
         </div>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">© 2026 OUROBOT_Systems. Powered by Ouroborus AI Cluster.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, accent }: any) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-[40px] p-10 shadow-xl hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 text-left flex flex-col items-start group">
      <div className={`w-16 h-16 ${accent || 'bg-white/5'} group-hover:bg-[#06b6d4] rounded-2xl flex items-center justify-center mb-8 transition-all shadow-sm group-hover:shadow-[0_15px_35px_rgba(6,182,212,0.3)] group-hover:-rotate-6`}>
        <Icon size={28} className="text-[#06b6d4] group-hover:text-white transition-all" />
      </div>
      <h3 className="text-white text-base font-black uppercase tracking-widest mb-4 italic leading-none">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function PricingItem({ text, isDark }: { text: string, isDark?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDark ? 'bg-[#020617]/20 text-[#020617]' : 'bg-[#06b6d4]/10 text-[#06b6d4]'}`}>
        <ArrowRight size={10} />
      </div>
      <span className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-[#020617]' : 'text-slate-400'}`}>{text}</span>
    </li>
  );
}
