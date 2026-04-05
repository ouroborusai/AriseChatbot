'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d2f26] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-[32px] border border-[#128C7E] bg-[#0f4336]/95 p-8 shadow-2xl shadow-black/20">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-slate-950 text-2xl font-bold shadow-lg shadow-black/20">
              W
            </div>
            <h1 className="text-3xl font-bold text-white">WhatsApp Admin</h1>
            <p className="mt-2 text-sm text-slate-200">Accede a tus mensajes y métricas del agente.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-3xl border border-slate-700 bg-[#122f28] px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-[#25D366] focus:outline-none"
                autoComplete="email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-3xl border border-slate-700 bg-[#122f28] px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-[#25D366] focus:outline-none"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#1ebd58] disabled:opacity-60"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}