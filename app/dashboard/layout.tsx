'use client';

import { createClient } from '@/lib/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const menuItems = [
  { href: '/dashboard', label: 'Chats', icon: '💬' },
  { href: '/dashboard/clients', label: 'Clientes', icon: '👥' },
  { href: '/dashboard/companies', label: 'Empresas', icon: '🏢' },
  { href: '/dashboard/appointments', label: 'Agenda', icon: '📅' },
  { href: '/dashboard/requests', label: 'Solicitudes', icon: '📋' },
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
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar - Desktop only */}
      <aside
        className={`hidden md:flex transition-all duration-300 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl flex-col ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Capa 1: Logo */}
        <div className="shrink-0 px-4 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-500 text-white font-bold shadow-lg">
              A
            </span>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-base font-semibold whitespace-nowrap">
                  AriseChatbot
                </p>
                <p className="text-xs text-slate-400">Automatización Inteligente</p>
              </div>
            )}
          </div>
        </div>

        {/* Capa Navegación Desktop */}
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
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Desktop */}
        <div className="shrink-0 px-4 py-4 border-t border-slate-700/50">
          <button onClick={handleLogout} className={`flex w-full items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 active:bg-red-500/30 ${collapsed ? 'justify-center' : ''}`}>
            <span className="text-base">⏻</span>
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & NAVIGATION */}
      <div className="md:hidden flex flex-col h-full w-full overflow-hidden">
        {/* Mobile Header */}
        <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-3">
             <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">A</span>
             <h1 className="font-extrabold text-slate-900 tracking-tight">AriseChatbot</h1>
          </div>
          <button onClick={handleLogout} className="text-red-500 text-sm font-bold bg-red-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">Salir</button>
        </header>

        {/* Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto hide-scrollbar bg-slate-50 relative pb-20">
          {children}
        </main>

        {/* Bottom Navigation Bar (Thumb Friendly) */}
        <nav className="shrink-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-2 py-3 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40">
          {menuItems.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>{item.icon}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area - Desktop */}
      <main className="hidden md:block flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
