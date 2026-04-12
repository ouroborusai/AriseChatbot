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
      
      {/* Sidebar - Desktop only (MD and UP) */}
      <aside
        className={`hidden md:flex transition-all duration-300 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl flex-col shrink-0 ${
          collapsed ? 'w-20' : 'w-64 lg:w-72'
        }`}
      >
        {/* Logo Section */}
        <div className="shrink-0 px-4 py-5 lg:px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 lg:h-11 lg:w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/20">
              A
            </span>
            {!collapsed && (
              <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                <p className="text-sm lg:text-base font-black tracking-tight whitespace-nowrap">
                  AriseChatbot
                </p>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Neural Engine</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Desktop */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1 lg:space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 lg:py-3 text-sm font-black transition-all ${
                  active
                    ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className={`inline-flex shrink-0 items-center justify-center rounded-xl text-lg transition-all duration-300 ${active ? 'h-9 w-9 bg-indigo-500 shadow-lg shadow-indigo-500/20' : 'h-8 w-8 bg-white/5 group-hover:bg-white/10'}`}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate tracking-tight">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Desktop */}
        <div className="shrink-0 px-4 py-6 border-t border-white/5">
          <button onClick={handleLogout} className={`flex w-full items-center gap-3 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all ${collapsed ? 'justify-center' : ''}`}>
            <span className="text-base">⏻</span>
            {!collapsed && <span className="tracking-tight">Finalizar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE INTERFACE (UP TO MD) */}
      <div className="md:hidden flex flex-col h-full w-full overflow-hidden">
        {/* Mobile Header - Ultra Clean */}
        <header className="shrink-0 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-5 h-16 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-2.5">
             <span className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-900 text-white font-black text-sm shadow-lg shadow-slate-200">A</span>
             <h1 className="font-black text-slate-900 tracking-tighter text-lg uppercase">Arise<span className="text-indigo-600">Bot</span></h1>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center h-10 w-10 bg-rose-50 text-rose-500 rounded-xl active:scale-90 transition-transform shadow-sm"
            title="Salir"
          >
            ⏻
          </button>
        </header>

        {/* Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative pb-24">
          {children}
        </main>

        {/* Bottom Navigation Bar - Solid Industrial Design */}
        <nav className="shrink-0 bg-white border-t border-slate-200 h-20 flex items-center justify-around px-2 z-50 pb-safe">
          {menuItems.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                  active ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl">
                    {item.icon}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    active ? 'opacity-100' : 'opacity-40'
                  }`}>
                    {item.label}
                  </span>
                </div>
                {active && (
                   <span className="absolute bottom-0 h-1 w-12 bg-indigo-600 rounded-t-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area - Desktop (MD and UP) */}
      <main className="hidden md:block flex-1 overflow-hidden relative">
        <div className="h-full w-full overflow-y-auto scroll-smooth custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
