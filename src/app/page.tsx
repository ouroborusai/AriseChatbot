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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#22c55e]/30 selection:text-white relative overflow-x-hidden">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND WITH MESH GRADIENT - ASLAS STYLE */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         {/* BASE SOLID GRADIENT */}
         <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100" />
         
         {/* ASLAS STYLE MESH - SOFT GREEN & DARK BLUR */}
         <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#22c55e]/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#0f172a]/5 blur-[120px] rounded-full" />
         
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
            <div className="w-10 h-10 relative transition-all duration-500 group-hover:scale-110">
              <div className="absolute inset-0 bg-[#22c55e]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-full h-full rounded-xl shadow-2xl border border-white/10 overflow-hidden z-10">
                <Image 
                  src="/brand/official.png" 
                  alt="LOOP Logo" 
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter leading-none text-slate-900 uppercase">LOOP</span>
              <span className="text-[7px] font-black text-[#22c55e] uppercase tracking-[0.4em] mt-1">Business Intelligence</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-10 font-black text-slate-900 uppercase tracking-[0.3em] text-[8px]">
            <a href="#data" className="hover:text-[#22c55e] transition-colors">Neural Core</a>
            <a href="#security" className="hover:text-[#22c55e] transition-colors">Seguridad</a>
            <a href="#pricing" className="hover:text-[#22c55e] transition-colors">Planes</a>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="hidden sm:block font-black text-slate-900 hover:text-[#22c55e] text-[9px] uppercase tracking-[0.3em] transition">Ingresar</Link>
            <Link href="/auth/login?tab=register" className="bg-[#0f172a] text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-[#22c55e] transition-all shadow-xl active:scale-95">
              Regístrate
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-48 pb-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-24">
          <div className="lg:w-7/12 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 py-1.5 px-5 rounded-full bg-white border border-slate-100 text-[#22c55e] text-[8px] font-black mb-10 uppercase tracking-[0.3em] animate-in fade-in slide-in-from-top-4 duration-700 shadow-sm">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
              Neural Engine v2.5 Operativo
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-[0.95] mb-8 tracking-tighter text-[#1a1a1a] animate-in fade-in slide-in-from-left-8 duration-1000">
              Conversations <br />
              <span className="text-[#22c55e] drop-shadow-sm">
                Made Smarter.
              </span>
            </h1>
            <p className="text-lg text-slate-600 mb-14 leading-relaxed max-w-xl mx-auto lg:mx-0 font-bold animate-in fade-in slide-in-from-left-12 duration-1000">
              Sincroniza tus documentos con el cerebro de <span className="text-[#0f172a] font-black">LOOP</span> y accede a toda tu gestión empresarial desde WhatsApp. El futuro de la IA de negocios.
            </p>
      <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Link href="/auth/login?tab=register" className="flex items-center justify-center gap-4 bg-[#22c55e] text-white px-8 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.4em] shadow-lg hover:bg-[#0f172a] transition-all active:scale-95 group">
          Regístrate <Layout size={16} className="group-hover:rotate-12 transition-transform" />
        </Link>
        <button className="bg-white border-2 border-[#0f172a] px-8 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 text-[#0f172a] shadow-sm active:scale-95">
          Ver Video Demo <PlayCircle size={16} />
        </button>
      </div>
          </div>

          <div className="lg:w-5/12 animate-in fade-in slide-in-from-right-12 duration-1000">
            <div className="relative">
              <div className="absolute -inset-10 bg-[#22c55e]/5 blur-[100px] rounded-full animate-pulse" />
              <div className="relative bg-white rounded-3xl border border-slate-100 shadow-[0_40px_80px_-20px_rgba(15,23,42,0.1)] overflow-hidden">
                  <div className="bg-[#f8fafc] p-6 border-b border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm relative overflow-hidden p-0">
                      <Image src="/brand/official.png" alt="Logo" fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#0f172a]">LOOP Neural Core</p>
                      <p className="text-[10px] text-[#22c55e] font-black tracking-widest uppercase animate-pulse">Online</p>
                    </div>
                  </div>
                  {/* CHAT BACKGROUND - WHATSAPP BONE */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-white relative min-h-[400px]">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                       {/* ASLAS LINE PATTERN */}
                       <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#22c55e 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />
                    </div>
                    <div className="flex justify-end relative z-10">
                      <div className="bg-[#22c55e] text-white p-3 text-xs max-w-[85%] rounded-2xl rounded-tr-none shadow-sm font-bold">
                        ¿Qué facturas vencen hoy?
                        <p className="text-[7px] text-white/60 text-right mt-1 font-black">22:15 ✓✓</p>
                      </div>
                    </div>
                    <div className="flex justify-start relative z-10">
                      <div className="bg-slate-50 p-3 text-xs text-slate-800 max-w-[85%] rounded-2xl rounded-tl-none border-l-4 border-[#0f172a] shadow-sm font-bold">
                        <p className="text-[#0f172a] font-black text-[8px] mb-1 tracking-widest uppercase">Respuesta Neural</p>
                        He identificado 3 facturas: <br />
                        1. **Insumos v3** ($1.2M) <br />
                        2. **Servicios IT** ($450K) <br />
                        3. **Logística** ($800K)
                        <p className="text-[9px] text-slate-400 text-right mt-1 font-bold">22:16</p>
                      </div>
                    </div>
                  </div>
                  {/* INPUT AREA */}
                  <div className="p-4 bg-slate-50 flex items-center gap-3">
                    <div className="flex-1 bg-white rounded-full px-5 py-2 text-slate-400 text-xs font-bold border border-slate-200 shadow-inner">Escribe un comando...</div>
                    <div className="w-10 h-10 bg-[#0f172a] rounded-full flex items-center justify-center text-white shadow-lg">
                      <Send size={18} />
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DATA ARCHITECTURE SECTION */}
      <section className="py-32 bg-[#f8fafc] relative overflow-hidden" id="data">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-24">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <DataCard icon={FileText} title="Documentos" desc="Análisis de PDFs." color="text-[#22c55e]" />
                <DataCard icon={Database} title="Data Sets" desc="Excel y SQL." color="text-[#0f172a]" delay="lg:mt-4" />
                <DataCard icon={ClipboardList} title="Reportes" desc="Minutas y notas." color="text-[#1a1a1a]" delay="lg:-mt-2" />
                <DataCard icon={ImageIcon} title="Visión" desc="OCR Inteligente." color="text-[#22c55e]" delay="lg:mt-2" />
              </div>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2">
              <h2 className="text-4xl md:text-6xl font-black leading-[0.95] mb-10 tracking-tighter text-[#1a1a1a]">
                Tú cargas el cerebro, <br /><span className="text-[#22c55e]">nosotros la memoria.</span>
              </h2>
              <p className="text-lg text-slate-600 mb-12 leading-relaxed font-bold">
                Nuestra arquitectura neural centraliza el conocimiento de tu empresa. Arrastra tus archivos y el **LOOP Engine** los convierte en respuestas procesables en tiempo real.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-6 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:border-[#22c55e]/30 transition-all group">
                   <div className="w-14 h-14 bg-[#22c55e]/10 rounded-2xl flex items-center justify-center border border-[#22c55e]/20 group-hover:scale-110 transition-transform">
                      <Cpu size={24} className="text-[#22c55e]" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[#0f172a] font-black uppercase tracking-widest text-[10px]">Inteligencia que escala</span>
                      <span className="font-bold text-xs text-slate-400 uppercase tracking-[0.2em] mt-1">Procesamiento Neural v2.5</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="loop-card p-12 relative overflow-hidden border border-slate-100 rounded-3xl shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/5 via-white/5 to-transparent opacity-50" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-[#1a1a1a] mb-6 tracking-tighter">
                Entra en el <span className="text-[#22c55e]">Loop.</span>
              </h2>
              <p className="text-slate-500 text-lg mb-12 max-w-xl mx-auto font-bold">
                Únete a la nueva era de la inteligencia empresarial operativa.
              </p>
              <div className="max-w-md mx-auto bg-white p-2 rounded-[24px] border border-slate-200 flex flex-col sm:flex-row gap-2 shadow-sm focus-within:border-[#22c55e]/30 transition-colors">
                <input 
                  type="email" 
                  placeholder="tu@empresa.com" 
                  className="flex-1 bg-transparent px-6 py-3 rounded-2xl text-slate-900 focus:outline-none font-bold text-xs"
                />
                <button className="bg-[#0f172a] text-white px-8 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-[#22c55e] transition-all shadow-lg active:scale-95">
                  Regístrate
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start">
             <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">LOOP</span>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 italic">Autonomous Business OS</p>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="hidden lg:flex items-center space-x-8 font-black text-slate-400 uppercase tracking-[0.3em] text-[8px]">
              <a href="#" className="hover:text-[#22c55e] transition-colors">Legal</a>
              <a href="#" className="hover:text-[#22c55e] transition-colors">Privacidad</a>
              <a href="#" className="hover:text-[#22c55e] transition-colors">API</a>
            </div>

            <div className="flex items-center gap-6 bg-white px-8 py-4 rounded-full border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">Sistemas Operativos</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-200"></div>
              <div className="flex items-center gap-4 text-slate-400">
                <Shield size={16} />
                <Zap size={16} />
                <Sparkles size={16} />
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
    <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-[#22c55e]/30 transform hover:-translate-y-1 transition-all duration-700 group ${delay}`}>
      <div className={`w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#22c55e]/10 transition-colors`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <h4 className="font-black text-sm uppercase mb-2 tracking-tight text-[#1a1a1a]">{title}</h4>
      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{desc}</p>
    </div>
  );
}
