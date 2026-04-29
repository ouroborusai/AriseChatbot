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
    <div className="p-2 lg:p-4 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md z-20 shadow-sm min-h-[64px]">
      <div className="flex items-center gap-2 lg:gap-4 overflow-hidden">
        {onBack && (
          <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-1 hover:bg-slate-50 rounded-lg transition-all text-slate-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#0f172a] rounded-lg lg:rounded-xl flex items-center justify-center text-white text-[10px] lg:text-[12px] font-black shadow-lg shadow-[#0f172a]/10 relative shrink-0">
          <span className="relative z-10">{selectedConv.contacts?.full_name?.[0] || 'D'}</span>
        </div>

        <div className="flex flex-col gap-0.5 overflow-hidden">
          <div className="flex items-center gap-1.5 lg:gap-2">
            <h2 className="text-[10px] lg:text-[12px] font-black tracking-tighter text-slate-900 uppercase truncate">
              {selectedConv.contacts?.full_name || 'CONTACTO'}
            </h2>
            <div className="hidden sm:block px-1.5 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-[6px] font-black rounded uppercase tracking-widest border border-[#22c55e]/10">
              Verificado
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="hidden lg:block text-[7px] font-bold text-slate-400 font-mono tracking-widest">
               {selectedConv.contacts?.phone || 'NO_LINK'}
             </span>
             <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-[#22c55e] rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
                <span className="text-[6px] lg:text-[7px] font-black text-[#22c55e] uppercase tracking-widest">Sincronizado</span>
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 lg:gap-2 shrink-0">
        <button
          onClick={() => onToggleHandoff(selectedConv)}
          className={`flex items-center gap-1.5 px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg font-black transition-all shadow-sm ${
            selectedConv.status === 'waiting_human'
              ? 'bg-rose-500 text-white shadow-rose-500/10'
              : 'bg-slate-50 text-slate-900 hover:bg-[#22c55e] hover:text-white border border-slate-100'
          }`}
        >
          <Power className="w-3 h-3" />
          <span className="text-[6px] lg:text-[8px] uppercase tracking-widest">
            {selectedConv.status === 'waiting_human' ? 'Manual' : 'Neural'}
          </span>
        </button>
        <button className="p-1.5 lg:p-2 hover:bg-slate-50 rounded-lg text-slate-200 hover:text-slate-900">
          <MoreVertical className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
        </button>
      </div>
    </div>
  );
}
