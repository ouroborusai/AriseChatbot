import React from 'react';
import Link from 'next/link';

const menuItems = [
  { name: 'Dashboard', icon: '🧠', path: '/' },
  { name: 'CRM', icon: '👤', path: '/crm' },
  { name: 'Inventory', icon: '📦', path: '/inventory' },
  { name: 'Billing', icon: '📄', path: '/billing' },
  { name: 'Team', icon: '👥', path: '/team' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen sidebar-container flex flex-col p-6 fixed left-0 top-0 z-50">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-8 h-8 btn-primary flex items-center justify-center p-0 rounded-base shadow-micro-glow">
          <span className="text-[10px]">O</span>
        </div>
        <span className="font-bold text-slate-900 tracking-tighter text-lg uppercase">Ouroborus</span>
      </div>

      <nav className="flex-1 space-y-1">
        <p className="readout-label mb-4 pl-4 opacity-50">System Core</p>
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-base text-xs font-bold text-slate-500 hover:bg-surface-work hover:text-primary transition-all duration-300 group shadow-none hover:shadow-soft-depth"
          >
            <span className="text-sm group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="tracking-tight uppercase">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto p-5 bg-white/40 rounded-base glass-panel border-none shadow-soft-depth">
        <div className="flex items-center gap-2 mb-3">
          <div className="status-dot bg-emerald-500" />
          <span className="readout-label text-[8px]">Neural Sync: ACTIVE</span>
        </div>
        <p className="text-[9px] text-slate-500 font-bold leading-tight opacity-70">
          Running Diamond v6.1 Elite. System operational.
        </p>
      </div>
    </aside>
  );
}
