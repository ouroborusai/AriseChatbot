'use client';

import React from 'react';
import { Power, MoreVertical, ArrowLeft, Zap } from 'lucide-react';
import type { Conversation, Contact } from '@/types/database';

export type ChatHeaderConvType = Conversation & { contacts?: Pick<Contact, 'full_name' | 'phone'> | null };

interface ChatHeaderProps {
  selectedConv: ChatHeaderConvType;
  onToggleHandoff?: () => void;
  onBack?: () => void;
}

export function ChatHeader({ selectedConv, onToggleHandoff, onBack }: ChatHeaderProps) {
  return (
    <header className="p-8 lg:p-10 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-3xl shrink-0 z-20">
      <div className="flex items-center gap-6">
        {onBack && (
          <button 
            onClick={onBack} 
            className="lg:hidden p-4 bg-slate-50 text-slate-400 hover:text-[#22c55e] hover:bg-[#22c55e]/5 transition-all shadow-sm border border-slate-100" 
            style={{ borderRadius: 40 }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div 
          className="w-16 h-16 bg-slate-50 text-neural-dark flex items-center justify-center font-black text-2xl uppercase italic shadow-sm border border-slate-100" 
          style={{ borderRadius: 40 }}
        >
          {selectedConv.contacts?.full_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h3 className="text-2xl font-black text-neural-dark tracking-tighter uppercase italic">
            {selectedConv.contacts?.full_name || 'NODO_DESCONOCIDO'}
          </h3>
          <div className="flex items-center gap-3 mt-2">
            <Zap size={10} className="text-[#22c55e]" />
            <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.5em] italic">
              v11.9.1_DIAMOND_LINK
            </span>
            <div className="w-1 h-1 bg-[#22c55e] rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
              {selectedConv.contacts?.phone || 'NO_COMMS'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleHandoff} 
          className={`px-8 py-5 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest italic transition-all shadow-sm border ${
            selectedConv.status === 'waiting_human' 
              ? 'bg-[#22c55e] text-white border-[#22c55e]/20 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
              : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-[#22c55e]/30'
          }`} 
          style={{ borderRadius: 40 }}
        >
          <Power size={16} className={selectedConv.status === 'waiting_human' ? 'animate-pulse' : ''} />
          <span className="hidden sm:inline">
            {selectedConv.status === 'waiting_human' ? 'Intervención_Activa' : 'Asumir_Control'}
          </span>
        </button>
        <button 
          className="p-5 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-neural-dark transition-all border border-slate-100" 
          style={{ borderRadius: 40 }}
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </header>
  );
}
