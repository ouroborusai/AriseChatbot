'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldLock, 
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

  // Diamond v7.1 Theme Constants
  const colors = {
    bg: '#07090d',
    card: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255, 255, 255, 0.08)',
    primary: '#6366f1',
    accent: '#a855f7'
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
    <div className="min-h-screen bg-[#07090d] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto py-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldLock className="text-[#6366f1]" size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Secure_Encryption_Active</span>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">B\u00F3veda <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#a855f7]">Digital v7.1</span></h1>
          </div>
          {!isRegistered && (
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertCircle className="text-yellow-500" size={16} />
              </div>
              <p className="text-xs font-bold text-slate-400">Acceso restringido. Identificaci\u00F3n requerida.</p>
            </div>
          )}
        </div>

        {!isRegistered ? (
          /* REGISTRATION FORM */
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-10 border border-white/10 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6366f1] to-transparent" />
               
               <div className="mb-10 text-center">
                  <Fingerprint size={48} className="mx-auto text-[#6366f1] mb-6 animate-pulse" />
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Validaci\u00F3n de Identidad</h2>
                  <p className="text-slate-500 text-sm">Ingresa tu RUT para vincular tu asistente personal.</p>
               </div>

               <form onSubmit={handleRegister} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">RUT del Cliente</label>
                    <input 
                      required
                      placeholder="12.345.678-9"
                      value={rut}
                      onChange={(e) => setRut(e.target.value)}
                      className="w-full h-20 bg-white/5 border border-white/5 rounded-[24px] px-8 text-xl font-black focus:border-[#6366f1]/50 outline-none transition-all placeholder:text-slate-800"
                    />
                  </div>
                  
                  <button 
                    disabled={loading}
                    className="w-full h-20 bg-[#6366f1] rounded-[28px] font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_rgba(99,102,241,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                  >
                    {loading ? "Sincronizando..." : "Activar B\u00F3veda"}
                    <ChevronRight size={20} />
                  </button>
               </form>
            </div>
          </div>
        ) : (
          /* VAULT DASHBOARD */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
            
            {/* Left Column: Stats & Actions */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-white/10">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Capacidad Neural</h3>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-black italic">85%</span>
                  <span className="text-xs text-slate-500 mb-1">Indexado</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] h-full w-[85%]" />
                </div>
              </div>

              <div className="bg-[#6366f1]/10 rounded-[32px] p-8 border border-[#6366f1]/20">
                <CreditCard className="text-[#6366f1] mb-4" />
                <h4 className="font-black uppercase text-sm mb-2">Status Premium</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">Acceso liberado v\u00EDa Mercado Pago hasta Mayo 2026.</p>
                <button className="text-[10px] font-black uppercase text-[#6366f1] tracking-widest flex items-center gap-2">
                  Gestionar Plan <ChevronRight size={14} />
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
