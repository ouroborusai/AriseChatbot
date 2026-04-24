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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-green-500/30 selection:text-white relative overflow-x-hidden">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND WITH MESH GRADIENT - LUMINOUS VIBRANT (MATCH LOGIN) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         {/* BASE SOLID GRADIENT */}
         <div className="absolute inset-0 bg-gradient-to-br from-[#80cbc4] via-[#4db6ac] to-[#b2dfdb]" />
         
         <Image 
          src="/brand/backgrounds/vibrant-mesh.png" 
          alt="Luminous Mesh Texture" 
          fill
          priority
          className="object-cover opacity-100 scale-105 blur-[120px]" 
         />
         
         <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40" />

         <Image 
          src="/brand/auth-bg.png" 
          alt="Grain Texture" 
          fill
          className="object-cover opacity-10 mix-blend-overlay fixed" 
         />
      </div>
      
      {/* NAVEGACIÓN GLASSMORPISM CLARO */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-2xl border-b border-slate-100 py-4 shadow-2xl' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-12 h-12 relative transition-all duration-500 group-hover:scale-110">
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-full h-full rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-10">
                <Image 
                  src="/brand/official.png" 
                  alt="LOOP Logo" 
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter leading-none italic text-slate-900">LOOP</span>
              <span className="text-[8px] font-black text-green-600 uppercase tracking-[0.4em] mt-1">Inteligencia de Negocios</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-10 font-black text-slate-900 uppercase tracking-[0.3em] text-[9px] italic">
            <a href="#data" className="hover:text-green-600 transition-colors">Neural Core</a>
            <a href="#security" className="hover:text-green-600 transition-colors">Seguridad</a>
            <a href="#pricing" className="hover:text-green-600 transition-colors">Planes</a>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="hidden sm:block font-black text-slate-900 hover:text-green-600 text-[10px] uppercase tracking-[0.3em] transition italic">Acceso Nodo</Link>
            <Link href="/auth/login?tab=register" className="bg-slate-900 text-white px-7 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#25D366] transition-all shadow-2xl active:scale-95 italic">
              Comenzar
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-56 pb-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-24">
          <div className="lg:w-7/12 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 py-1.5 px-5 rounded-full bg-white/60 backdrop-blur-md border border-white text-[#25D366] text-[9px] font-black mb-10 uppercase tracking-[0.3em] animate-in fade-in slide-in-from-top-4 duration-700 shadow-sm">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#25D366] shadow-[0_0_10px_#25D366] animate-pulse"></span>
              Neural Engine v2.5 Operativo
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-10 tracking-tighter text-slate-900 italic animate-in fade-in slide-in-from-left-8 duration-1000">
              Tus datos, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] via-[#128C7E] to-[#25D366] drop-shadow-[0_10px_20px_rgba(37,211,102,0.1)]">
                en un mensaje.
              </span>
            </h1>
            <p className="text-xl text-slate-900 mb-14 leading-relaxed max-w-xl mx-auto lg:mx-0 font-bold animate-in fade-in slide-in-from-left-12 duration-1000">
              Sincroniza tus documentos con el cerebro de <span className="text-slate-900 font-black">LOOP</span> y accede a toda tu gestión empresarial desde WhatsApp. El futuro de la IA de negocios.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <button className="flex items-center justify-center gap-6 bg-gradient-to-br from-[#25D366] to-[#00A884] text-white px-10 py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_20px_40px_-10px_rgba(37,211,102,0.3)] hover:scale-105 transition-all active:scale-95 group italic">
                Consola Central <Layout size={18} className="group-hover:rotate-12 transition-transform" />
              </button>
              <button className="bg-white/60 backdrop-blur-md border border-white px-10 py-5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/80 transition-all flex items-center justify-center gap-4 text-slate-900 shadow-sm active:scale-95 italic">
                Ver Video Demo <PlayCircle size={18} className="text-[#25D366]" />
              </button>
            </div>
          </div>

          {/* WHATSAPP MOCKUP */}
            <div className="relative mx-auto w-[320px] sm:w-[350px] animate-bounce-slow">
              {/* IPHONE CASE - LIGHT THEME WITH BETTER SHADOW */}
              <div className="bg-white rounded-[3.5rem] p-3 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 relative z-10">
                <div className="bg-white rounded-[3rem] overflow-hidden h-[600px] flex flex-col relative border border-slate-100">
                  {/* WHATSAPP LIGHT HEADER */}
                  <div className="bg-[#f0f2f5] p-5 pt-12 flex items-center gap-3 text-slate-900 border-b border-slate-200">
                    <ArrowLeft size={18} className="text-slate-500" />
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 p-0 overflow-hidden relative">
                      <Image src="/brand/official.png" alt="Logo" fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">LOOP Neural Core</p>
                      <p className="text-[10px] text-[#25D366] font-black tracking-widest uppercase animate-pulse">Online</p>
                    </div>
                  </div>
                  {/* CHAT BACKGROUND - WHATSAPP BONE */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#efeae2] relative">
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                       <Image src="/brand/backgrounds/doodle.png" alt="Doodle" fill className="object-cover grayscale" />
                    </div>
                    <div className="flex justify-end relative z-10">
                      <div className="bg-[#d9fdd3] p-3 text-[13px] text-slate-800 max-w-[85%] rounded-l-xl rounded-tr-xl shadow-sm">
                        ¿Qué facturas vencen hoy?
                        <p className="text-[9px] text-slate-400 text-right mt-1 font-bold">22:15 ✓✓</p>
                      </div>
                    </div>
                    <div className="flex justify-start relative z-10">
                      <div className="bg-white p-3 text-[13px] text-slate-800 max-w-[85%] rounded-r-xl rounded-tl-xl border-l-4 border-[#25D366] shadow-sm">
                        <p className="text-[#25D366] font-black text-[9px] mb-1 tracking-widest uppercase">Respuesta Neural</p>
                        He identificado 3 facturas: <br />
                        1. **Insumos v3** ($1.2M) <br />
                        2. **Servicios IT** ($450K) <br />
                        3. **Logística** ($800K)
                        <p className="text-[9px] text-slate-400 text-right mt-1 font-bold">22:16</p>
                      </div>
                    </div>
                  </div>
                  {/* INPUT AREA */}
                  <div className="p-4 bg-[#f0f2f5] flex items-center gap-3">
                    <div className="flex-1 bg-white rounded-full px-5 py-2 text-slate-400 text-xs font-bold border border-slate-200">Escribe un comando...</div>
                    <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-lg">
                      <Send size={18} />
                    </div>
                  </div>
                  </div>
                </div>
              </div>
          </div>
      </section>

      {/* DATA ENGINE SECTION - LUMINOUS VIBRANT */}
      <section id="data" className="py-40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-24">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-6">
                <DataCard icon={FileText} title="Documentos" desc="Análisis de PDFs." color="text-[#25D366]" />
                <DataCard icon={Database} title="Data Sets" desc="Excel y SQL." color="text-[#128C7E]" delay="lg:mt-8" />
                <DataCard icon={ClipboardList} title="Reportes" desc="Minutas y notas." color="text-[#075E54]" delay="lg:-mt-4" />
                <DataCard icon={ImageIcon} title="Visión" desc="OCR Inteligente." color="text-[#25D366]" delay="lg:mt-4" />
              </div>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2">
              <h2 className="text-5xl md:text-7xl font-black leading-[0.95] mb-10 tracking-tighter italic text-slate-900">
                Tú cargas el cerebro, <br /><span className="text-[#25D366]">nosotros la memoria.</span>
              </h2>
              <p className="text-xl text-slate-900 mb-12 leading-relaxed font-bold">
                Nuestra arquitectura neural centraliza el conocimiento de tu empresa. Arrastra tus archivos y el **LOOP Engine** los convierte en respuestas procesables en tiempo real.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[28px] border border-slate-100 hover:border-[#25D366]/20 transition-all group shadow-sm">
                   <div className="w-14 h-14 bg-[#25D366]/10 rounded-2xl flex items-center justify-center border border-[#25D366]/20 group-hover:scale-110 transition-transform">
                      <Cpu size={24} className="text-[#25D366]" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[#25D366]">Inteligencia</span> que escala.
                      <span className="font-black text-sm uppercase tracking-widest italic text-slate-900">Procesamiento Neural v2.5</span>
                      <span className="text-[10px] text-[#667781] font-bold uppercase tracking-widest mt-1">Latencia Ultrabaja</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION - LUMINOUS VIBRANT (CONSISTENT) */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto text-center">
          <div className="bg-white/60 backdrop-blur-3xl rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] border border-white">
            <div className="absolute inset-0 bg-gradient-to-br from-[#25D366]/10 via-white/5 to-transparent opacity-50" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter italic">
                Entra en el <span className="text-[#25D366]">Loop.</span>
              </h2>
              <p className="text-slate-900 text-lg mb-12 max-w-xl mx-auto font-bold">
                Únete a la nueva era de la inteligencia empresarial operativa.
              </p>
              <div className="max-w-md mx-auto bg-white/40 backdrop-blur-xl p-2 rounded-[2rem] border border-white flex flex-col sm:flex-row gap-2 shadow-sm">
                <input 
                  type="email" 
                  placeholder="tu@empresa.com" 
                  className="flex-1 bg-transparent px-6 py-3 rounded-2xl text-slate-900 focus:outline-none font-bold text-xs"
                />
                <button className="bg-slate-900 text-white px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#25D366] transition-all shadow-xl active:scale-95 italic">
                  Empezar
                </button>
              </div>
              <p className="text-slate-900 text-[9px] font-black uppercase tracking-[0.4em] leading-loose italic mt-10 opacity-40">
                Protocolo de Seguridad AES-256 Certificado
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-24 border-t border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                  <Image src="/brand/official.png" alt="LOOP" fill className="object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tighter text-slate-900 italic">LOOP</span>
                  <span className="text-[7px] font-black text-[#25D366] uppercase tracking-[0.4em]">Engine v2.5 Neural</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-900/60 uppercase tracking-[0.2em] mt-2">
                © 2026 SISTEMAS LOOP · OPERATIVA NEURAL AVANZADA
              </p>
            </div>

            <div className="flex items-center gap-12 text-[9px] font-black uppercase tracking-[0.3em] text-slate-900 italic">
              <a href="#" className="hover:text-[#25D366] transition-colors">Seguridad</a>
              <a href="#" className="hover:text-[#25D366] transition-colors">Privacidad</a>
              <a href="#" className="hover:text-[#25D366] transition-colors">Soporte</a>
              <a href="#" className="hover:text-[#25D366] transition-colors">API</a>
            </div>

            <div className="flex items-center gap-6 bg-white/40 backdrop-blur-md px-6 py-3 rounded-full border border-white shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse shadow-[0_0_8px_#25D366]"></div>
                <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Sistemas OK</span>
              </div>
              <div className="h-3 w-[1px] bg-slate-900/10"></div>
              <div className="flex items-center gap-4 text-slate-900/40">
                <Shield size={14} />
                <Zap size={14} />
                <Sparkles size={14} />
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
    <div className={`bg-white/60 backdrop-blur-xl p-8 rounded-[32px] border border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-[#25D366]/30 transform hover:-translate-y-3 transition-all duration-700 group ${delay}`}>
      <div className={`w-14 h-14 bg-[#25D366]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-7 h-7 ${color}`} />
      </div>
      <h4 className="font-black text-base uppercase mb-2 italic tracking-tighter text-slate-900">{title}</h4>
      <p className="text-[10px] text-slate-900 font-bold uppercase tracking-widest leading-relaxed">{desc}</p>
    </div>
  );
}
