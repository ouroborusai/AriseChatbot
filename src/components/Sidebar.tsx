'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Package,
  BarChart3,
  Code2,
  Settings,
  Zap,
  LogOut,
  User,
  Lock
} from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import CompanySelector from './CompanySelector';

const menuItems = [
  { name: 'Vista General', icon: LayoutDashboard, path: '/dashboard', premium: true },
  { name: 'Bóveda', icon: User, path: '/vault', premium: false },
  { name: 'Mensajes', icon: MessageSquare, path: '/messages', premium: true },
  { name: 'CRM (Pagos)', icon: Users, path: '/crm', premium: true },
  { name: 'Equipo', icon: Users, path: '/team', premium: true },
  { name: 'Inventario', icon: Package, path: '/inventory', premium: true },
  { name: 'Analítica', icon: BarChart3, path: '/billing', premium: true },
  { name: 'Empresa', icon: Settings, path: '/company', premium: true },
  { name: 'LOOP Studio', icon: Code2, path: '/studio', premium: true },
  { name: 'Configuración', icon: Settings, path: '/users', premium: false },
];

export default function Sidebar() {
  const { activeCompany, setActiveCompany } = useActiveCompany();
  const { user: userData, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string>('viewer');

  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: activeCompany?.id,
          companyName: activeCompany?.name,
          userEmail: userData?.email
        })
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (error) {
      console.error('Error al iniciar pago:', error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-50 flex flex-col p-6 md:p-8 z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
      <div className="flex items-center gap-4 mb-10 md:mb-12 px-2">
          <div className="w-12 h-12 relative rotate-3 transform hover:rotate-0 transition-all duration-500">
             <img 
               src="/brand/official.png" 
               alt="LOOP Logo" 
               className="w-full h-full object-cover rounded-2xl shadow-lg shadow-green-100"
             />
          </div>
          <div>
            <span className="font-black text-slate-800 tracking-tighter text-2xl leading-none block">LOOP</span>
            <span className="text-green-600 text-[10px] font-black uppercase tracking-[0.3em] block mt-1">INTELIGENCIA</span>
          </div>
        </div>

        {/* CUSTOM MASTER SELECTOR v6.22 */}
        <CompanySelector className="mb-10" />

        <nav className="flex-1 space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2 tracking-[0.2em]">Núcleo del Sistema</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            
            // Lógica de Bloqueo Pro
            const isMaster = userData?.email === 'ouroborusai@gmail.com';
            const isLocked = item.premium && activeCompany?.plan_tier === 'free' && !isMaster;

            if (isLocked) {
              return (
                <div key={item.path} 
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black text-slate-300 cursor-not-allowed group relative"
                  title="Módulo PRO - Requiere Suscripción"
                >
                  <Icon size={18} className="opacity-40" />
                  <span className="tracking-tight">{item.name}</span>
                  <Lock size={12} className="ml-auto text-slate-300 animate-pulse" />
                </div>
              );
            }

            return (
              <Link key={item.path} href={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black transition-all group ${
                  isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                }`}
              >
                <Icon size={18} className={`transition-all ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                <span className="tracking-tight">{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-glow" />}
              </Link>
            );
          })}
          
        {/* BANNER UPGRADE PRO */}
        {activeCompany?.plan_tier === 'free' && (
          <div className="mt-8 p-6 bg-gradient-to-br from-green-600 to-green-900 rounded-3xl shadow-xl shadow-green-100 relative overflow-hidden group">
             <div className="relative z-10">
               <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-2">PLAN PRO LOOP</p>
               <p className="text-white text-xs font-black leading-tight mb-4">Desbloquea Dashboard, Mensajes y más.</p>
               <button 
                 onClick={handleUpgrade}
                 className="w-full py-2.5 bg-white text-green-700 text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
               >
                  Actualizar Ahora
               </button>
             </div>
             <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          </div>
        )}
      </nav>

      <div className="mt-auto pt-8 border-t border-slate-50">
        <div className="flex items-center gap-4 px-2 mb-6">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm relative shrink-0">
             <User size={20} />
             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-slate-800 leading-none truncate">{userData?.email?.split('@')[0] || 'Operador LOOP'}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate mt-1">
              {userRole === 'admin' ? 'Administrador Global' : userRole.toUpperCase()}
            </p>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all group shadow-sm hover:shadow-red-100/50"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
      </aside>
  );
}
