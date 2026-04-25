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
    <div className="min-h-screen bg-white flex items-center justify-center p-6 lg:p-10 font-sans selection:bg-[#22c55e]/30 selection:text-white text-slate-900 overflow-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND WITH MESH GRADIENT - ASLAS STYLE */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         {/* BASE SOLID GRADIENT */}
         <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100" />
         
         <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#22c55e]/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#0f172a]/5 blur-[120px] rounded-full" />
         
         <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/40" />
         
         <Image 
          src="/brand/auth-bg.png" 
          alt="Grain Texture" 
          fill
          className="object-cover opacity-10 mix-blend-overlay fixed" 
         />
      </div>

      <div className="w-full max-w-[1200px] bg-white/60 backdrop-blur-3xl rounded-3xl lg:rounded-[40px] shadow-[0_50px_150px_-20px_rgba(0,0,0,0.1)] flex flex-col lg:flex-row overflow-hidden relative border border-white z-10 group">
        
        {/* DECORATIVE LINE */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#22c55e]/30 to-transparent" />

        {/* BACK BUTTON */}
        <Link 
          href="/" 
          className="absolute top-8 right-8 z-50 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-[#22c55e] transition-all group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Volver a Inicio
        </Link>

        {/* LEFT PANEL: INDUSTRIAL VISUAL - LUMINOUS */}
        <div className="hidden lg:flex lg:w-[45%] bg-slate-50 relative p-16 flex-col items-center justify-between overflow-hidden border-r border-slate-100">
          <div className="absolute inset-0 z-0 opacity-40">
            <Image 
              src="/brand/auth-visual.png" 
              alt="Neural Core" 
              fill
              className="object-cover scale-110 blur-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-slate-50" />
          </div>

          <div className="relative z-10 w-full flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
             <div className="w-1.5 h-6 bg-[#22c55e] rounded-full shadow-[0_0_15px_rgba(91,177,115,0.4)]" />
             <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-[0.5em]">Protocolo Luminous v2.5</span>
          </div>

          <div className="relative z-20 flex flex-col items-center justify-center w-full">
             <div className="relative group mb-10">
                 <div className="absolute inset-0 bg-green-500/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                 <div className="w-40 h-40 bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 shadow-2xl flex items-center justify-center p-0 overflow-hidden relative group-hover:scale-105 transition-transform duration-700">
                    <Image src="/brand/official.png" alt="LOOP logo" fill className="object-cover" />
                 </div>
              </div>

             <div className="flex flex-col items-center text-center">
                 <h2 className="text-4xl font-black text-[#1a1a1a] leading-[0.95] tracking-tighter uppercase">
                   {view === 'login' && <>Ingresar <br /><span className="text-[#22c55e]">Al Sistema.</span></>}
                   {view === 'register' && <>Regístrate <br /><span className="text-[#22c55e]">En LOOP.</span></>}
                   {view === 'forgot' && <>Reseteo <br /><span className="text-[#22c55e]">Neural.</span></>}
                 </h2>
                <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.4em] mt-8 max-w-[200px] leading-relaxed">
                   Sincronización en tiempo real con el núcleo Gemini 2.5
                </p>
             </div>
          </div>

          <div className="relative z-10 w-full flex justify-between items-center opacity-30">
             <Cpu size={16} />
             <Activity size={16} />
             <ShieldCheck size={16} />
          </div>
        </div>

        {/* RIGHT PANEL: FORM SECTION */}
        <div className="w-full lg:w-[55%] h-full bg-transparent relative overflow-hidden flex flex-col">
          
          <div className="flex-1 flex flex-col items-center px-8 lg:px-20 py-16 lg:py-24">
            
            {/* Header Section */}
            <div className="flex flex-col items-center mb-10 w-full animate-in fade-in slide-in-from-top-4 duration-700">
               <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 p-0 overflow-hidden shadow-2xl relative lg:hidden">
                  <Image src="/brand/official.png" alt="Logo" fill className="object-cover" />
               </div>
               <h1 className="text-2xl lg:text-3xl font-black text-slate-900 mb-3 tracking-tighter uppercase text-center">
                  {view === 'login' ? 'Conectar' : view === 'register' ? 'Sincronizar' : 'Recuperar'}
               </h1>
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                     {view === 'login' ? 'Terminal_Acceso_v10' : view === 'register' ? 'Alta_De_Nodo' : 'Protocolo_Seguridad'}
                   </p>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="w-full max-w-[380px] mb-10 animate-in fade-in duration-1000">
              <div className="flex items-center bg-slate-100 p-1 rounded-[20px] border border-slate-200 shadow-inner">
                {(['login', 'register', 'forgot'] as AuthView[]).map((v) => (
                  <button 
                    key={v}
                    onClick={() => changeView(v)}
                    className={`flex-1 py-3 text-[8px] font-black uppercase tracking-widest text-center rounded-[16px] transition-all duration-500 ${
                      view === v ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {v === 'login' ? 'LOGIN' : v === 'register' ? 'REGISTRO' : 'RESETEO'}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Section */}
            <div className="w-full max-w-[380px] min-h-[280px] flex flex-col justify-start relative z-20">
               <div className="animate-in fade-in duration-700">
                  {success ? (
                    <div className="text-center py-12 px-10 bg-green-500/5 border border-green-500/20 rounded-[40px] shadow-2xl">
                      <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600 shadow-2xl"><ShieldCheck size={32} /></div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Solicitud Procesada</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">
                        {view === 'register' ? 'Revise su bandeja de entrada para autorizar el nodo.' : 'El enlace de restauración ha sido enviado a su terminal.'}
                      </p>
                      <button onClick={() => changeView('login')} className="mt-10 text-[9px] font-black uppercase tracking-[0.3em] text-green-600 hover:text-green-700 transition-colors">Volver al Terminal</button>
                    </div>
                  ) : (
                    <form onSubmit={view === 'login' ? handleLogin : view === 'register' ? handleRegister : handleReset} className="space-y-4">
                      {view === 'register' && (
                        <div className="relative group bg-slate-50 border border-slate-200 rounded-[18px] flex items-center overflow-hidden h-12 focus-within:border-[#22c55e]/30 focus-within:bg-white transition-all shadow-sm">
                           <div className="w-24 pl-5 flex items-center border-r border-slate-100 shrink-0">
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Identidad</span>
                           </div>
                           <User size={14} className="ml-4 text-slate-300 group-focus-within:text-[#22c55e] transition-colors shrink-0" />
                           <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="NOMBRE COMPLETO"
                            className="flex-1 bg-transparent border-none px-4 h-full text-[10px] font-black text-slate-900 uppercase tracking-widest outline-none placeholder:text-slate-200" />
                        </div>
                      )}

                      <div className="relative group bg-slate-50 border border-slate-200 rounded-[18px] flex items-center overflow-hidden h-12 focus-within:border-[#22c55e]/30 focus-within:bg-white transition-all shadow-sm">
                         <div className="w-24 pl-5 flex items-center border-r border-slate-100 shrink-0">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Terminal</span>
                         </div>
                         <Mail size={14} className="ml-4 text-slate-300 group-focus-within:text-[#22c55e] transition-colors shrink-0" />
                         <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="NOMBRE@NODO.LOOP"
                          className="flex-1 bg-transparent border-none px-4 h-full text-[10px] font-black text-slate-900 uppercase tracking-widest outline-none placeholder:text-slate-200" />
                      </div>

                      {view !== 'forgot' && (
                        <>
                           <div className="relative group bg-slate-50 border border-slate-200 rounded-[18px] flex items-center overflow-hidden h-12 focus-within:border-[#22c55e]/30 focus-within:bg-white transition-all shadow-sm">
                              <div className="w-24 pl-5 flex items-center border-r border-slate-100 shrink-0">
                                 <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Clave</span>
                              </div>
                              <Lock size={14} className="ml-4 text-slate-300 group-focus-within:text-[#22c55e] transition-colors shrink-0" />
                              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                               className="flex-1 bg-transparent border-none px-4 h-full text-[10px] font-black text-slate-900 tracking-[0.3em] outline-none placeholder:text-slate-200" />
                           </div>
                           
                           {view === 'register' && (
                             <div className="relative group bg-slate-50 border border-slate-200 rounded-[18px] flex items-center overflow-hidden h-12 focus-within:border-[#22c55e]/30 focus-within:bg-white transition-all shadow-sm">
                                <div className="w-24 pl-5 flex items-center border-r border-slate-100 shrink-0">
                                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Confirmar</span>
                                </div>
                                <Lock size={14} className="ml-4 text-slate-300 group-focus-within:text-[#22c55e] transition-colors shrink-0" />
                                <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                                 className="flex-1 bg-transparent border-none px-4 h-full text-[10px] font-black text-slate-900 tracking-[0.3em] outline-none placeholder:text-slate-200" />
                             </div>
                           )}
                        </>
                      )}

                      {view === 'login' && (
                        <div className="flex justify-end pr-2 pt-1">
                           <button onClick={() => changeView('forgot')} type="button" className="text-[9px] font-black text-slate-600 hover:text-[#22c55e] uppercase tracking-widest transition-colors">¿Olvidaste tu clave?</button>
                        </div>
                      )}

                      {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-[20px] flex items-center gap-4 text-red-500 shadow-2xl animate-shake">
                           <ShieldAlert size={18} className="shrink-0" />
                           <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{error}</p>
                        </div>
                      )}
                    </form>
                  )}
               </div>
            </div>

            {/* Master Action Button */}
            <div className="w-full max-w-[380px] mt-8">
              {!success && (
                <button 
                  disabled={loading} 
                  onClick={() => {
                    const form = document.querySelector('form');
                    if (form) form.requestSubmit();
                  }}
                  className="w-full h-14 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-[#22c55e] hover:scale-[1.02] active:scale-95 transition-all duration-500 flex items-center justify-center gap-5 disabled:opacity-50 group"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : 
                    <>
                      <span>{view === 'login' ? 'Ingresar' : view === 'register' ? 'Regístrate' : 'Enviar Reseteo'}</span> 
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  }
                </button>
              )}
            </div>
            
          </div>

          <footer className="py-10 text-center border-t border-white/5 bg-white/[0.01]">
             <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.4em]">
                © 2026 SISTEMAS LOOP · ENGINE V2.5 NEURAL CORE · E2EE PROTECTED
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
