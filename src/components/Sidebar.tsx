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
    <aside className="fixed left-0 top-0 h-full w-72 bg-[#010409] border-r border-white/5 flex flex-col p-8 z-50 transition-all duration-500 ease-out shadow-[10px_0_50px_rgba(0,0,0,0.3)]">
      
      {/* BRANDING SECTION */}
      <div className="flex items-center gap-6 mb-16 px-2">
          <div className="w-14 h-14 relative rotate-3 group-hover:rotate-0 transition-all duration-700">
             <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
             <Image 
               src="/brand/official.png" 
               alt="LOOP Logo" 
               width={56}
               height={56}
               className="w-full h-full object-cover rounded-2xl shadow-2xl relative z-10"
             />
          </div>
          <div className="relative">
            <span className="font-black text-white tracking-tighter text-3xl leading-none block italic uppercase">LOOP</span>
            <span className="text-green-500 text-[9px] font-black uppercase tracking-[0.4em] block mt-2 opacity-60">INTELIGENCIA</span>
          </div>
        </div>

        {/* CUSTOM MASTER SELECTOR */}
        <div className="mb-12 relative group">
           <div className="absolute inset-0 bg-green-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
           <CompanySelector className="relative z-10" />
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
          <div className="flex items-center gap-3 mb-6 px-2">
             <div className="w-1 h-3 bg-green-500 rounded-full" />
             <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Núcleo_Operativo</p>
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
                  className="flex items-center gap-5 px-5 py-4 rounded-[22px] text-[11px] font-black text-slate-700 cursor-not-allowed group relative opacity-40 grayscale"
                >
                  <Icon size={18} />
                  <span className="tracking-widest uppercase italic">{item.name}</span>
                  <Lock size={12} className="ml-auto" />
                </div>
              );
            }

            return (
              <Link key={item.path} href={item.path}
                className={`flex items-center gap-5 px-5 py-4 rounded-[22px] text-[11px] font-black transition-all duration-500 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-[0_20px_40px_rgba(255,255,255,0.1)] scale-[1.02]' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && <div className="absolute left-0 w-1.5 h-6 bg-green-500 rounded-full -ml-0.5" />}
                <Icon size={18} className={`transition-all duration-500 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                <span className="tracking-widest uppercase italic">{item.name}</span>
                {isActive && <ArrowRight size={14} className="ml-auto animate-in slide-in-from-left-2 duration-500" />}
              </Link>
            );
          })}
          
        {/* BANNER UPGRADE PRO - OPTIMIZED */}
        {activeCompany?.plan_tier === 'free' && (
          <div className="mt-12 p-8 bg-white/5 border border-white/5 rounded-[32px] relative overflow-hidden group shadow-xl backdrop-blur-md">
             <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-2xl rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" />
             <div className="relative z-10">
               <p className="text-[9px] font-black text-green-500 uppercase tracking-[0.4em] mb-3 italic">PROTOCOLO_ELITE</p>
               <p className="text-white text-[10px] font-black leading-relaxed mb-6 uppercase tracking-tight">Desbloquea Dashboard y Mensajería Neural.</p>
               <button 
                 onClick={handleUpgrade}
                 className="w-full py-4 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-green-500 hover:text-white active:scale-95 transition-all shadow-2xl"
               >
                  Activar PRO
               </button>
             </div>
             <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          </div>
        )}
      </nav>

      {/* USER PROFILE SECTION */}
      <div className="mt-auto pt-10 border-t border-white/5">
        <div className="flex items-center gap-5 px-2 mb-8">
          <div className="w-14 h-14 bg-white/5 text-slate-600 rounded-[22px] flex items-center justify-center border border-white/5 shadow-2xl relative shrink-0">
             <Fingerprint size={24} />
             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#010409] shadow-[0_0_10px_#22c55e]" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[12px] font-black text-white leading-none truncate uppercase italic">{userData?.email?.split('@')[0] || 'Operador'}</p>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] truncate mt-2">
              <span className="text-green-500/70">SYNC_STATUS:</span> OK
            </p>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-4 py-4.5 bg-white/5 border border-white/5 hover:bg-red-500 hover:text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] transition-all group shadow-xl"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
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
