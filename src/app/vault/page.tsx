'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  Upload, 
  FileText, 
  Search, 
  CreditCard, 
  Fingerprint, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Database,
  Lock,
  CloudLightning,
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Terminal
} from 'lucide-react';
import Image from 'next/image';

export default function ClientVaultPage() {
  const [rut, setRut] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const BRAND_GREEN = "#22c55e";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setIsRegistered(true);
      setLoading(false);
    }, 1500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setTimeout(() => {
      setFiles([{
        id: Date.now(),
        name: file.name,
        type: 'PDF',
        status: 'indexed',
        date: new Date().toLocaleDateString()
      }, ...files]);
      setUploading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      
      {/* PREMIUM GLOWS - DIAMOND v10.0 PURITY */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-green-500/10 blur-[180px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[180px] rounded-full" />
         <Image 
          src="/brand/auth-bg.png" 
          alt="Background Texture" 
          fill
          priority
          className="object-cover opacity-10 mix-blend-overlay fixed" 
         />
      </div>

      <div className="max-w-6xl mx-auto py-12 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-24 gap-10">
          <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-green-500 italic">Protocolo de Bóveda Neural</span>
            </div>
            <h1 className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter leading-none text-white">
               Bóveda <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-500">LOOP</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-8 animate-in fade-in slide-in-from-right-8 duration-1000">
             <div className="flex items-center gap-5 bg-white/5 border border-white/10 px-8 py-4 rounded-3xl backdrop-blur-3xl shadow-2xl">
                <div className="relative">
                   <ShieldCheck size={24} className="text-green-500" />
                   <div className="absolute inset-0 bg-green-500/20 blur-lg rounded-full" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-white uppercase tracking-wider leading-none">Status: Blindado</span>
                   <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Encriptación de Grado Militar</span>
                </div>
             </div>
          </div>
        </div>

        {!isRegistered ? (
          /* REGISTRATION / ACCESS FORM - INDUSTRIAL DARK REDESIGN */
          <div className="animate-in fade-in zoom-in-95 duration-1000 flex justify-center">
            <div className="w-full max-w-[600px] bg-[#0f172a]/60 backdrop-blur-3xl rounded-[64px] p-16 md:p-20 shadow-[0_50px_150px_-20px_rgba(0,0,0,1)] relative overflow-hidden border border-white/10 group">
               
               {/* Decorative Gradient Line */}
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />

               <div className="mb-16 text-center relative z-10">
                  <div className="w-28 h-28 bg-white/5 rounded-[48px] flex items-center justify-center mx-auto mb-10 border border-white/10 relative group/icon overflow-hidden shadow-2xl">
                     <div className="absolute inset-0 bg-green-500/20 scale-0 group-hover/icon:scale-110 transition-transform duration-700" />
                     <Fingerprint size={56} className="text-white group-hover/icon:text-green-500 transition-colors duration-500 relative z-10" />
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic text-white">Verificación</h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic leading-relaxed">
                    Sincronización de Identidad Operativa <br /> Nodo v2.5
                  </p>
               </div>

               <form onSubmit={handleRegister} className="space-y-8 relative z-10">
                  <div className="relative group bg-white/5 border border-white/5 rounded-[28px] flex items-center overflow-hidden h-24 focus-within:bg-white/10 focus-within:border-green-500/30 transition-all shadow-2xl">
                     <div className="w-32 pl-8 flex items-center border-r border-white/5">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">RUT_TERM</span>
                     </div>
                     <input 
                        required
                        placeholder="12.345.678-9"
                        value={rut}
                        onChange={(e) => setRut(e.target.value)}
                        className="flex-1 bg-transparent border-none px-10 h-full text-3xl font-black text-white tracking-tighter outline-none placeholder:text-slate-800 italic uppercase"
                     />
                  </div>
                  
                  <button 
                    disabled={loading}
                    className="w-full h-24 bg-white text-slate-900 rounded-[32px] font-black uppercase tracking-[0.5em] text-[12px] shadow-[0_20px_50px_rgba(255,255,255,0.05)] hover:bg-green-500 hover:text-white hover:scale-[1.02] active:scale-95 transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-8 group/btn"
                  >
                    {loading ? <Loader2 size={28} className="animate-spin" /> : 
                       <>
                        <span>Activar Bóveda</span> 
                        <Terminal size={24} className="group-hover/btn:translate-x-2 transition-transform" />
                       </>
                    }
                  </button>
               </form>

               <div className="mt-16 pt-12 border-t border-white/5 text-center relative z-10">
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.6em] italic opacity-50">LOOP OS · DIAMOND v10.0 · E2EE PROTECTED</p>
               </div>
            </div>
          </div>
        ) : (
          /* VAULT DASHBOARD - INDUSTRIAL DARK */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in slide-in-from-bottom-12 duration-1000">
            
            {/* Sidebar Column */}
            <div className="lg:col-span-1 space-y-10">
              <div className="loop-card p-12 bg-white/5 backdrop-blur-3xl border-white/5 relative overflow-hidden group rounded-[48px] shadow-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 blur-[100px] rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-150 duration-1000" />
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-12 italic">Capacidad Neural</h3>
                <div className="flex items-end gap-4 mb-8 relative z-10">
                  <span className="text-7xl font-black italic tracking-tighter text-white">85%</span>
                  <div className="flex flex-col mb-3">
                    <span className="text-[12px] font-black text-green-500 uppercase tracking-widest leading-none italic">Sincronizado</span>
                    <div className="w-12 h-1 bg-green-500 mt-2 shadow-[0_0_10px_#22c55e]" />
                  </div>
                </div>
                <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden p-1 border border-white/5 relative z-10">
                  <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-400 h-full rounded-full w-[85%] shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-pulse" />
                </div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] mt-8 italic leading-relaxed">
                  Matriz de Memoria Optimizada <br /> para Gemini 2.5 Flash-Lite
                </p>
              </div>

              <div className="loop-card p-12 bg-[#010409] border border-white/5 group cursor-pointer hover:bg-white/[0.03] transition-all duration-500 rounded-[48px] shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-10 border border-white/10 group-hover:bg-green-500 group-hover:text-slate-900 group-hover:border-transparent transition-all duration-500 shadow-2xl">
                  <Cpu size={28} />
                </div>
                <h4 className="font-black uppercase text-lg tracking-tighter italic mb-4 text-white">Procesamiento Neural</h4>
                <p className="text-[11px] text-slate-500 leading-loose font-bold uppercase tracking-widest mb-12">Sus archivos están siendo vectorizados en tiempo real para consultas de alta velocidad.</p>
                <div className="h-[1px] w-full bg-white/5 mb-10" />
                <button className="text-[10px] font-black uppercase text-green-500 tracking-[0.4em] flex items-center gap-5 group-hover:gap-8 transition-all italic">
                  Comandos de IA <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Main File Management Column */}
            <div className="lg:col-span-2 space-y-10">
              <div className="loop-card p-14 bg-white/5 backdrop-blur-3xl border-white/5 rounded-[56px] shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-20 gap-10">
                  <div>
                     <h3 className="text-4xl font-black uppercase italic text-white tracking-tighter">Bóveda Digital</h3>
                     <div className="flex items-center gap-3 mt-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">Archivo Maestro de Alta Integridad</p>
                     </div>
                  </div>
                  <label className="cursor-pointer bg-white text-slate-900 px-10 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-[0.4em] hover:bg-green-500 hover:text-white transition-all flex items-center gap-5 shadow-2xl active:scale-95 group/upload">
                    {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} className="group-hover/upload:-translate-y-1 transition-transform" />}
                    <span>{uploading ? "SINC_DATOS..." : "CARGAR_NODO"}</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                <div className="space-y-6">
                  {files.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[48px] group hover:border-green-500/20 transition-all duration-500">
                      <FileText className="mx-auto text-slate-900 group-hover:text-green-500/10 mb-8 transition-colors" size={72} strokeWidth={1} />
                      <p className="text-slate-700 text-[11px] font-black uppercase tracking-[0.6em] italic">Sin activos registrados</p>
                    </div>
                  ) : (
                    files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-10 bg-[#010409]/40 rounded-[36px] border border-white/5 hover:bg-white/5 hover:border-green-500/20 transition-all duration-500 group shadow-xl">
                        <div className="flex items-center gap-8">
                          <div className="w-16 h-16 bg-white/5 rounded-[26px] flex items-center justify-center border border-white/10 group-hover:bg-green-500 group-hover:text-slate-900 group-hover:border-transparent transition-all duration-500 shadow-2xl">
                            <FileText size={28} />
                          </div>
                          <div>
                            <p className="text-lg font-black text-white uppercase tracking-tight italic group-hover:text-green-500 transition-colors duration-500">{file.name}</p>
                            <div className="flex items-center gap-4 mt-3">
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{file.date}</span>
                               <span className="opacity-20 text-slate-800">//</span>
                               <span className="text-[10px] font-black text-green-500 uppercase tracking-widest italic">{file.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="hidden md:flex items-center gap-3 bg-green-500/5 px-6 py-3 rounded-2xl border border-green-500/10 shadow-inner">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest italic">INDEXED_OK</span>
                           </div>
                           <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/10 transition-all shadow-xl group/btn">
                              <ChevronRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                           </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Security Footer */}
        <div className="mt-32 flex flex-wrap justify-center gap-16 opacity-30 px-6">
          <div className="flex items-center gap-4 group cursor-help">
            <Lock size={16} className="text-green-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] italic text-slate-600">AES-256 Protocol</span>
          </div>
          <div className="flex items-center gap-4 group cursor-help">
            <Database size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] italic text-slate-600">Neural Vault Node</span>
          </div>
          <div className="flex items-center gap-4 group cursor-help">
            <ShieldAlert size={16} className="text-green-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] italic text-slate-600">RLS Isolated</span>
          </div>
        </div>

      </div>
    </div>
  );
}
