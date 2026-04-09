'use client';

import { createClient } from '@/lib/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const menuItems = [
  { href: '/dashboard', label: 'Chats', icon: '💬' },
  { href: '/dashboard/clients', label: 'Clientes', icon: '👥' },
  { href: '/dashboard/companies', label: 'Empresas', icon: '🏢' },
  { href: '/dashboard/documents', label: 'Documentos', icon: '📁' },
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
        className={`transition-all duration-300 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl flex flex-col ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Capa 1: Logo - Altura fija */}
        <div className="shrink-0 px-4 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
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
        </div>

        {/* Botón collapse - Separado */}
        <div className="shrink-0 px-2 py-2 border-b border-slate-700/30">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition ${
              collapsed ? 'justify-center' : 'justify-end'
            }`}
            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            <span className={`text-xs transition-transform ${collapsed ? '' : 'rotate-180'}`}>
              {collapsed ? '▶' : '◀'}
            </span>
            {!collapsed && <span className="text-xs">Contraer</span>}
          </button>
        </div>

        {/* Capa 2: Navegación - Crece y ocupa espacio disponible */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
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

        {/* Capa 3: Botón logout - Altura fija */}
        <div className="shrink-0 px-4 py-4 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 active:bg-red-500/30 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <span className="text-base">⏻</span>
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

        {/* Contenido Principal */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
