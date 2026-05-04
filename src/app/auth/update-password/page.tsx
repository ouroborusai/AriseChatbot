'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, ArrowRight, Loader2, Activity, ShieldCheck, Zap, Fingerprint } from 'lucide-react';
import Image from 'next/image';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Error al actualizar la clave de seguridad.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans text-white">
      {/* PREMIUM BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-green-500/10 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />

      <div className="w-full max-w-[480px] z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 relative mb-8 group">
             <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
             <Image 
               src="/brand/arise-logo.png" 
               alt="ARISE Logo" 
               width={80}
               height={80}
               className="w-full h-full object-cover rounded-[24px] shadow-2xl relative z-10 border border-white/5"
             />
          </div>
          <h1 className="text-4xl font-black text-white tracking-[0.2em] leading-none italic uppercase mb-6 text-center">Nueva Clave</h1>
          <div className="flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/5 backdrop-blur-md">
             <Activity size={12} className="text-green-500 animate-pulse" />
             <p className="text-green-500 text-[9px] font-black uppercase tracking-[0.4em] italic">Protocolo de Seguridad v2.5</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-[48px] p-10 lg:p-14 shadow-2xl border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
          
          {success ? (
            <div className="text-center animate-in fade-in duration-700 py-10">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-10 text-green-500 border border-green-500/20 shadow-[0_0_30px_#22c55e33]">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-[0.3em] mb-6 italic">Clave Actualizada</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] leading-relaxed italic">
                Tu clave ha sido reestablecida con éxito. <br/>Serás redirigido al inicio de sesión...
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-10">
              <div className="space-y-5">
                <label className="block text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2 italic">Nueva Contraseña</label>
                <div className="relative group/input">
                  <input 
                    required
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-black/40 border border-white/5 rounded-[26px] pl-16 pr-8 h-18 text-sm font-black text-white focus:bg-black/60 focus:border-green-500/50 outline-none transition-all shadow-inner relative z-10"
                  />
                  <Lock size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/input:text-green-500 transition-colors z-20" />
                </div>
              </div>

              <div className="space-y-5">
                <label className="block text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2 italic">Confirmar Nueva Contraseña</label>
                <div className="relative group/input">
                  <input 
                    required
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-black/40 border border-white/5 rounded-[26px] pl-16 pr-8 h-18 text-sm font-black text-white focus:bg-black/60 focus:border-green-500/50 outline-none transition-all shadow-inner relative z-10"
                  />
                  <Lock size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/input:text-green-500 transition-colors z-20" />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-[28px] flex items-center gap-5 text-red-500 animate-in shake duration-500">
                  <ShieldCheck size={20} className="shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-loose italic">{error}</p>
                </div>
              )}

              <button 
                disabled={loading}
                type="submit"
                className="w-full h-20 bg-white text-slate-900 rounded-[28px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-green-500 hover:text-white active:scale-95 transition-all flex items-center justify-center gap-6 disabled:opacity-50 group/btn"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <><span>Actualizar Clave</span> <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /></>}
              </button>
            </form>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-6">
           <div className="flex items-center gap-4 text-slate-700">
              <div className="w-12 h-[1px] bg-slate-800" />
              <Fingerprint size={16} />
              <div className="w-12 h-[1px] bg-slate-800" />
           </div>
           <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.5em] italic">Ouroborus AI Neural System</p>
        </div>
      </div>
    </div>
  );
}
