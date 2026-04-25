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
  Fingerprint,
  Home
} from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import CompanySelector from './CompanySelector';
import Image from 'next/image';

const menuItems = [
  { name: 'Vista General', icon: LayoutDashboard, path: '/dashboard', premium: true },
  { name: 'Bóveda', icon: Lock, path: '/vault', premium: false },
  { name: 'Mensajes', icon: MessageSquare, path: '/messages', premium: true },
  { name: 'CRM Neural', icon: Users, path: '/crm', premium: true },
  { name: 'Equipo Humano', icon: User, path: '/team', premium: true },
  { name: 'Inventario', icon: Package, path: '/inventory', premium: true },
  { name: 'Analítica', icon: BarChart3, path: '/billing', premium: true },
  { name: 'Empresa', icon: Building2, path: '/company', premium: true },
  { name: 'LOOP Studio', icon: Code2, path: '/studio', premium: true },
  { name: 'Control de Acceso Neural', icon: ShieldCheck, path: '/users', premium: false },
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
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-100 flex flex-col p-5 pb-10 z-50 transition-all duration-500 ease-out shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      
      {/* HOME / LANDING HOOK */}
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-[#22c55e] hover:border-[#22c55e]/20 transition-all group">
          <Home size={14} className="group-hover:scale-110 transition-transform" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em]">Volver al Inicio</span>
        </Link>
      </div>

      {/* BRANDING SECTION */}
      <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 relative group-hover:scale-105 transition-all duration-700">
             <div className="absolute inset-0 bg-[#22c55e]/10 blur-xl rounded-full" />
             <Image 
               src="/brand/official.png" 
               alt="LOOP Logo" 
               width={40}
               height={40}
               className="w-full h-full object-cover rounded-lg relative z-10 shadow-sm"
             />
          </div>
          <div className="relative">
            <span className="font-black text-slate-900 tracking-tighter text-2xl leading-none block uppercase">LOOP</span>
            <span className="text-[#22c55e] text-[8px] font-black uppercase tracking-[0.4em] block mt-1">INTELIGENCIA</span>
          </div>
        </div>

        {/* CUSTOM MASTER SELECTOR */}
        <div className="mb-6 relative group">
           <CompanySelector className="relative z-10" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1 h-3 bg-[#22c55e] rounded-full" />
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Núcleo_Operativo</p>
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
                  className="flex items-center gap-4 px-4 py-2.5 text-[10px] font-black text-slate-300 cursor-not-allowed group relative grayscale"
                >
                  <Icon size={16} />
                  <span className="tracking-widest uppercase">{item.name}</span>
                  <Lock size={10} className="ml-auto" />
                </div>
              );
            }

            return (
              <Link key={item.path} href={item.path}
                className={`flex items-center gap-4 px-4 py-2.5 text-[10px] font-black transition-all duration-300 group relative rounded-xl ${
                  isActive 
                    ? 'bg-[#22c55e] text-white shadow-lg shadow-[#22c55e]/20' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} className={`transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                <span className="tracking-widest uppercase">{item.name}</span>
              </Link>
            );
          })}
          
        {/* BANNER UPGRADE PRO - OPTIMIZED */}
        {activeCompany?.plan_tier === 'free' && (
          <div className="mt-8 mx-2 p-5 bg-[#22c55e]/5 rounded-2xl border border-[#22c55e]/10 relative group overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-[#22c55e]/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
             <div className="relative z-10">
               <p className="text-[8px] font-black text-[#22c55e] uppercase tracking-[0.4em] mb-2">PROTOCOLO_ELITE</p>
               <p className="text-slate-600 text-[8px] font-bold leading-relaxed mb-4 uppercase tracking-tight">Desbloquea Funciones Neurales.</p>
               <button 
                 onClick={handleUpgrade}
                 className="py-2 px-4 bg-[#0f172a] text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-[#22c55e] transition-all w-full shadow-sm"
               >
                  Activar PRO
               </button>
             </div>
          </div>
        )}
      </nav>

      {/* USER PROFILE SECTION */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex items-center gap-4 mb-2 px-2">
          <div className="w-8 h-8 bg-slate-50 rounded-lg text-slate-400 flex items-center justify-center relative shrink-0 border border-slate-100">
             <Fingerprint size={16} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-slate-900 leading-none truncate uppercase">{userData?.email?.split('@')[0] || 'Operador'}</p>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] truncate mt-1">
              <span className="text-[#22c55e]/70">SYNC:</span> OK
            </p>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-rose-500 text-[8px] font-black uppercase tracking-[0.2em] transition-all group rounded-lg hover:bg-rose-50"
        >
          <LogOut size={12} className="group-hover:-translate-x-1 transition-transform" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
