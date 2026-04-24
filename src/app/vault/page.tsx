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
  Sparkles
} from 'lucide-react';

export default function ClientVaultPage() {
  const [rut, setRut] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Arise Design Tokens v9.0 (Diamond Edition)
  const colors = {
    bg: '#ffffff',
    card: '#ffffff',
    border: '#f1f5f9',
    primary: '#16a34a', // Verde LOOP
    accent: '#10b981'  // Esmeralda Neural
  };

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
    <div className="min-h-screen bg-white text-slate-900 p-6 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-50 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-50/50 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-4xl mx-auto py-12 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="text-primary animate-pulse" size={18} />
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Protocolo de Bóveda Neural</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Bóveda <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400">LOOP v9.0</span></h1>
          </div>
          {!isRegistered && (
            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[24px] border border-slate-100 shadow-sm">
              <div className="p-2.5 bg-rose-500/10 rounded-xl">
                <AlertCircle className="text-rose-500" size={18} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Acceso Bloqueado<br/>Identificación Requerida</p>
            </div>
          )}
        </div>

        {!isRegistered ? (
          /* REGISTRATION FORM */
          <div className="animate-in fade-in zoom-in duration-700">
            <div className="bg-white rounded-[48px] p-12 border border-slate-100 relative overflow-hidden shadow-2xl shadow-green-900/5">
               <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-transparent" />
               
               <div className="mb-12 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100">
                    <Fingerprint size={48} className="text-primary animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mb-3 italic text-slate-900">Verificación Neural</h2>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Sincroniza tu identidad RUT</p>
               </div>

               <form onSubmit={handleRegister} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">RUT DE ACCESO</label>
                    <input 
                      required
                      placeholder="12.345.678-9"
                      value={rut}
                      onChange={(e) => setRut(e.target.value)}
                      className="w-full h-24 bg-slate-50 border border-slate-100 rounded-[32px] px-10 text-2xl font-black focus:border-green-500/30 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-center tracking-tighter text-slate-900 shadow-inner"
                    />
                  </div>
                  
                  <button 
                    disabled={loading}
                    className="w-full h-24 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.3em] text-xs shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-6"
                  >
                    {loading ? "VINCULANDO NEURONAS..." : "ACTIVAR BÓVEDA DIGITAL"}
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
              <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-arise">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Capacidad Neural</h3>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-5xl font-black italic tracking-tighter text-slate-900">85%</span>
                  <span className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Sincronizado</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-[2px]">
                  <div className="bg-gradient-to-r from-primary to-accent h-full rounded-full w-[85%] shadow-[0_0_15px_rgba(22,163,74,0.3)]" />
                </div>
              </div>

              <div className="bg-green-50/50 rounded-[32px] p-10 border border-green-100 shadow-sm group hover:bg-green-50 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                  <CreditCard className="text-primary" />
                </div>
                <h4 className="font-black uppercase text-xs tracking-widest mb-3 text-slate-900">Estado Premium</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-black uppercase tracking-widest mb-8">Acceso total activo hasta Mayo 2026.</p>
                <button className="text-[9px] font-black uppercase text-primary tracking-[0.3em] flex items-center gap-3 group-hover:gap-5 transition-all">
                  Gestionar Membresía <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Column: File Manager */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-arise">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                  <h3 className="text-xl font-black uppercase italic text-slate-900">Archivos en Nube</h3>
                  <label className="cursor-pointer bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all flex items-center gap-2 shadow-lg">
                    {uploading ? <CloudLightning className="animate-bounce" /> : <Upload size={16} />}
                    {uploading ? "Procesando..." : "Subir Nuevo"}
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                <div className="space-y-4">
                  {files.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[32px]">
                      <FileText className="mx-auto text-slate-200 mb-4" size={40} />
                      <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Sin documentos activos</p>
                    </div>
                  ) : (
                    files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl group-hover:bg-green-50 transition-all shadow-sm">
                            <FileText size={20} className="text-slate-400 group-hover:text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{file.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{file.date} \u2022 {file.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[8px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">Índice Neural OK</span>
                           <CheckCircle2 size={16} className="text-green-500" />
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
        <div className="mt-20 flex flex-wrap justify-center gap-8 opacity-50">
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-slate-400" />
            <span className="text-[9px] font-black uppercase tracking-widest italic text-slate-400">Encriptación AES-256</span>
          </div>
          <div className="flex items-center gap-2">
            <Database size={12} className="text-slate-400" />
            <span className="text-[9px] font-black uppercase tracking-widest italic text-slate-400">Bóveda Nativa Supabase</span>
          </div>
        </div>

      </div>
    </div>
  );
}
