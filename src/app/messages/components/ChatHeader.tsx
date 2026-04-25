'use client';

import React from 'react';
import { Power, MoreVertical } from 'lucide-react';

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
}

export function ChatHeader({ selectedConv, onToggleHandoff }: ChatHeaderProps) {
  return (
    <div className="p-3 lg:p-4 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center text-white text-[12px] font-black shadow-lg shadow-[#0f172a]/10 relative group">
          <div className="absolute inset-0 bg-[#22c55e]/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
          <span className="relative z-10">{selectedConv.contacts?.full_name?.[0] || 'D'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[12px] font-black tracking-tighter text-slate-900 uppercase">
              {selectedConv.contacts?.full_name || 'CONTACTO_DESCONOCIDO'}
            </h2>
            <div className="px-1.5 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-[6px] font-black rounded uppercase tracking-widest border border-[#22c55e]/10">
              Nodo_Verificado
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[7px] font-bold text-slate-400 font-mono tracking-widest">
               {selectedConv.contacts?.phone || 'NO_PHONE_LINKED'}
             </span>
             <span className="text-slate-100 text-[8px]">|</span>
             <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-[#22c55e] rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
                <span className="text-[7px] font-black text-[#22c55e] uppercase tracking-[0.2em]">Sincronizado</span>
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleHandoff(selectedConv)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black transition-all shadow-sm ${
            selectedConv.status === 'waiting_human'
              ? 'bg-rose-500 text-white shadow-rose-500/10'
              : 'bg-slate-50 text-slate-900 hover:bg-[#22c55e] hover:text-white border border-slate-100'
          }`}
        >
          <Power className="w-3 h-3" />
          <span className="text-[8px] uppercase tracking-widest">
            {selectedConv.status === 'waiting_human' ? 'Control_Manual' : 'Neural_Link'}
          </span>
        </button>
        <button className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-200 hover:text-slate-900 border border-transparent hover:border-slate-100">
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
