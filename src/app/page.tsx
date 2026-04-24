'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Sparkles, Shield, Bell, Layout, Heart, 
  FileText, Database, ClipboardList, Image as ImageIcon, 
  Zap, RefreshCw, PlayCircle, Send, ArrowLeft
} from 'lucide-react';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-green-100 selection:text-green-900 relative overflow-x-hidden">
      
      {/* Decoración de Fondo (Sutil) */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-green-50 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2 opacity-70"></div>
      
      {/* Navegación Glassmorphism Claro */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 shadow-sm' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer">
            {/* Logo SVG (Versión para fondo claro) */}
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-100 group-hover:rotate-6 transition-transform">
              <svg viewBox="0 0 100 100" className="w-8 h-8 fill-none stroke-white" strokeWidth="8">
                <path d="M50 75 L30 90 L35 70 C15 65 10 45 30 30 C50 15 85 45 50 75 Z" fill="white" stroke="none" />
                <path d="M35 50 Q35 40 45 40 Q55 40 50 50 Q45 60 55 60 Q65 60 65 50 Q65 40 55 40 Q45 40 50 50 Q55 60 45 60 Q35 60 35 50" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter leading-none italic text-slate-900">LOOP</span>
              <span className="text-[8px] font-black text-green-600 uppercase tracking-[0.4em] mt-1">Inteligencia de Negocios</span>
            </div>
          </div>
          
          <div className="hidden md:flex space-x-10 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
            <a href="#data" className="hover:text-green-600 transition-colors">Data_Engine</a>
            <a href="#features" className="hover:text-green-600 transition-colors">Módulos</a>
            <a href="#security" className="hover:text-green-600 transition-colors">Seguridad</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hidden sm:block font-bold text-slate-400 hover:text-slate-900 text-[10px] uppercase tracking-widest transition">Login</Link>
            <button className="bg-slate-900 text-white px-7 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 hover:scale-105 transition-all shadow-xl active:scale-95">
              Comenzar
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-7/12 text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-slate-900 text-white text-[10px] font-black mb-8 uppercase tracking-[0.2em]">
              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
              Nuevo: Neural Engine v2.5
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-[0.95] mb-8 tracking-tighter text-slate-900 italic">
              Tus datos, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-green-500 to-green-600 filter drop-shadow-[0_10px_20px_rgba(34,197,94,0.1)]">
                en un mensaje.
              </span>
            </h1>
            <p className="text-xl text-slate-500 mb-12 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              Sincroniza tus documentos con el cerebro de **LOOP** y accede a toda tu gestión empresarial desde WhatsApp. Inteligencia de negocios, en el chat de siempre.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-5">
              <button className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 group">
                Dashboard Central <Layout size={20} className="group-hover:rotate-12 transition-transform text-green-400" />
              </button>
              <button className="bg-white border-2 border-slate-100 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-green-500 transition-all flex items-center justify-center gap-3">
                Ver Demo <PlayCircle size={20} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* WhatsApp Mockup Animado (Modo Claro) */}
          <div className="lg:w-5/12 w-full">
            <div className="relative mx-auto w-[320px] sm:w-[350px] animate-bounce-slow">
              <div className="bg-slate-900 rounded-[3.5rem] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-800">
                <div className="bg-[#e5ddd5] rounded-[3rem] overflow-hidden h-[600px] flex flex-col relative">
                  {/* WhatsApp Header */}
                  <div className="bg-[#075e54] p-5 pt-12 flex items-center gap-3 text-white">
                    <ArrowLeft size={20} className="opacity-70" />
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <Zap size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">LOOP Assistant</p>
                      <p className="text-[10px] opacity-70 italic">escribiendo...</p>
                    </div>
                  </div>
                  {/* Chat Area */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto" style={{backgroundImage: "url('https://i.pinimg.com/originals/ab/ab/60/abab60f38a38575003666f2c7a38b55e.png')", backgroundSize: "cover", opacity: 0.9}}>
                    <div className="flex justify-end">
                      <div className="bg-[#dcf8c6] p-3 text-[13px] max-w-[85%] rounded-l-xl rounded-tr-xl shadow-sm">
                        ¿Cuál es el saldo de la factura #204?
                        <p className="text-[9px] text-slate-500 text-right mt-1 font-bold">19:45 ✓✓</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-start">
                      <div className="bg-white p-3 text-[13px] max-w-[85%] rounded-r-xl rounded-tl-xl border-l-4 border-green-500 shadow-sm">
                        <p className="text-green-600 font-black text-[10px] mb-1 tracking-widest uppercase">Neural System</p>
                        Factura #204 analizada. El saldo actual es de **$450.000 CLP**. Vence en 2 días.
                        <p className="text-[9px] text-slate-400 text-right mt-1">19:46</p>
                      </div>
                    </div>
                  </div>
                  {/* Input Mockup */}
                  <div className="p-3 bg-[#f0f0f0] flex items-center gap-2">
                    <div className="flex-1 bg-white rounded-full px-4 py-2 text-slate-400 text-xs italic">Escribe un comando...</div>
                    <div className="w-10 h-10 bg-[#128c7e] rounded-full flex items-center justify-center text-white shadow-md">
                      <Send size={18} />
                    </div>
                  </div>
                </div>
              </div>
              {/* Badge Flotante */}
              <div className="absolute -right-8 top-20 bg-white p-4 rounded-2xl shadow-2xl border border-slate-50 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                  <Shield size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Seguridad</p>
                  <p className="text-xs font-bold text-slate-900">AES-256 Activo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marcas (Sutil) */}
      <section className="py-12 border-y border-slate-50">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-12 opacity-30 grayscale">
              <span className="text-xl font-black italic tracking-tighter">TECHCORP</span>
              <span className="text-xl font-black italic tracking-tighter">DATAFLOW</span>
              <span className="text-xl font-black italic tracking-tighter">INVENTLY</span>
              <span className="text-xl font-black italic tracking-tighter">SMARTLOG</span>
          </div>
      </section>

      {/* Data Engine Section */}
      <section id="data" className="py-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-20">
            <div className="md:w-1/2">
              <div className="grid grid-cols-2 gap-6">
                <DataCard icon={FileText} title="PDFs" desc="Manuales y contratos." color="text-blue-500" />
                <DataCard icon={Database} title="Excel" desc="Inventarios y stock." color="text-green-500" delay="mt-8" />
                <DataCard icon={ClipboardList} title="Texto" desc="Notas y FAQs." color="text-orange-500" delay="-mt-4" />
                <DataCard icon={ImageIcon} title="OCR" desc="Escaneo de fotos." color="text-purple-500" delay="mt-4" />
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-5xl font-black leading-[0.95] mb-8 tracking-tighter italic text-slate-900">
                Tú cargas el cerebro, <br /><span className="text-green-600">nosotros la memoria.</span>
              </h2>
              <p className="text-lg text-slate-500 mb-10 leading-relaxed font-medium">
                Nuestro panel centraliza tu conocimiento. Arrastra archivos y deja que el **LOOP Engine** los procese. En segundos, estarán disponibles en tu WhatsApp.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-green-500/30 transition-all">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                    <Zap size={24} className="text-green-600" />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-widest italic text-slate-700">Procesamiento Neural Inmediato</span>
                </div>
                <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-green-500/30 transition-all">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                    <RefreshCw size={24} className="text-slate-400" />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-widest italic text-slate-400">Actualización Sincronizada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-slate-900 rounded-[4rem] p-16 md:p-24 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-green-500/5 opacity-50" />
            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter italic">
                Entra en el <span className="text-green-500">Loop.</span>
              </h2>
              <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto font-medium">
                No pierdas más tiempo buscando información. Pregúntale a LOOP y sigue con tu día.
              </p>
              <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md p-2 rounded-3xl border border-white/10 flex flex-col sm:flex-row gap-2">
                <input 
                  type="email" 
                  placeholder="tu@empresa.com" 
                  className="flex-1 bg-transparent px-6 py-4 rounded-2xl text-white focus:outline-none font-bold text-sm"
                />
                <button className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-400 transition-all active:scale-95 shadow-lg shadow-green-500/20">
                  Empezar Gratis
                </button>
              </div>
              <p className="text-slate-500 text-[9px] uppercase font-bold tracking-[0.3em] mt-8">Registro en 30 segundos · Sin tarjeta</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 border-t border-slate-50 text-center bg-slate-50/30">
        <div className="flex items-center justify-center gap-6 mb-8 opacity-20">
            <Shield size={16} />
            <Zap size={16} />
            <Sparkles size={16} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
          © 2026 LOOP_SYSTEMS. Powered by Ouroborus Neural Engine.
        </p>
      </footer>

    </div>
  );
}

function DataCard({ icon: Icon, title, desc, color, delay }: any) {
  return (
    <div className={`bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md hover:border-green-500/30 transform hover:-translate-y-2 transition-all duration-500 ${delay}`}>
      <Icon className={`w-10 h-10 ${color} mb-4`} />
      <h4 className="font-black text-sm uppercase mb-2 italic tracking-widest text-slate-900">{title}</h4>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{desc}</p>
    </div>
  );
}
