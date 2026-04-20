'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Package, 
  Code2, 
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CompanySelector from './CompanySelector';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Inicio', href: '/' },
    { icon: <MessageSquare size={20} />, label: 'Chats', href: '/messages' },
    { icon: <Users size={20} />, label: 'CRM', href: '/crm' },
    { icon: <Package size={20} />, label: 'Stock', href: '/inventory' },
    { icon: <Code2 size={20} />, label: 'Studio', href: '/studio' },
  ];

  return (
    <>
      {/* MOBILE HEADER (Neural Context) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-xl px-4 py-3 flex justify-between items-center border-b border-white/5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/30 rotate-3 transform hover:rotate-0 transition-transform">
            <span className="font-black text-xs">A</span>
          </div>
          <span className="font-black text-slate-900 tracking-tighter text-base uppercase">Arise</span>
        </div>
        <div className="flex items-center gap-2">
           <CompanySelector variant="header" className="scale-90 origin-right" />
           <Link href="/users" className="w-9 h-9 bg-white/50 rounded-xl flex items-center justify-center text-slate-400 border border-white/20 shadow-sm">
             <Settings size={18} />
           </Link>
        </div>
      </div>

      {/* BOTTOM FLOATING NAV BAR */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-[28px] p-2 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform`}>
                  {item.icon}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-primary rounded-full absolute bottom-2" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

    </>
  );
}
