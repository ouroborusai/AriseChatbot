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
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  // Cargar estado de collapse del localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setCollapsed(JSON.parse(saved));
  }, []);

  // Guardar estado de collapse al localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
    }
  }, [collapsed, mounted]);

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

  if (!mounted) return null;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex h-full w-full">
        {/* Sidebar - Desktop only */}
      <aside
        className={`transition-all duration-300 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
          <div className="flex h-full flex-col justify-between overflow-hidden px-4 py-5">
            <div className="space-y-6 overflow-y-auto pr-1">
              {/* Logo / Brand */}
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`flex-1 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-3 backdrop-blur-sm transition-all duration-300 ${
                    collapsed ? 'justify-center' : 'justify-start'
                  }`}
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-500 text-white font-bold shadow-lg">
                    M
                  </span>
                  {!collapsed && (
                    <div className="overflow-hidden">
                      <p className="text-base font-semibold whitespace-nowrap">
                        MTZ Consultores
                      </p>
                      <p className="text-xs text-slate-400">Panel de atención</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setCollapsed(!collapsed)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm transition hover:bg-white/10 active:bg-white/20"
                  aria-label={collapsed ? 'Expandir menú' : 'Replegar menú'}
                >
                  {collapsed ? '▶' : '◀'}
                </button>
              </div>

              {/* Navegación */}
              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? 'bg-white/15 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg group-hover:bg-white/10 transition">
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Footer del sidebar */}
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className={`flex w-full items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 active:bg-red-500/30 ${
                  collapsed ? 'justify-center' : 'justify-start'
                }`}
              >
                <span className="text-base">⏻</span>
                {!collapsed && <span>Cerrar sesión</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 overflow-auto">
          <div className="page-container p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
