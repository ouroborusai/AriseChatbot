'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e5ddd5] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-full max-w-xs shrink-0 bg-[#075E54] text-white shadow-xl">
          <div className="flex h-full flex-col justify-between px-6 py-8">
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 rounded-3xl bg-[#128C7E] px-4 py-3 shadow-lg shadow-black/10">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#075E54] font-bold">
                    W
                  </span>
                  <div>
                    <p className="text-lg font-semibold">WhatsApp Hub</p>
                    <p className="text-sm text-green-100/90">Panel de mensajes</p>
                  </div>
                </div>
              </div>

              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="block rounded-3xl px-4 py-3 text-sm font-medium transition hover:bg-[#128C7E]"
                >
                  Mensajes
                </Link>
                <Link
                  href="/dashboard/metrics"
                  className="block rounded-3xl px-4 py-3 text-sm font-medium transition hover:bg-[#128C7E]"
                >
                  Métricas
                </Link>
              </nav>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className="w-full rounded-3xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#1ebd58]"
              >
                Cerrar sesión
              </button>
              <div className="rounded-3xl bg-white/10 p-4 text-sm text-green-100">
                <p className="font-semibold">WhatsApp</p>
                <p className="mt-2 text-xs text-green-100/80">Aquí verás los mensajes y métricas recientes de tu agente.</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}