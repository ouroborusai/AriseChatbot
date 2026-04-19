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

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'ERR_CRITICAL: Access protocol breach.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090d] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-primary selection:text-white">
      {/* Neural Static Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      {/* Atmospheric Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-[480px] z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center mb-16">
          <div className="w-20 h-20 bg-primary rounded-[28px] flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] mb-10 group cursor-pointer transition-all hover:scale-110">
            <Zap size={40} className="text-white fill-white group-hover:animate-bolt" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-widest leading-none italic uppercase mb-4">Arise</h1>
          <div className="flex items-center gap-3">
             <Activity size={10} className="text-primary" />
             <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.6em]">Neural_Business_OS / v7.0</p>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[48px] p-12 border border-white/[0.05] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30" />
          
          <div className="mb-12">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">ACCESS_PROTOCOL</h2>
            <p className="text-[10px] font-black text-slate-500 mt-3 uppercase tracking-[0.3em]">Credentials required for neural uplink</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-10">
            <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Operator_ID</label>
              <div className="relative">
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@unit.arise" 
                  className="w-full bg-white/[0.05] border border-white/5 rounded-[24px] pl-16 pr-6 h-18 text-sm font-black text-white uppercase tracking-widest placeholder:text-slate-700 focus:bg-white/[0.08] focus:border-primary/30 outline-none transition-all shadow-inner"
                />
                <Mail size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 transition-colors" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Secure_Cipher</label>
              <div className="relative">
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-white/[0.05] border border-white/5 rounded-[24px] pl-16 pr-6 h-18 text-sm font-black text-white tracking-[0.5em] placeholder:text-slate-700 focus:bg-white/[0.08] focus:border-primary/30 outline-none transition-all shadow-inner"
                />
                <Lock size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 transition-colors" />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[24px] flex items-center gap-4 text-red-400 animate-in slide-in-from-top-4 duration-500">
                <ShieldCheck size={20} className="shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-widest leading-loose">{error}</p>
              </div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full h-20 bg-primary text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-4">
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
             <Globe size={10} className="text-slate-700" />
             <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Quantum_Encryption: 256B</p>
          </div>
          <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">
            © 2026 Arise_Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
