'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Zap, Mail, Lock, ArrowRight, ShieldCheck, 
  Loader2, Activity, Globe, Cpu, Layout, 
  ChevronRight, Fingerprint, User, ArrowLeft,
  ShieldAlert,
  Terminal
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type AuthView = 'login' | 'register' | 'forgot';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      if (!user) throw new Error('ERR_AUTH_NODE_NULL');

      const { data: accessData, error: accessError } = await supabase
        .from('user_company_access')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1);

      if (accessError) throw accessError;
      
      if (!accessData || accessData.length === 0) {
        await supabase.auth.signOut();
        throw new Error('Sin acceso a nodos operativos.');
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
      setError('Las claves no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
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
      setError(err.message || 'Error de registro.');
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
      setError(err.message || 'Error al procesar.');
    } finally {
      setLoading(false);
    }
  };

  const changeView = (v: AuthView) => {
    setView(v);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-10 lg:p-20 font-sans selection:bg-primary/30 selection:text-white text-neural-dark overflow-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND WITH MESH GRADIENT - ASLAS STYLE */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         {/* BASE SOLID GRADIENT */}
         <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100" />
         
         <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-primary/10 blur-[160px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] bg-accent/5 blur-[160px] rounded-full" />
         
         <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/40" />
         
         <Image 
          src="/brand/auth-bg.png" 
          alt="Grain Texture" 
          fill
          className="object-cover opacity-[0.03] mix-blend-overlay fixed" 
         />
      </div>

      <div className="w-full max-w-[1300px] bg-white/70 backdrop-blur-3xl rounded-xl shadow-[0_60px_150px_-20px_rgba(0,0,0,0.15)] flex flex-col lg:flex-row overflow-hidden relative border border-white z-10 group">
        
        {/* DECORATIVE LINE */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        {/* BACK BUTTON */}
        <Link 
          href="/" 
          className="absolute top-10 right-10 z-50 flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] hover:text-primary transition-all group italic"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
          VOLVER_A_INICIO
        </Link>

        {/* LEFT PANEL: INDUSTRIAL VISUAL - LUMINOUS */}
        <div className="hidden lg:flex lg:w-[45%] bg-slate-50/50 relative p-20 flex-col items-center justify-between overflow-hidden border-r border-slate-100">
          <div className="absolute inset-0 z-0 opacity-20">
            <Image 
              src="/brand/auth-visual.png" 
              alt="Neural Core" 
              fill
              className="object-cover scale-110 blur-2xl animate-pulse"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-slate-50" />
          </div>

          <div className="relative z-10 w-full flex items-center gap-6 animate-in fade-in slide-in-from-left-8 duration-1000">
             <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)]" />
             <span className="text-[10px] font-black text-accent uppercase tracking-[0.6em] italic">Protocolo_Luminous_v10.4</span>
          </div>

          <div className="relative z-20 flex flex-col items-center justify-center w-full">
             <div className="relative group mb-16">
                 <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                 <div className="w-56 h-56 bg-white rounded-xl border border-white/10 shadow-2xl flex items-center justify-center p-0 overflow-hidden relative group-hover:scale-110 transition-transform duration-1000 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)]">
                    <Image src="/brand/official.png" alt="LOOP logo" fill className="object-cover" />
                 </div>
              </div>

             <div className="flex flex-col items-center text-center">
                 <h2 className="text-5xl font-black text-neural-dark leading-[0.85] tracking-tighter uppercase italic">
                   {view === 'login' && <>Conectar <br /><span className="text-primary">Nodo_Operativo.</span></>}
                   {view === 'register' && <>Sincronizar <br /><span className="text-primary">Nueva_Entidad.</span></>}
                   {view === 'forgot' && <>Reseteo <br /><span className="text-primary">Secuencial.</span></>}
                 </h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-12 max-w-[280px] leading-relaxed opacity-60 italic">
                   Sincronización en tiempo real con el núcleo Gemini 10.4 Platinum
                </p>
             </div>
          </div>

          <div className="relative z-10 w-full flex justify-between items-center opacity-30 px-10">
             <Cpu size={20} className="text-primary" />
             <Activity size={20} className="text-accent" />
             <ShieldCheck size={20} className="text-primary" />
          </div>
        </div>

        {/* RIGHT PANEL: FORM SECTION */}
        <div className="w-full lg:w-[55%] h-full bg-transparent relative overflow-hidden flex flex-col">
          
          <div className="flex-1 flex flex-col items-center px-12 lg:px-24 py-24 lg:py-32">
            
            {/* Header Section */}
            <div className="flex flex-col items-center mb-16 w-full animate-in fade-in slide-in-from-top-8 duration-1000">
               <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center mb-10 border border-slate-100 p-0 overflow-hidden shadow-2xl relative lg:hidden">
                  <Image src="/brand/official.png" alt="Logo" fill className="object-cover" />
               </div>
               <h1 className="text-4xl lg:text-5xl font-black text-neural-dark mb-6 tracking-tighter uppercase text-center italic">
                  {view === 'login' ? 'Auth_Terminal' : view === 'register' ? 'Node_Provision' : 'Recovery_Safe'}
               </h1>
                <div className="flex items-center gap-5">
                   <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">
                     {view === 'login' ? 'ACCESO_RESTRINGIDO_v10' : view === 'register' ? 'ALTA_PRIORITARIA' : 'ENLACE_CRÍPTICO'}
                   </p>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="w-full max-w-[420px] mb-12 animate-in fade-in duration-1000">
              <div className="flex items-center bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-inner">
                {(['login', 'register', 'forgot'] as AuthView[]).map((v) => (
                  <button 
                    key={v}
                    onClick={() => changeView(v)}
                    className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-center rounded-xl transition-all duration-700 italic ${
                      view === v ? 'bg-white text-neural-dark shadow-2xl scale-105 ring-1 ring-slate-100' : 'text-slate-400 hover:text-neural-dark'
                    }`}
                  >
                    {v === 'login' ? 'CONECTAR' : v === 'register' ? 'REGISTRO' : 'RESETEO'}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Section */}
            <div className="w-full max-w-[420px] min-h-[320px] flex flex-col justify-start relative z-20">
               <div className="animate-in fade-in duration-1000">
                  {success ? (
                    <div className="text-center py-16 px-12 bg-primary/5 border border-primary/20 rounded-xl shadow-2xl">
                      <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-10 text-primary shadow-2xl animate-bounce"><ShieldCheck size={40} /></div>
                      <h4 className="text-md font-black text-neural-dark uppercase tracking-[0.3em] mb-6 italic">PROCESO_COMPLETO</h4>
                      <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] leading-relaxed italic opacity-60">
                        {view === 'register' ? 'Revise su bandeja de entrada para autorizar el nodo.' : 'El enlace de restauración ha sido enviado a su terminal.'}
                      </p>
                      <button onClick={() => changeView('login')} className="mt-12 text-[10px] font-black uppercase tracking-[0.4em] text-primary hover:scale-105 transition-all italic border-b-2 border-primary pb-1">VOLVER_A_TERMINAL</button>
                    </div>
                  ) : (
                    <form onSubmit={view === 'login' ? handleLogin : view === 'register' ? handleRegister : handleReset} className="space-y-6">
                      {view === 'register' && (
                        <div className="relative group bg-slate-50/50 border border-slate-100 rounded-xl flex items-center overflow-hidden h-16 focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                           <div className="w-28 pl-6 flex items-center border-r border-slate-100 shrink-0">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Identidad</span>
                           </div>
                           <User size={18} className="ml-6 text-slate-300 group-focus-within:text-primary transition-colors shrink-0" />
                           <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="NOMBRE COMPLETO"
                            className="flex-1 bg-transparent border-none px-6 h-full text-[11px] font-black text-neural-dark uppercase tracking-[0.2em] outline-none placeholder:text-slate-200 italic" />
                        </div>
                      )}

                      <div className="relative group bg-slate-50/50 border border-slate-100 rounded-xl flex items-center overflow-hidden h-16 focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                         <div className="w-28 pl-6 flex items-center border-r border-slate-100 shrink-0">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Terminal</span>
                         </div>
                         <Mail size={18} className="ml-6 text-slate-300 group-focus-within:text-primary transition-colors shrink-0" />
                         <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="NOMBRE@NODO.ARISE"
                          className="flex-1 bg-transparent border-none px-6 h-full text-[11px] font-black text-neural-dark uppercase tracking-[0.2em] outline-none placeholder:text-slate-200 italic" />
                      </div>

                      {view !== 'forgot' && (
                        <>
                           <div className="relative group bg-slate-50/50 border border-slate-100 rounded-xl flex items-center overflow-hidden h-16 focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                              <div className="w-28 pl-6 flex items-center border-r border-slate-100 shrink-0">
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Clave</span>
                              </div>
                              <Lock size={18} className="ml-6 text-slate-300 group-focus-within:text-primary transition-colors shrink-0" />
                              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                               className="flex-1 bg-transparent border-none px-6 h-full text-[11px] font-black text-neural-dark tracking-[0.4em] outline-none placeholder:text-slate-200" />
                           </div>
                           
                           {view === 'register' && (
                             <div className="relative group bg-slate-50/50 border border-slate-100 rounded-xl flex items-center overflow-hidden h-16 focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                                <div className="w-28 pl-6 flex items-center border-r border-slate-100 shrink-0">
                                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Confirmar</span>
                                </div>
                                <Lock size={18} className="ml-6 text-slate-300 group-focus-within:text-primary transition-colors shrink-0" />
                                <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                                 className="flex-1 bg-transparent border-none px-6 h-full text-[11px] font-black text-neural-dark tracking-[0.4em] outline-none placeholder:text-slate-200" />
                             </div>
                           )}
                        </>
                      )}

                      {view === 'login' && (
                        <div className="flex justify-end pr-4 pt-2">
                           <button onClick={() => changeView('forgot')} type="button" className="text-[9px] font-black text-slate-400 hover:text-primary uppercase tracking-[0.3em] transition-colors italic">¿OLVIDASTE TU CLAVE?</button>
                        </div>
                      )}

                      {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-xl flex items-center gap-6 text-rose-500 shadow-2xl animate-shake">
                           <ShieldAlert size={24} className="shrink-0" />
                           <p className="text-[11px] font-black uppercase tracking-[0.2em] leading-tight italic">ERROR_DETECTADO: {error}</p>
                        </div>
                      )}
                    </form>
                  )}
               </div>
            </div>

            {/* Master Action Button */}
            <div className="w-full max-w-[420px] mt-12">
              {!success && (
                <button 
                  disabled={loading} 
                  onClick={() => {
                    const form = document.querySelector('form');
                    if (form) form.requestSubmit();
                  }}
                  className="w-full h-16 bg-accent text-white rounded-xl font-black text-[11px] uppercase tracking-[0.5em] shadow-2xl hover:bg-primary hover:scale-[1.02] active:scale-95 transition-all duration-700 flex items-center justify-center gap-6 disabled:opacity-50 group italic ring-1 ring-white/10"
                >
                  {loading ? <Loader2 size={28} className="animate-spin" /> : 
                    <>
                      <span>{view === 'login' ? 'AUTORIZAR_ACCESO' : view === 'register' ? 'REGISTRAR_NODO' : 'ENVIAR_RESETEO'}</span> 
                      <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </>
                  }
                </button>
              )}
            </div>
            
          </div>

          <footer className="py-12 text-center border-t border-slate-100 bg-slate-50/20">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em] italic opacity-40">
                © 2026 SISTEMAS ARISE · ENGINE v10.4 NEURAL CORE · E2EE PROTECTED
             </p>
          </footer>
        </div>

      </div>
    </div>
  );
}

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AuthContent />
    </Suspense>
  );
}
