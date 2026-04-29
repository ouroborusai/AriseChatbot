'use client';

import React from 'react';
import { Power, MoreVertical, ArrowLeft } from 'lucide-react';

interface Contact {
  full_name: string | null;
  phone: string | null;
}

interface Conversation {
  id: string;
  status: 'new' | 'open' | 'waiting_human' | 'closed';
  updated_at: string;
  company_id: string;
  contact_id: string;
  contacts?: Contact;
}

interface ChatHeaderProps {
  selectedConv: Conversation;
  onToggleHandoff: (conv: Conversation) => void;
  onBack?: () => void;
}

export function ChatHeader({ selectedConv, onToggleHandoff, onBack }: ChatHeaderProps) {
  return (
    <div className="p-6 lg:p-8 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-2xl z-20 shadow-sm min-h-[80px]">
      <div className="flex items-center gap-4 lg:gap-6 overflow-hidden">
        {onBack && (
          <button 
            onClick={onBack}
            className="md:hidden p-3 -ml-2 hover:bg-slate-50 rounded-md transition-all text-slate-400"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        
        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-accent rounded-xl flex items-center justify-center text-white text-[12px] lg:text-[14px] font-black shadow-xl shadow-accent/10 relative shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 animate-pulse" />
          <span className="relative z-10">{selectedConv.contacts?.full_name?.[0] || 'D'}</span>
        </div>

        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-3 lg:gap-4">
            <h2 className="text-[12px] lg:text-[14px] font-black tracking-tighter text-neural-dark uppercase truncate italic">
              {selectedConv.contacts?.full_name || 'CONTACTO_DESCONOCIDO'}
            </h2>
            <div className="hidden sm:block px-3 py-1 bg-primary/10 text-primary text-[7px] font-black rounded-sm uppercase tracking-widest border border-primary/10 italic">
              VERIFICADO
            </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="hidden lg:block text-[8px] font-black text-slate-400 font-mono tracking-widest opacity-60">
               {selectedConv.contacts?.phone || 'NO_LINK'}
             </span>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                <span className="text-[8px] lg:text-[9px] font-black text-primary uppercase tracking-widest">Sincronización_Activa</span>
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-4 shrink-0">
        <button
          onClick={() => onToggleHandoff(selectedConv)}
          className={`flex items-center gap-3 px-5 lg:px-8 py-2.5 lg:py-3 rounded-sm font-black transition-all shadow-xl ${
            selectedConv.status === 'waiting_human'
              ? 'bg-rose-500 text-white shadow-rose-500/20'
              : 'bg-slate-900 text-white hover:bg-primary transition-all border border-slate-900'
          }`}
        >
          <Power className="w-4 h-4" />
          <span className="text-[8px] lg:text-[10px] uppercase tracking-[0.3em]">
            {selectedConv.status === 'waiting_human' ? 'Manual' : 'Neural'}
          </span>
        </button>
        <button className="p-2.5 lg:p-3 hover:bg-slate-50 rounded-md text-slate-200 hover:text-neural-dark transition-colors">
          <MoreVertical className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>
      </div>
    </div>
  );
}
