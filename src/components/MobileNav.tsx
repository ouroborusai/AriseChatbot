'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Package, 
  Code2, 
  Settings,
  Zap,
  Cpu
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CompanySelector from './CompanySelector';
import Image from 'next/image';
import { useMobileNav } from '@/contexts/MobileNavContext';

export default function MobileNav() {
  const pathname = usePathname();
  const { isVisible } = useMobileNav();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Inicio', href: '/dashboard' },
    { icon: <MessageSquare size={20} />, label: 'Chats', href: '/messages' },
    { icon: <Users size={20} />, label: 'CRM', href: '/crm' },
    { icon: <Package size={20} />, label: 'Stock', href: '/inventory' },
    { icon: <Zap size={20} />, label: 'Meta', href: '/meta' },
  ];

  return (
    <>
      {/* MOBILE HEADER (Neural Context) */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl px-6 py-4 flex justify-between items-center border-b border-slate-100 shadow-sm transition-all duration-500 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative rotate-3 group-hover:rotate-0 transition-transform">
             <div className="absolute inset-0 bg-green-100 blur-lg rounded-full" />
             <Image 
               src="/brand/arise-logo.png" 
               alt="ARISE Logo" 
               width={40}
               height={40}
               className="w-full h-full object-cover rounded-xl shadow-2xl relative z-10"
             />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 tracking-tighter text-sm uppercase italic">ARISE</span>
            <span className="text-green-500 text-[8px] font-black uppercase tracking-[0.2em] leading-none">NEURAL_OS</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <CompanySelector variant="header" className="scale-90 origin-right" />
           <Link href="/users" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm hover:text-slate-900 transition-colors">
             <Settings size={18} />
           </Link>
        </div>
      </div>

      {/* BOTTOM FLOATING NAV BAR */}
      <nav 
        className={`lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-sm transition-all duration-500 ease-in-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-3xl rounded-[32px] p-2 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-white relative overflow-hidden group">
          {/* Luminous Glow Track */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#22c55e]/40 to-transparent" />
          
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-[24px] transition-all duration-500 relative flex-1 ${
                  isActive ? 'text-[#22c55e]' : 'text-slate-400'
                }`}
              >
                <div className={`${isActive ? 'scale-110 -translate-y-1' : 'scale-100 opacity-60'} transition-all duration-700 ease-out`}>
                   {React.cloneElement(item.icon as React.ReactElement, { 
                     strokeWidth: isActive ? 2.5 : 1.5,
                     size: 22 
                   } as any)}
                </div>
                <span className={`text-[7px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 h-0 overflow-hidden'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute inset-0 bg-[#22c55e]/5 rounded-[24px] z-0 animate-in fade-in zoom-in-95 duration-500" />
                )}
                {isActive && (
                  <div className="absolute -bottom-0.5 w-1 h-1 bg-[#22c55e] rounded-full shadow-[0_0_15px_#22c55e]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

    </>
  );
}
