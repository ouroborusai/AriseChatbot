'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Zap, Mail, Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Auth Neural
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!user) throw new Error('No se pudo recuperar el perfil de usuario');

      // 2. Validación de Acceso Multi-Empresa (SSOT v6.22)
      const { data: accessData, error: accessError } = await supabase
        .from('user_company_access')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1);

      if (accessError) throw new Error('Error al validar permisos industriales');
      
      if (!accessData || accessData.length === 0) {
        // El usuario existe en Auth pero no tiene empresas asignadas (Usuario Huérfano)
        await supabase.auth.signOut();
        throw new Error('ACCESO DENEGADO: Su cuenta no tiene empresas vinculadas en el nodo central.');
      }

      // 3. Sincronización Exitosa
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error crítico en el protocolo de acceso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-[440px] z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3 mb-6 transition-transform hover:rotate-0 duration-500">
            <Zap size={32} className="text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Arise Intelligence</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Business Operating System / v6.22</p>
        </div>

        <div className="arise-card p-10 backdrop-blur-xl bg-white/80 border-white/50 shadow-2xl shadow-slate-200/50">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900">Bienvenido de vuelta</h2>
            <p className="text-xs font-bold text-slate-400 mt-1">Ingrese sus credenciales de acceso neural</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Corporativo</label>
              <div className="relative group">
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@arise.ai" 
                  className="arise-input w-full pl-12 h-14 text-sm font-bold group-hover:ring-offset-2"
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative group">
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="arise-input w-full pl-12 h-14 text-sm font-bold group-hover:ring-offset-2"
                />
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2 duration-300">
                <ShieldCheck size={18} className="shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-wider leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:translate-y-0"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>Sincronizar Acceso</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Certificación de Seguridad Diamond v6.5 • © 2026 Arise
          </p>
        </div>
      </div>
    </div>
  );
}
