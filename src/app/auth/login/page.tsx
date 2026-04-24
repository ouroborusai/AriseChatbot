'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Zap, Mail, Lock, ArrowRight, ShieldCheck, 
  Loader2, Activity, Globe, Cpu, Layout, 
  ChevronRight, Fingerprint, User, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

type AuthView = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sync with URL tab param if exists
  useEffect(() => {
    const tab = searchParams.get('tab') as AuthView;
    if (tab && ['login', 'register', 'forgot'].includes(tab)) {
      setView(tab);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!user) throw new Error('ERR_AUTH_NODE_NULL: Failed to retrieve profile.');

      const { data: accessData, error: accessError } = await supabase
        .from('user_company_access')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1);

      if (accessError) throw accessError;
      
      if (!accessData || accessData.length === 0) {
        await supabase.auth.signOut();
        throw new Error('Sin acceso a ninguna empresa.');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error de acceso.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;
      setSuccess(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (resetError) throw resetError;
      setSuccess(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to change view and clean state
  const changeView = (v: AuthView) => {
    setView(v);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 lg:p-10 font-sans selection:bg-green-100 selection:text-green-900 text-slate-900 overflow-hidden relative">
      
      {/* PREMIUM STATIC BACKGROUND WITH SOLID GLOWS */}
      <div className="absolute inset-0 z-0 overflow-hidden">
         <div className="absolute inset-0 bg-[#020617]" />
         
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full" />
         
         <img 
          src="/brand/auth-bg.png" 
          alt="Background" 
          className="w-full h-full object-cover opacity-20 mix-blend-overlay" 
         />
         
         <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-transparent to-[#020617] opacity-60" />
      </div>

      {/* MAIN ADAPTIVE CONTAINER */}
      <div className="w-full max-w-[1100px] h-full lg:h-[600px] bg-white rounded-[40px] lg:rounded-[60px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] flex flex-col lg:flex-row overflow-hidden relative border border-white/5 z-10">
        
        {/* LEFT PANEL: Dynamic Branding Based on View */}
        <div className="hidden lg:flex lg:w-[45%] bg-[#010409] relative p-12 flex-col justify-center overflow-hidden transition-all duration-700">
          
          <div className="absolute inset-0 z-0">
            <img 
              src="/brand/auth-visual.png" 
              alt="Neural Core" 
              className="w-full h-full object-cover scale-150 blur-3xl opacity-30" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]" />
          </div>

          <div className="relative z-20 flex flex-col items-center justify-center">
             <div className="text-center mb-10">
                <h2 className="text-4xl font-black text-white leading-tight tracking-tighter uppercase animate-in fade-in slide-in-from-left-4 duration-700">
                  {view === 'login' && <>Inteligencia <br /><span className="text-green-400">operativa.</span></>}
                  {view === 'register' && <>Únete al <br /><span className="text-green-400">futuro.</span></>}
                  {view === 'forgot' && <>Recupera tu <br /><span className="text-green-400">identidad.</span></>}
                </h2>
             </div>

             <div className="relative group mb-6">
                <div className="absolute inset-0 bg-green-400/20 blur-[100px] rounded-full" />
                <div className="w-56 h-56 bg-slate-900/40 backdrop-blur-md rounded-[48px] border border-white/10 shadow-2xl flex items-center justify-center p-0 overflow-hidden">
                   <img 
                    src="/brand/official.png" 
                    alt="loop logo" 
                    className="w-full h-full object-cover" 
                   />
                </div>
             </div>

             <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 flex flex-col items-center">
                <h3 className="text-6xl font-bold text-white tracking-[-0.05em] lowercase leading-none">loop</h3>
                <div className="h-1.5 w-24 bg-green-400 rounded-full mt-4 shadow-[0_0_25px_rgba(34,197,94,0.6)]" />
             </div>
          </div>
        </div>

        {/* RIGHT PANEL: Dynamic Forms */}
        <div className="w-full lg:w-[55%] h-full flex flex-col items-center justify-center bg-white p-8 lg:px-16 relative overflow-y-auto">
          
          <div className="w-full max-w-[400px] flex flex-col items-center">
            
            {/* Header Logo */}
            <div className="flex flex-col items-center mb-6">
               <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 p-0 overflow-hidden shadow-sm">
                  <img src="/brand/official.png" alt="Logo" className="w-full h-full object-cover" />
               </div>
               <h1 className="text-2xl font-black text-slate-900 mb-1 tracking-tighter italic uppercase">
                  {view === 'login' ? '¡Bienvenido!' : view === 'register' ? 'Registro' : 'Recuperar'}
               </h1>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  {view === 'login' ? 'Unidad Operacional' : view === 'register' ? 'Nodo Operativo' : 'Protocolo de Seguridad'}
               </p>
            </div>

            {/* TRIPLE TAB SWITCHER */}
            <div className="w-full flex items-center bg-slate-50 p-1 rounded-[20px] mb-8 border border-slate-200/50 shadow-inner">
              <button 
                onClick={() => changeView('login')}
                className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest text-center rounded-[16px] transition-all ${view === 'login' ? 'bg-white text-green-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Login
              </button>
              <button 
                onClick={() => changeView('register')}
                className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest text-center rounded-[16px] transition-all ${view === 'register' ? 'bg-white text-green-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Registro
              </button>
              <button 
                onClick={() => changeView('forgot')}
                className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest text-center rounded-[16px] transition-all ${view === 'forgot' ? 'bg-white text-green-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Recuperar
              </button>
            </div>

            {/* FORM CONTENT */}
            <div className="w-full animate-in fade-in slide-in-from-right-4 duration-500">
              
              {/* SUCCESS MESSAGE */}
              {success && (
                <div className="text-center py-4 px-6 bg-green-50 border border-green-100 rounded-[24px] mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Solicitud Enviada</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                    {view === 'register' ? 'Revisa tu correo para confirmar tu cuenta.' : 'Revisa tu bandeja de entrada para el enlace de restauración.'}
                  </p>
                  <button onClick={() => changeView('login')} className="mt-4 text-[9px] font-black text-green-600 uppercase tracking-[0.2em] hover:underline">Volver al Login</button>
                </div>
              )}

              {!success && (
                <form onSubmit={view === 'login' ? handleLogin : view === 'register' ? handleRegister : handleReset} className="space-y-4">
                  
                  {/* Register Name Field */}
                  {view === 'register' && (
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Nombre Completo</label>
                      <div className="relative group">
                         <User size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-colors" />
                         <input 
                          required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                          placeholder="ALEX SILVA"
                          className="w-full bg-slate-50 border border-slate-200/60 rounded-[18px] pl-14 pr-6 h-12 text-sm font-bold text-slate-900 uppercase tracking-widest focus:bg-white focus:border-green-500/50 outline-none transition-all"
                         />
                      </div>
                    </div>
                  )}

                  {/* Shared Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Email Operacional</label>
                    <div className="relative group">
                       <Mail size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-colors" />
                       <input 
                        required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="nombre@unidad.loop"
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-[18px] pl-14 pr-6 h-12 text-sm font-bold text-slate-900 focus:bg-white focus:border-green-500/50 outline-none transition-all"
                       />
                    </div>
                  </div>

                  {/* Password Fields (Login/Register) */}
                  {view !== 'forgot' && (
                    <div className="space-y-4">
                       <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Seguridad</label>
                          <div className="relative group">
                             <Lock size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-colors" />
                             <input 
                              required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-slate-50 border border-slate-200/60 rounded-[18px] pl-14 pr-6 h-12 text-sm font-bold text-slate-900 tracking-widest focus:bg-white focus:border-green-500/50 outline-none transition-all"
                             />
                          </div>
                       </div>

                       {view === 'register' && (
                         <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Confirmar Seguridad</label>
                            <div className="relative group">
                               <Lock size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-colors" />
                               <input 
                                required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-200/60 rounded-[18px] pl-14 pr-6 h-12 text-sm font-bold text-slate-900 tracking-widest focus:bg-white focus:border-green-500/50 outline-none transition-all"
                               />
                            </div>
                         </div>
                       )}
                    </div>
                  )}

                  {view === 'login' && (
                    <div className="flex justify-end pr-1">
                       <button onClick={() => changeView('forgot')} type="button" className="text-[9px] font-black text-slate-400 hover:text-green-600 uppercase tracking-widest transition-colors">¿Olvidaste tu clave?</button>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-100 p-3 rounded-[16px] flex items-center gap-3 text-red-600">
                       <ShieldCheck size={14} />
                       <p className="text-[9px] font-black uppercase tracking-widest leading-tight">{error}</p>
                    </div>
                  )}

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full h-13 bg-[#0f172a] text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.4em] shadow-lg hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 group"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 
                      <>
                        <span>{view === 'login' ? 'Entrar' : view === 'register' ? 'Crear Nodo' : 'Restaurar'}</span> 
                        <ArrowRight size={18} />
                      </>
                    }
                  </button>
                </form>
              )}
            </div>

            <p className="mt-8 text-[8px] font-black text-slate-200 uppercase tracking-[0.4em]">© 2026 loop security</p>
          </div>
        </div>

      </div>
    </div>
  );
}
