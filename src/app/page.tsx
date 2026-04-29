'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, Shield, Layout, 
  FileText, Database, ClipboardList, Image as ImageIcon, 
  Zap, PlayCircle, Send, ArrowLeft, Cpu
} from 'lucide-react';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-neural-dark font-sans selection:bg-primary/30 relative overflow-x-hidden">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND WITH MESH GRADIENT - ASLAS STYLE */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         {/* BASE SOLID GRADIENT */}
         <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100" />
         
         {/* ASLAS STYLE MESH - SOFT GREEN & DARK BLUR */}
         <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-primary/10 blur-[160px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] bg-accent/5 blur-[160px] rounded-full" />
         
         <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40" />

         <Image 
          src="/brand/auth-bg.png" 
          alt="Grain Texture" 
          fill
          className="object-cover opacity-[0.03] mix-blend-overlay fixed" 
         />
      </div>
      
      {/* NAVEGACIÓN GLASSMORPISM PLATINUM */}
      <nav className={`fixed w-full z-50 transition-all duration-700 ${isScrolled ? 'bg-white/90 backdrop-blur-3xl border-b border-slate-100 py-6 shadow-2xl' : 'bg-transparent py-10'}`}>
        <div className="max-w-7xl mx-auto px-10 flex justify-between items-center">
          <div className="flex items-center gap-6 group cursor-pointer">
            <div className="w-12 h-12 relative transition-all duration-700 group-hover:scale-110">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-full h-full rounded-xl shadow-2xl border border-white/10 overflow-hidden z-10">
                <Image 
                  src="/brand/official.png" 
                  alt="LOOP Logo" 
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter leading-none text-neural-dark uppercase italic">ARISE</span>
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.6em] mt-2 italic opacity-80">BUSINESS_OS_v10.4</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-12 font-black text-neural-dark uppercase tracking-[0.4em] text-[9px] italic">
            <a href="#data" className="hover:text-primary transition-all hover:translate-y-[-1px]">Neural_Core</a>
            <a href="#security" className="hover:text-primary transition-all hover:translate-y-[-1px]">Seguridad_v10</a>
            <a href="#pricing" className="hover:text-primary transition-all hover:translate-y-[-1px]">Licenciamiento</a>
          </div>

          <div className="flex items-center gap-8">
            <Link href="/auth/login" className="hidden sm:block font-black text-neural-dark hover:text-primary text-[10px] uppercase tracking-[0.4em] transition-all italic">Consola</Link>
            <Link href="/auth/login?tab=register" className="bg-accent text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-primary transition-all shadow-2xl active:scale-95 italic">
              ACTIVAR_NODO
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - INDUSTRIAL MASTERPIECE */}
      <section className="pt-64 pb-48 px-10 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-32">
          <div className="lg:w-7/12 text-center lg:text-left">
            <div className="inline-flex items-center gap-4 py-2 px-6 rounded-full bg-white border border-slate-100 text-primary text-[10px] font-black mb-12 uppercase tracking-[0.5em] animate-in fade-in slide-in-from-top-8 duration-1000 shadow-sm italic">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              Neural_Engine_v10.4_PLATINUM_OPERATIVO
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-[0.85] mb-10 tracking-tighter text-neural-dark animate-in fade-in slide-in-from-left-12 duration-1000 uppercase italic">
              Business <br />
              <span className="text-primary drop-shadow-xl">
                Intelligence.
              </span>
            </h1>
            <p className="text-xl text-slate-500 mb-16 leading-relaxed max-w-xl mx-auto lg:mx-0 font-black animate-in fade-in slide-in-from-left-16 duration-1000 tracking-tighter">
              Centralice la soberanía de sus datos con el cerebro de <span className="text-accent">ARISE</span>. Una infraestructura neural diseñada para la alta disponibilidad empresarial.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <Link href="/auth/login?tab=register" className="flex items-center justify-center gap-6 bg-primary text-white px-12 py-5 rounded-xl text-[10px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-accent transition-all active:scale-95 group italic">
                REGISTRAR_EMPRESA <Layout size={20} className="group-hover:rotate-12 transition-transform" />
              </Link>
              <button className="bg-white border-2 border-accent px-12 py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-slate-50 transition-all flex items-center justify-center gap-4 text-accent shadow-xl active:scale-95 italic">
                PROTOCOLOS_DEMO <PlayCircle size={20} />
              </button>
            </div>
          </div>

          <div className="lg:w-5/12 animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative">
              <div className="absolute -inset-20 bg-primary/10 blur-[160px] rounded-full animate-pulse" />
              <div className="relative bg-white rounded-xl border border-slate-100 shadow-[0_60px_100px_-20px_rgba(15,23,42,0.15)] overflow-hidden">
                  <div className="bg-slate-50/80 backdrop-blur-md p-8 border-b border-slate-100 flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-xl relative overflow-hidden p-0 group">
                      <Image src="/brand/official.png" alt="Logo" fill sizes="64px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div>
                      <p className="font-black text-lg text-neural-dark tracking-tighter uppercase italic">Neural_Console</p>
                      <p className="text-[10px] text-primary font-black tracking-[0.4em] uppercase animate-pulse italic">LINK_ESTABLE</p>
                    </div>
                  </div>
                  {/* CHAT BACKGROUND - PLATINUM STYLE */}
                  <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-white relative min-h-[450px]">
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                       <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                    </div>
                    <div className="flex justify-end relative z-10">
                      <div className="bg-white border border-slate-100 text-neural-dark p-6 text-[11px] max-w-[85%] rounded-xl rounded-tr-none shadow-sm font-black tracking-tighter leading-relaxed">
                        ¿Cuál es el flujo de caja proyectado para el Nodo_SII?
                        <p className="text-[7px] text-slate-300 text-right mt-3 font-black uppercase tracking-widest italic">22:15 ✓✓</p>
                      </div>
                    </div>
                    <div className="flex justify-start relative z-10">
                      <div className="bg-accent text-white p-6 text-[11px] text-white max-w-[85%] rounded-xl rounded-tl-none border-l-4 border-primary shadow-2xl font-black italic leading-relaxed">
                        <p className="text-primary font-black text-[9px] mb-3 tracking-[0.4em] uppercase">RESPUESTA_NEURAL</p>
                        Proyección detectada: <br />
                        • Ingresos: <span className="text-primary">$45.2M</span> <br />
                        • Egresos: <span className="text-slate-400">$12.8M</span> <br />
                        • Margen: <span className="text-primary">71.6%</span>
                        <p className="text-[9px] text-white/30 text-right mt-4 font-black italic">22:16</p>
                      </div>
                    </div>
                  </div>
                  {/* INPUT AREA */}
                  <div className="p-6 bg-slate-50 flex items-center gap-4">
                    <div className="flex-1 bg-white rounded-xl px-8 py-4 text-slate-300 text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-inner italic">ESPERANDO_COMANDO_...</div>
                    <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center text-white shadow-2xl hover:bg-primary transition-all cursor-pointer">
                      <Send size={24} />
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DATA ARCHITECTURE SECTION - INDUSTRIAL GRID */}
      <section className="py-48 bg-slate-50/50 relative overflow-hidden" id="data">
        <div className="max-w-7xl mx-auto px-10 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-32">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-8">
                <DataCard icon={FileText} title="Soberanía_Docs" desc="Análisis masivo de PDFs con validación legal." color="text-primary" />
                <DataCard icon={Database} title="Data_Warehousing" desc="Centralización de hilos Excel y SQL." color="text-accent" delay="lg:mt-10" />
                <DataCard icon={ClipboardList} title="Reportes_IA" desc="Generación automática de minutas ejecutivas." color="text-neural-dark" delay="lg:-mt-4" />
                <DataCard icon={ImageIcon} title="Visión_Neural" desc="OCR de grado industrial para facturación." color="text-primary" delay="lg:mt-6" />
              </div>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2">
              <h2 className="text-5xl md:text-7xl font-black leading-[0.85] mb-12 tracking-tighter text-neural-dark uppercase italic">
                Arquitectura <br /><span className="text-primary">de Alta Fidelidad.</span>
              </h2>
              <p className="text-xl text-slate-500 mb-16 leading-relaxed font-black tracking-tighter">
                El **ARISE Engine** procesa el ADN de su empresa. Convertimos la información estática en conocimiento vivo y accionable mediante protocolos de memoria persistente.
              </p>
              <div className="space-y-8">
                <div className="flex items-center gap-8 bg-white p-10 rounded-xl border border-slate-100 shadow-xl hover:border-primary/30 transition-all group overflow-hidden relative">
                   <div className="absolute right-[-20px] top-[-20px] opacity-[0.03]">
                      <Cpu size={120} className="text-primary" />
                   </div>
                   <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform relative z-10">
                      <Cpu size={32} className="text-primary" />
                   </div>
                   <div className="flex flex-col relative z-10">
                      <span className="text-neural-dark font-black uppercase tracking-[0.3em] text-[12px] italic">Inteligencia_Soberana</span>
                      <span className="font-black text-[9px] text-slate-400 uppercase tracking-[0.4em] mt-2 opacity-60">PROCESO_NEURAL_v10.4_PLATINUM</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION - EXECUTIVE CONVERSION */}
      <section className="py-48 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-10 text-center relative z-10">
          <div className="bg-slate-50 p-16 md:p-24 relative overflow-hidden border border-slate-100 rounded-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-white/5 to-transparent opacity-50 animate-pulse" />
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-8xl font-black text-neural-dark mb-10 tracking-tighter uppercase italic">
                Entra en el <span className="text-primary">Loop.</span>
              </h2>
              <p className="text-slate-500 text-xl mb-16 max-w-xl mx-auto font-black tracking-tighter">
                Únete a la nueva era de la inteligencia empresarial operativa. Despliegue inmediato.
              </p>
              <div className="max-w-xl mx-auto bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 shadow-2xl focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                <input 
                  type="email" 
                  placeholder="CORREO_CORPORATIVO_..." 
                  className="flex-1 bg-transparent px-8 py-5 rounded-xl text-neural-dark focus:outline-none font-black text-[10px] uppercase tracking-[0.2em] italic"
                />
                <button className="bg-accent text-white px-12 py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-primary transition-all shadow-xl active:scale-95 italic">
                  REGISTRAR_NODO
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER - SYSTEM TELEMETRY */}
      <footer className="py-24 border-t border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="flex flex-col items-center md:items-start">
             <span className="text-3xl font-black tracking-tighter text-neural-dark uppercase italic">ARISE</span>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mt-4 italic opacity-60">AUTONOMOUS_BUSINESS_OS_v10.4</p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex items-center space-x-10 font-black text-slate-400 uppercase tracking-[0.4em] text-[9px] italic">
              <a href="#" className="hover:text-primary transition-all">Legal</a>
              <a href="#" className="hover:text-primary transition-all">Privacidad</a>
              <a href="#" className="hover:text-primary transition-all">Protocolos_API</a>
            </div>

            <div className="flex items-center gap-8 bg-white px-10 py-5 rounded-xl border border-slate-100 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <span className="text-[10px] font-black text-neural-dark uppercase tracking-widest italic">Estado_Nodal</span>
              </div>
              <div className="h-6 w-[1px] bg-slate-100"></div>
              <div className="flex items-center gap-6 text-slate-300">
                <Shield size={20} className="hover:text-primary transition-colors cursor-pointer" />
                <Zap size={20} className="hover:text-primary transition-colors cursor-pointer" />
                <Sparkles size={20} className="hover:text-primary transition-colors cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DataCard({ icon: Icon, title, desc, color, delay }: any) {
  return (
    <div className={`bg-white p-10 rounded-xl border border-slate-100 shadow-xl hover:border-primary/30 transform hover:-translate-y-2 transition-all duration-1000 group ${delay} relative overflow-hidden`}>
      <div className="absolute right-[-10px] top-[-10px] opacity-[0.02] group-hover:scale-125 transition-transform duration-1000">
         <Icon size={80} />
      </div>
      <div className={`w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner relative z-10`}>
        <Icon className={`w-7 h-7 ${color} group-hover:text-white`} />
      </div>
      <h4 className="font-black text-[12px] uppercase mb-4 tracking-tighter text-neural-dark italic relative z-10">{title}</h4>
      <p className="text-[10px] text-slate-400 font-black leading-relaxed uppercase tracking-widest opacity-60 relative z-10">{desc}</p>
    </div>
  );
}
