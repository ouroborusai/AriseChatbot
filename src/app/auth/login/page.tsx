'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Zap, Mail, Lock, ArrowRight, ShieldCheck, Loader2, Activity, Globe } from 'lucide-react';

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

      if (accessError) throw new Error('ERR_PERM_SYNC: Neural sync failure.');
      
      if (!accessData || accessData.length === 0) {
        await supabase.auth.signOut();
        throw new Error('ERR_ACCESS_DENIED: User node orphaned. No company link detected.');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'ERR_CRITICAL: Access protocol breach.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-green-100 selection:text-green-900 text-slate-900">
      {/* High-Performance Neural Decor */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-slate-50 to-white opacity-50 pointer-events-none" />
      <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />

      {/* Atmospheric Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-green-50 blur-[160px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-50 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-[480px] z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center mb-16">
          <div className="w-24 h-24 relative mb-10 group cursor-pointer transition-all hover:scale-110">
             <div className="w-full h-full bg-green-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-green-100 group-hover:rotate-6 transition-transform">
                <svg viewBox="0 0 100 100" className="w-12 h-12 fill-none stroke-white" strokeWidth="8">
                  <path d="M50 75 L30 90 L35 70 C15 65 10 45 30 30 C50 15 85 45 50 75 Z" fill="white" stroke="none" />
                  <path d="M35 50 Q35 40 45 40 Q55 40 50 50 Q45 60 55 60 Q65 60 65 50 Q65 40 55 40 Q45 40 50 50 Q55 60 45 60 Q35 60 35 50" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
                </svg>
             </div>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-[0.3em] leading-none italic uppercase mb-6">LOOP</h1>
          <div className="flex flex-col items-center gap-3">
             <div className="flex items-center gap-3">
                <Activity size={10} className="text-green-600" />
                <p className="text-green-600 text-[9px] font-black uppercase tracking-[0.6em]">Neural_Business_OS / v9.0</p>
             </div>
             <p className="text-slate-400 text-[10px] font-bold italic tracking-wider mt-2 whitespace-nowrap">"Cierra el ciclo de tus tareas con Loop"</p>
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-10 lg:p-12 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
          
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">ACCESS_PROTOCOL</h2>
            <p className="text-[10px] font-black text-slate-400 mt-3 uppercase tracking-[0.3em]">Credentials required for neural uplink</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-10">
            <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Operator_ID</label>
              <div className="relative">
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@unit.arise" 
                  autoComplete="email"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[24px] pl-16 pr-6 h-18 text-sm font-black text-slate-900 uppercase tracking-widest placeholder:text-slate-300 focus:bg-white focus:border-green-500/50 focus:shadow-[0_0_15px_rgba(22,163,74,0.1)] outline-none transition-all"
                />
                <Mail size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Secure_Cipher</label>
              <div className="relative">
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[24px] pl-16 pr-6 h-18 text-sm font-black text-slate-900 tracking-[0.5em] placeholder:text-slate-300 focus:bg-white focus:border-green-500/50 focus:shadow-[0_0_15px_rgba(22,163,74,0.1)] outline-none transition-all"
                />
                <Lock size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 p-6 rounded-[24px] flex items-center gap-4 text-red-600 animate-in slide-in-from-top-4 duration-500">
                <ShieldCheck size={20} className="shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-widest leading-loose">{error}</p>
              </div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full h-16 md:h-20 bg-slate-900 text-white rounded-full font-black text-[11px] md:text-[13px] uppercase tracking-[0.4em] shadow-2xl shadow-slate-200 hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-4 text-white">
                   <Loader2 size={24} className="animate-spin" />
                   <span>SYNCING_NODE...</span>
                </div>
              ) : (
                <>
                  <span>INITIATE_UPLINK</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-16 flex justify-between items-center px-6">
          <div className="flex items-center gap-3">
             <Globe size={10} className="text-slate-300" />
             <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Quantum_Encryption: 256B</p>
          </div>
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
            © 2026 LOOP_Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
