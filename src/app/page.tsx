'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, Shield, Layout, 
  FileText, Database, ClipboardList, Image as ImageIcon, 
  Zap, PlayCircle, Send, Cpu
} from 'lucide-react';

/**
 * 💎 ARISE PLATINUM LANDING v10.4 (Restaurada)
 * Esta versión combina el diseño de alta fidelidad original con los 
 * requerimientos legales mandatorios para la verificación de Meta.
 */
export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0f172a] font-sans selection:bg-[#22c55e]/30 relative overflow-x-hidden">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND WITH MESH GRADIENT */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100" />
         <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#22c55e]/10 blur-[160px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] bg-[#0f172a]/5 blur-[160px] rounded-full" />
         <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40" />
      </div>
      
      {/* NAVEGACIÓN GLASSMORPISM PLATINUM */}
      <nav className={`fixed w-full z-50 transition-all duration-700 ${isScrolled ? 'bg-white/90 backdrop-blur-3xl border-b border-slate-100 py-6 shadow-2xl' : 'bg-transparent py-10'}`}>
        <div className="max-w-7xl mx-auto px-10 flex justify-between items-center">
          <div className="flex items-center gap-6 group cursor-pointer">
            <div className="w-12 h-12 relative transition-all duration-700 group-hover:scale-110">
              <div className="absolute inset-0 bg-[#22c55e]/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-full h-full rounded-xl shadow-2xl border border-white/10 overflow-hidden z-10 bg-slate-200">
                {/* Placeholder para logo si no existe el asset */}
                <div className="w-full h-full flex items-center justify-center bg-[#0f172a] text-[#22c55e] font-black italic text-xs">ARISE</div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter leading-none text-[#0f172a] uppercase italic">ARISE</span>
              <span className="text-[8px] font-black text-[#22c55e] uppercase tracking-[0.6em] mt-2 italic opacity-80">BUSINESS_OS_v12.0</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-12 font-black text-[#0f172a] uppercase tracking-[0.4em] text-[9px] italic">
            <a href="#data" className="hover:text-[#22c55e] transition-all hover:translate-y-[-1px]">Neural_Core</a>
            <a href="#security" className="hover:text-[#22c55e] transition-all hover:translate-y-[-1px]">Seguridad_v12</a>
            <a href="#legal" className="hover:text-[#22c55e] transition-all hover:translate-y-[-1px]">Verificación</a>
          </div>

          <div className="flex items-center gap-8">
            <Link href="/auth/login" className="hidden sm:block font-black text-[#0f172a] hover:text-[#22c55e] text-[10px] uppercase tracking-[0.4em] transition-all italic">Consola</Link>
            <Link href="/auth/login?tab=register" className="bg-[#0f172a] text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-[#22c55e] transition-all shadow-2xl active:scale-95 italic">
              ACTIVAR_NODO
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - INDUSTRIAL MASTERPIECE */}
      <section className="pt-64 pb-48 px-10 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-32">
          <div className="lg:w-7/12 text-center lg:text-left">
            <div className="inline-flex items-center gap-4 py-2 px-6 rounded-full bg-white border border-slate-100 text-[#22c55e] text-[10px] font-black mb-12 uppercase tracking-[0.5em] shadow-sm italic">
              <span className="flex h-2 w-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              Neural_Engine_v12.0_DIAMOND_OPERATIVO
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-[0.85] mb-10 tracking-tighter text-[#0f172a] uppercase italic">
              Business <br />
              <span className="text-[#22c55e] drop-shadow-xl">
                Intelligence.
              </span>
            </h1>
            <p className="text-xl text-slate-500 mb-16 leading-relaxed max-w-xl mx-auto lg:mx-0 font-black tracking-tighter">
              Centralice la soberanía de sus datos con el cerebro de <span className="text-[#0f172a]">ARISE</span>. Una infraestructura neural diseñada para la alta disponibilidad empresarial.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-6">
              <Link href="/auth/login?tab=register" className="flex items-center justify-center gap-6 bg-[#22c55e] text-white px-12 py-5 rounded-xl text-[10px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-[#0f172a] transition-all active:scale-95 group italic">
                REGISTRAR_EMPRESA <Layout size={20} className="group-hover:rotate-12 transition-transform" />
              </Link>
              <button className="bg-white border-2 border-[#0f172a] px-12 py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-slate-50 transition-all flex items-center justify-center gap-4 text-[#0f172a] shadow-xl active:scale-95 italic">
                PROTOCOLOS_DEMO <PlayCircle size={20} />
              </button>
            </div>
          </div>

          <div className="lg:w-5/12">
            <div className="relative">
              <div className="absolute -inset-20 bg-[#22c55e]/10 blur-[160px] rounded-full animate-pulse" />
              <div className="relative bg-white rounded-xl border border-slate-100 shadow-[0_60px_100px_-20px_rgba(15,23,42,0.15)] overflow-hidden">
                  <div className="bg-slate-50/80 backdrop-blur-md p-8 border-b border-slate-100 flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#0f172a] rounded-xl flex items-center justify-center border border-slate-100 shadow-xl relative overflow-hidden p-0">
                       <span className="text-[#22c55e] font-black italic text-xs">ARISE</span>
                    </div>
                    <div>
                      <p className="font-black text-lg text-[#0f172a] tracking-tighter uppercase italic">Neural_Console</p>
                      <p className="text-[10px] text-[#22c55e] font-black tracking-[0.4em] uppercase animate-pulse italic">LINK_ESTABLE</p>
                    </div>
                  </div>
                  {/* CHAT BACKGROUND - PLATINUM STYLE */}
                  <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-white relative min-h-[400px]">
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                       <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                    </div>
                    <div className="flex justify-end relative z-10">
                      <div className="bg-white border border-slate-100 text-[#0f172a] p-6 text-[11px] max-w-[85%] rounded-xl rounded-tr-none shadow-sm font-black tracking-tighter leading-relaxed">
                        ¿Cuál es el flujo de caja proyectado para el Nodo_SII?
                        <p className="text-[7px] text-slate-300 text-right mt-3 font-black uppercase tracking-widest italic">22:15 ✓✓</p>
                      </div>
                    </div>
                    <div className="flex justify-start relative z-10">
                      <div className="bg-[#0f172a] text-white p-6 text-[11px] max-w-[85%] rounded-xl rounded-tl-none border-l-4 border-[#22c55e] shadow-2xl font-black italic leading-relaxed">
                        <p className="text-[#22c55e] font-black text-[9px] mb-3 tracking-[0.4em] uppercase">RESPUESTA_NEURAL</p>
                        Proyección detectada: <br />
                        • Ingresos: <span className="text-[#22c55e]">$45.2M</span> <br />
                        • Egresos: <span className="text-slate-400">$12.8M</span> <br />
                        • Margen: <span className="text-[#22c55e]">71.6%</span>
                        <p className="text-[9px] text-white/30 text-right mt-4 font-black italic">22:16</p>
                      </div>
                    </div>
                  </div>
                  {/* INPUT AREA */}
                  <div className="p-6 bg-slate-50 flex items-center gap-4">
                    <div className="flex-1 bg-white rounded-xl px-8 py-4 text-slate-300 text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-inner italic">ESPERANDO_COMANDO_...</div>
                    <div className="w-14 h-14 bg-[#0f172a] rounded-xl flex items-center justify-center text-white shadow-2xl hover:bg-[#22c55e] transition-all cursor-pointer">
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
                <DataCard icon={FileText} title="Soberanía_Docs" desc="Análisis masivo de PDFs con validación legal." color="text-[#22c55e]" />
                <DataCard icon={Database} title="Data_Warehousing" desc="Centralización de hilos Excel y SQL." color="text-[#0f172a]" delay="lg:mt-10" />
                <DataCard icon={ClipboardList} title="Reportes_IA" desc="Generación automática de minutas ejecutivas." color="text-slate-600" delay="lg:-mt-4" />
                <DataCard icon={ImageIcon} title="Visión_Neural" desc="OCR de grado industrial para facturación." color="text-[#22c55e]" delay="lg:mt-6" />
              </div>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2">
              <h2 className="text-5xl md:text-7xl font-black leading-[0.85] mb-12 tracking-tighter text-[#0f172a] uppercase italic">
                Arquitectura <br /><span className="text-[#22c55e]">de Alta Fidelidad.</span>
              </h2>
              <p className="text-xl text-slate-500 mb-16 leading-relaxed font-black tracking-tighter">
                El **ARISE Engine** procesa el ADN de su empresa. Convertimos la información estática en conocimiento vivo y accionable mediante protocolos de memoria persistente.
              </p>
              <div className="space-y-8">
                <div className="flex items-center gap-8 bg-white p-10 rounded-xl border border-slate-100 shadow-xl hover:border-[#22c55e]/30 transition-all group overflow-hidden relative">
                   <div className="absolute right-[-20px] top-[-20px] opacity-[0.03]">
                      <Cpu size={120} className="text-[#22c55e]" />
                   </div>
                   <div className="w-16 h-16 bg-[#22c55e]/10 rounded-xl flex items-center justify-center border border-[#22c55e]/20 group-hover:scale-110 transition-transform relative z-10">
                      <Cpu size={32} className="text-[#22c55e]" />
                   </div>
                   <div className="flex flex-col relative z-10">
                      <span className="text-[#0f172a] font-black uppercase tracking-[0.3em] text-[12px] italic">Inteligencia_Soberana</span>
                      <span className="font-black text-[9px] text-slate-400 uppercase tracking-[0.4em] mt-2 opacity-60">PROCESO_NEURAL_v12.0_DIAMOND</span>
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
            <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/10 via-white/5 to-transparent opacity-50 animate-pulse" />
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-8xl font-black text-[#0f172a] mb-10 tracking-tighter uppercase italic">
                Entra en el <span className="text-[#22c55e]">Loop.</span>
              </h2>
              <p className="text-slate-500 text-xl mb-16 max-w-xl mx-auto font-black tracking-tighter">
                Únete a la nueva era de la inteligencia empresarial operativa. Despliegue inmediato.
              </p>
              <div className="max-w-xl mx-auto bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 shadow-2xl focus-within:ring-4 focus-within:ring-[#22c55e]/10 transition-all">
                <input 
                  type="email" 
                  placeholder="CORREO_CORPORATIVO_..." 
                  className="flex-1 bg-transparent px-8 py-5 rounded-xl text-[#0f172a] focus:outline-none font-black text-[10px] uppercase tracking-[0.2em] italic"
                />
                <button className="bg-[#0f172a] text-white px-12 py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-[#22c55e] transition-all shadow-xl active:scale-95 italic">
                  REGISTRAR_NODO
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ⚖️ FOOTER LEGAL (CRÍTICO PARA LA VERIFICACIÓN DE META) */}
      <footer id="legal" className="py-24 border-t border-slate-100 bg-slate-50/30 relative z-10">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-16">
            <div className="flex flex-col items-center md:items-start">
               <span className="text-3xl font-black tracking-tighter text-[#0f172a] uppercase italic">ARISE</span>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mt-4 italic opacity-60">AUTONOMOUS_BUSINESS_OS_v12.0</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 text-left">
              <div>
                <p className="text-[#22c55e] font-black text-[10px] uppercase tracking-widest mb-4 italic">Información Legal</p>
                <div className="text-[11px] text-slate-500 space-y-2 font-medium">
                  <p><strong>Razón Social:</strong> Tu Empresa SpA</p>
                  <p><strong>RUT:</strong> 77.XXX.XXX-X</p>
                </div>
              </div>
              <div>
                <p className="text-[#22c55e] font-black text-[10px] uppercase tracking-widest mb-4 italic">Contacto Oficial</p>
                <div className="text-[11px] text-slate-500 space-y-2 font-medium">
                  <p><strong>Email:</strong> contacto@arise.cl</p>
                  <p><strong>Teléfono:</strong> +56 9 9006 2213</p>
                </div>
              </div>
              <div>
                <p className="text-[#22c55e] font-black text-[10px] uppercase tracking-widest mb-4 italic">Protocolos</p>
                <div className="flex flex-wrap gap-4 font-black text-slate-400 uppercase tracking-[0.2em] text-[9px] italic">
                  <a href="#" className="hover:text-[#22c55e] transition-all">Privacidad</a>
                  <a href="#" className="hover:text-[#22c55e] transition-all">Términos</a>
                  <a href="#" className="hover:text-[#22c55e] transition-all">SLA</a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] text-slate-400 font-medium">
              © 2026 Arise Diamond. Tecnología de Ouroborus AI Cluster.
            </p>
            <div className="flex items-center gap-8 bg-white px-8 py-4 rounded-xl border border-slate-100 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-[#0f172a] uppercase tracking-widest italic">Estado_Nodal: Estable</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-100"></div>
              <div className="flex items-center gap-4 text-slate-300">
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
    <div className={`bg-white p-10 rounded-xl border border-slate-100 shadow-xl hover:border-[#22c55e]/30 transform hover:-translate-y-2 transition-all duration-1000 group ${delay} relative overflow-hidden`}>
      <div className="absolute right-[-10px] top-[-10px] opacity-[0.02] group-hover:scale-125 transition-transform duration-1000">
         <Icon size={80} />
      </div>
      <div className={`w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-8 group-hover:bg-[#22c55e] group-hover:text-white transition-all duration-500 shadow-inner relative z-10`}>
        <Icon className={`w-7 h-7 ${color} group-hover:text-white`} />
      </div>
      <h4 className="font-black text-[12px] uppercase mb-4 tracking-tighter text-[#0f172a] italic relative z-10">{title}</h4>
      <p className="text-[10px] text-slate-400 font-black leading-relaxed uppercase tracking-widest opacity-60 relative z-10">{desc}</p>
    </div>
  );
}
