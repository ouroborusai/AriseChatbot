'use client';

import { createClient } from '@/lib/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const menuItems = [
  { href: '/dashboard', label: 'Chats', icon: '💬' },
  { href: '/dashboard/clients', label: 'Clientes', icon: '👥' },
  { href: '/dashboard/templates', label: 'Plantillas', icon: '📝' },
  { href: '/dashboard/metrics', label: 'Métricas', icon: '📊' },
  { href: '/dashboard/settings', label: 'Config', icon: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
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
    <div className="h-screen min-h-screen overflow-hidden bg-whatsapp-bgLight text-slate-900">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <aside className={`w-full ${collapsed ? 'lg:w-20' : 'lg:w-[280px]'} shrink-0 bg-whatsapp-sidebar text-white shadow-xl transition-all duration-300 border-r border-white/10`}>
          <div className="flex h-full min-h-0 flex-col justify-between overflow-hidden px-3 py-5 sm:px-4">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex items-center justify-between gap-3">
                <div className={`inline-flex items-center gap-3 rounded-3xl bg-whatsapp-border px-3 py-3 shadow-lg shadow-black/10 transition-all duration-300 ${collapsed ? 'justify-center w-full' : 'justify-start'}`}>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-whatsapp-sidebar font-bold">
                    W
                  </span>
                  {!collapsed && (
                    <div>
                      <p className="text-lg font-semibold">WhatsApp Hub</p>
                      <p className="text-sm text-green-100/90">Panel de mensajes</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setCollapsed(!collapsed)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp-darker text-lg transition hover:bg-whatsapp-darkest"
                  aria-label={collapsed ? 'Expandir menú' : 'Replegar menú'}
                >
                  {collapsed ? '▶' : '◀'}
                </button>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${active ? 'bg-whatsapp-border text-white shadow-inner' : 'text-white/90 hover:bg-whatsapp-border'}`}
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
                        {item.icon}
                      </span>
                      {!collapsed && item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-3 rounded-3xl bg-whatsapp-green px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-whatsapp-greenHover"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-whatsapp-sidebar">⏻</span>
                {!collapsed && 'Cerrar sesión'}
              </button>
              {!collapsed && (
                <div className="rounded-3xl bg-white/10 p-4 text-sm text-green-100">
                  <p className="font-semibold">WhatsApp</p>
                  <p className="mt-2 text-xs text-green-100/80">Aquí verás los mensajes y métricas recientes de tu agente.</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 min-h-0 overflow-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}