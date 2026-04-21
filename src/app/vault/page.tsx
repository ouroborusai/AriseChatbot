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
  CloudLightning
} from 'lucide-react';

export default function ClientVaultPage() {
  const [rut, setRut] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Arise Design Tokens v9.0 (Diamond Edition)
  const colors = {
    bg: '#030507',
    card: 'rgba(255, 255, 255, 0.02)',
    border: 'rgba(255, 255, 255, 0.05)',
    primary: '#135bec', // Azul Diamond
    accent: '#10b981'  // Esmeralda Neural
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulación de registro/validación con RUT
    // En producción, aquí se gatilla Supabase Auth o validación contra DB
    setTimeout(() => {
      setIsRegistered(true);
      setLoading(false);
    }, 1500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    // Simulación de subida y procesamiento AI
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
    <div className="min-h-screen bg-[#030507] text-white p-6 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#135bec]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#10b981]/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-4xl mx-auto py-12 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="text-primary animate-pulse" size={18} />
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500 italic">Neural_Vault_Protocol</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">Bóveda <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Diamond v9.0</span></h1>
          </div>
          {!isRegistered && (
            <div className="flex items-center gap-4 bg-white/[0.03] p-5 rounded-[24px] border border-white/5 backdrop-blur-2xl">
              <div className="p-2.5 bg-rose-500/20 rounded-xl">
                <AlertCircle className="text-rose-500" size={18} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Acceso Bloqueado<br/>Identificación_Requerida</p>
            </div>
          )}
        </div>

        {!isRegistered ? (
          /* REGISTRATION FORM */
          <div className="animate-in fade-in zoom-in duration-700">
            <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[48px] p-12 border border-white/5 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-transparent" />
               
               <div className="mb-12 text-center">
                  <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-xl border border-white/5">
                    <Fingerprint size={48} className="text-primary animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mb-3 italic">Verificación Neural</h2>
                  <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">Sincroniza tu identidad_RUT</p>
               </div>

               <form onSubmit={handleRegister} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] ml-6">RUT_DE_ACCESO</label>
                    <input 
                      required
                      placeholder="12.345.678-9"
                      value={rut}
                      onChange={(e) => setRut(e.target.value)}
                      className="w-full h-24 bg-white/[0.03] border border-white/5 rounded-[32px] px-10 text-2xl font-black focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-slate-800 text-center tracking-tighter"
                    />
                  </div>
                  
                  <button 
                    disabled={loading}
                    className="w-full h-24 bg-primary text-white rounded-[32px] font-black uppercase tracking-[0.3em] text-xs shadow-[0_25px_50px_-12px_rgba(19,91,236,0.5)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-6"
                  >
                    {loading ? "VINCULANDO_NEURONAS..." : "ACTIVAR_BÓVEDA_DIGITAL"}
                    <ChevronRight size={24} />
                  </button>
               </form>
            </div>
          </div>
        ) : (
          /* VAULT DASHBOARD */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-12 duration-1000">
            
            {/* Left Column: Stats & Actions */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white/[0.02] backdrop-blur-2xl rounded-[32px] p-10 border border-white/5 shadow-xl">
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Capacidad_Neural</h3>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-5xl font-black italic tracking-tighter">85%</span>
                  <span className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Sincronizado</span>
                </div>
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden p-[2px]">
                  <div className="bg-gradient-to-r from-primary to-accent h-full rounded-full w-[85%] shadow-[0_0_15px_rgba(19,91,236,0.5)]" />
                </div>
              </div>

              <div className="bg-primary/5 backdrop-blur-2xl rounded-[32px] p-10 border border-primary/10 shadow-xl group hover:bg-primary/10 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CreditCard className="text-primary" />
                </div>
                <h4 className="font-black uppercase text-xs tracking-widest mb-3">Status_Premium</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-black uppercase tracking-widest mb-8">Acceso total_actuante hasta Mayo_2026.</p>
                <button className="text-[9px] font-black uppercase text-primary tracking-[0.3em] flex items-center gap-3 group-hover:gap-5 transition-all">
                  Gestionar_Membresía <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Column: File Manager */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white/5 rounded-[40px] p-10 border border-white/10">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black uppercase italic">Archivos en Nube</h3>
                  <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6366f1] hover:text-white transition-all flex items-center gap-2">
                    {uploading ? <CloudLightning className="animate-bounce" /> : <Upload size={16} />}
                    {uploading ? "Procesando..." : "Subir Nuevo"}
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                <div className="space-y-4">
                  {files.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[32px]">
                      <FileText className="mx-auto text-slate-800 mb-4" size={40} />
                      <p className="text-slate-600 text-xs font-black uppercase tracking-widest">Sin documentos activos</p>
                    </div>
                  ) : (
                    files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-[#6366f1]/20 transition-all">
                            <FileText size={20} className="text-slate-400 group-hover:text-[#6366f1]" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">{file.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{file.date} \u2022 {file.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[8px] font-black text-[#10b981] bg-[#10b981]/10 px-3 py-1 rounded-full uppercase">Neural_Index_OK</span>
                           <CheckCircle2 size={16} className="text-[#10b981]" />
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
        <div className="mt-20 flex flex-wrap justify-center gap-8 opacity-30">
          <div className="flex items-center gap-2 grayscale">
            <Lock size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest italic">AES-256_Encryption</span>
          </div>
          <div className="flex items-center gap-2 grayscale">
            <Database size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest italic">Supabase_Vault_Native</span>
          </div>
        </div>

      </div>
    </div>
  );
}
