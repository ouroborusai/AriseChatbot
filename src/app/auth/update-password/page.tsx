'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, ArrowRight, Loader2, Activity, ShieldCheck } from 'lucide-react';

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
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la clave de seguridad.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-slate-50 to-white opacity-50 pointer-events-none" />
      <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />

      <div className="w-full max-w-[480px] z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 relative mb-6">
             <img src="/brand/official.png" alt="LOOP Logo" className="w-full h-full object-cover rounded-2xl shadow-xl shadow-green-100" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-[0.2em] leading-none italic uppercase mb-4 text-center">Nueva Clave</h1>
          <div className="flex items-center gap-3">
             <Activity size={10} className="text-green-600" />
             <p className="text-green-600 text-[8px] font-black uppercase tracking-[0.4em]">Protocolo de Actualización de Seguridad</p>
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-10 lg:p-12 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden">
          {success ? (
            <div className="text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Clave Actualizada</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Tu clave ha sido reestablecida con éxito. Serás redirigido al inicio de sesión...
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Nueva Contraseña</label>
                <div className="relative">
                  <input 
                    required
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-[24px] pl-16 pr-6 h-18 text-sm font-black text-slate-900 focus:bg-white focus:border-green-500/50 outline-none transition-all"
                  />
                  <Lock size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <input 
                    required
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-[24px] pl-16 pr-6 h-18 text-sm font-black text-slate-900 focus:bg-white focus:border-green-500/50 outline-none transition-all"
                  />
                  <Lock size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-6 rounded-[24px] flex items-center gap-4 text-red-600">
                  <ShieldCheck size={20} className="shrink-0" />
                  <p className="text-[9px] font-black uppercase tracking-widest leading-loose">{error}</p>
                </div>
              )}

              <button 
                disabled={loading}
                type="submit"
                className="w-full h-18 bg-slate-900 text-white rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <><span>Actualizar Clave</span> <ArrowRight size={20} /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
