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
    <div className="p-8 flex items-center justify-between border-b border-white bg-white/40 backdrop-blur-xl z-20 shadow-sm">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-white border border-white rounded-[22px] flex items-center justify-center text-slate-900 text-xl font-black shadow-lg italic">
          {selectedConv.contacts?.full_name?.[0] || 'D'}
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
            {selectedConv.contacts?.full_name || 'CONTACTO_DESCONOCIDO'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse shadow-[0_0_8px_#25D366]" />
            <span className="text-[9px] font-black text-[#25D366] uppercase tracking-[0.2em]">Enlace_Activo</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => onToggleHandoff(selectedConv)}
          className={`flex items-center gap-3 px-6 py-3 rounded-[20px] font-black transition-all shadow-xl ${
            selectedConv.status === 'waiting_human'
              ? 'bg-rose-500 text-white shadow-rose-500/20'
              : 'bg-[#25D366] text-white shadow-[#25D366]/20'
          }`}
        >
          <Power className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-widest italic">
            {selectedConv.status === 'waiting_human' ? 'Control_Manual' : 'Neural_Link'}
          </span>
        </button>
        <button className="p-3 hover:bg-white rounded-[15px] transition-all text-slate-300 hover:text-slate-900 shadow-sm border border-transparent hover:border-white">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
