'use client';

import React, { useState, useEffect } from 'react';
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
  Lock,
  Building2,
  ShieldCheck,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import CompanySelector from './CompanySelector';
import Image from 'next/image';

const menuItems = [
  { name: 'Vista General', icon: LayoutDashboard, path: '/dashboard', premium: true },
  { name: 'Bóveda', icon: Lock, path: '/vault', premium: false },
  { name: 'Mensajes', icon: MessageSquare, path: '/messages', premium: true },
  { name: 'CRM Operativo', icon: Users, path: '/crm', premium: true },
  { name: 'Equipo Humano', icon: User, path: '/team', premium: true },
  { name: 'Inventario', icon: Package, path: '/inventory', premium: true },
  { name: 'Analítica', icon: BarChart3, path: '/billing', premium: true },
  { name: 'Empresa', icon: Building2, path: '/company', premium: true },
  { name: 'LOOP Studio', icon: Code2, path: '/studio', premium: true },
  { name: 'Configuración', icon: Settings, path: '/users', premium: false },
];

export default function Sidebar() {
  const { activeCompany } = useActiveCompany();
  const { user: userData } = useAuth();
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
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-100 flex flex-col p-5 pb-10 z-50 transition-all duration-500 ease-out">
      
      {/* BRANDING SECTION */}
      <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 relative rotate-3 group-hover:rotate-0 transition-all duration-700">
             <div className="absolute inset-0 bg-green-100 blur-xl rounded-full animate-pulse" />
             <Image 
               src="/brand/official.png" 
               alt="LOOP Logo" 
               width={48}
               height={48}
               className="w-full h-full object-cover rounded-xl relative z-10 shadow-sm"
             />
          </div>
          <div className="relative">
            <span className="font-black text-slate-900 tracking-tighter text-3xl leading-none block uppercase">LOOP</span>
            <span className="text-green-500 text-[9px] font-black uppercase tracking-[0.4em] block mt-2 opacity-60">INTELIGENCIA</span>
          </div>
        </div>

        {/* CUSTOM MASTER SELECTOR */}
        <div className="mb-4 relative group">
           <CompanySelector className="relative z-10" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-1 h-3 bg-green-500 rounded-full" />
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Núcleo_Operativo</p>
          </div>

          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            
            // Lógica de Bloqueo Pro (Simulada para visual)
            const isMaster = userData?.email === 'ouroborusai@gmail.com';
            const isLocked = item.premium && activeCompany?.plan_tier === 'free' && !isMaster;

            if (isLocked) {
              return (
                <div key={item.path} 
                  className="flex items-center gap-4 py-2.5 text-[11px] font-black text-slate-300 cursor-not-allowed group relative grayscale"
                >
                  <Icon size={18} />
                  <span className="tracking-widest uppercase">{item.name}</span>
                  <Lock size={12} className="ml-auto" />
                </div>
              );
            }

            return (
              <Link key={item.path} href={item.path}
                className={`flex items-center gap-4 py-2.5 text-[11px] font-black transition-all duration-500 group relative ${
                  isActive 
                    ? 'text-green-600' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isActive && <div className="absolute -left-5 w-1 h-4 bg-green-500 rounded-r-full" />}
                <Icon size={18} className={`transition-all duration-500 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                <span className="tracking-widest uppercase">{item.name}</span>
              </Link>
            );
          })}
          
        {/* BANNER UPGRADE PRO - OPTIMIZED */}
        {activeCompany?.plan_tier === 'free' && (
          <div className="mt-6 py-5 relative group">
             <div className="relative z-10">
               <p className="text-[9px] font-black text-green-500 uppercase tracking-[0.4em] mb-2">PROTOCOLO_ELITE</p>
               <p className="text-slate-400 text-[9px] font-bold leading-relaxed mb-4 uppercase tracking-tight">Desbloquea Funciones Neurales.</p>
               <button 
                 onClick={handleUpgrade}
                 className="py-2.5 px-4 bg-slate-50 text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-green-500 hover:text-white transition-all w-fit"
               >
                  Activar PRO
               </button>
             </div>
          </div>
        )}
      </nav>

      {/* USER PROFILE SECTION */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 bg-transparent text-slate-400 flex items-center justify-center relative shrink-0">
             <Fingerprint size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-slate-900 leading-none truncate uppercase">{userData?.email?.split('@')[0] || 'Operador'}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] truncate mt-1">
              <span className="text-green-500/70">SYNC:</span> OK
            </p>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 py-2.5 text-slate-500 hover:text-red-500 text-[9px] font-black uppercase tracking-[0.2em] transition-all group"
        >
          <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

function ArrowRight({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
