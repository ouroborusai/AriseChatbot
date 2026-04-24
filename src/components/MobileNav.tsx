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

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Inicio', href: '/dashboard' },
    { icon: <MessageSquare size={20} />, label: 'Chats', href: '/messages' },
    { icon: <Users size={20} />, label: 'CRM', href: '/crm' },
    { icon: <Package size={20} />, label: 'Stock', href: '/inventory' },
    { icon: <Code2 size={20} />, label: 'Studio', href: '/studio' },
  ];

  return (
    <>
      {/* MOBILE HEADER (Neural Context) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#010409]/80 backdrop-blur-2xl px-6 py-4 flex justify-between items-center border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative rotate-3 group-hover:rotate-0 transition-transform">
             <div className="absolute inset-0 bg-green-500/10 blur-lg rounded-full" />
             <Image 
               src="/brand/official.png" 
               alt="LOOP Logo" 
               width={40}
               height={40}
               className="w-full h-full object-cover rounded-xl shadow-2xl relative z-10"
             />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white tracking-tighter text-sm uppercase italic">LOOP</span>
            <span className="text-green-500 text-[8px] font-black uppercase tracking-[0.2em] leading-none">NEURAL_OS</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <CompanySelector variant="header" className="scale-90 origin-right" />
           <Link href="/users" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 border border-white/5 shadow-inner">
             <Settings size={18} />
           </Link>
        </div>
      </div>

      {/* BOTTOM FLOATING NAV BAR */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm">
        <div className="bg-[#020617]/90 backdrop-blur-3xl rounded-[32px] p-2.5 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
          
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all duration-500 relative ${
                  isActive ? 'text-green-500' : 'text-slate-600 hover:text-white'
                }`}
              >
                <div className={`${isActive ? 'scale-110 -translate-y-1' : 'scale-100'} transition-all duration-500`}>
                  {item.icon}
                </div>
                <span className={`text-[7px] font-black uppercase tracking-[0.2em] transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_12px_#22c55e] animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

    </>
  );
}
