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
    <div className="min-h-screen bg-gradient-to-br from-whatsapp-dark via-whatsapp-medium to-whatsapp-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-[32px] border border-whatsapp-border/50 bg-whatsapp-medium/90 backdrop-blur-sm p-8 shadow-2xl shadow-black/30">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-whatsapp-green text-slate-950 text-2xl font-bold shadow-lg shadow-black/30">
              W
            </div>
            <h1 className="text-3xl font-bold text-white">WhatsApp Admin</h1>
            <p className="mt-2 text-sm text-slate-300">Accede a tus mensajes y métricas del agente.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-3xl border border-slate-600 bg-whatsapp-light/50 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-whatsapp-green focus:outline-none focus:ring-2 focus:ring-whatsapp-green/20 transition"
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
                className="w-full rounded-3xl border border-slate-600 bg-whatsapp-light/50 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-whatsapp-green focus:outline-none focus:ring-2 focus:ring-whatsapp-green/20 transition"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-whatsapp-green px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-whatsapp-greenHover disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-black/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-r-transparent"></span>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}