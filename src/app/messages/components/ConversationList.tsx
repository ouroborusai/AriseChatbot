'use client';

import React from 'react';
import { Search, Activity, ShieldCheck, Zap } from 'lucide-react';
import type { Conversation, Contact } from '@/types/database';

export type ConvListType = Conversation & { contacts?: Pick<Contact, 'full_name' | 'phone'> | null };

interface ConversationListProps {
  conversations: ConvListType[];
  selectedConv: ConvListType | null;
  onSelect: (conv: ConvListType) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  loading: boolean;
}

export function ConversationList({ conversations, selectedConv, onSelect, searchTerm, onSearchChange, loading }: ConversationListProps) {
  const filtered = conversations.filter((c) =>
    c.contacts?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contacts?.phone?.includes(searchTerm)
  );

  return (
    <div className="flex flex-col w-full h-full bg-slate-50/30 backdrop-blur-3xl relative overflow-hidden">
      <div className="p-8 lg:p-10 space-y-8 relative z-10 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-neural-dark uppercase italic">Frecuencias</h1>
            <p className="text-[8px] font-black text-[#22c55e] uppercase tracking-[0.6em] mt-2 flex items-center gap-2">
              <Zap size={10} className="text-[#22c55e]" /> 
              NODOS_DE_SINCRONIZACIÓN_v12.0
            </p>
          </div>
          <Activity className="w-5 h-5 text-[#22c55e] animate-pulse" />
        </div>
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#22c55e] transition-colors" size={16} />
          <input
            type="text"
            placeholder="BUSCAR_NODO..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white border border-slate-200 py-5 pl-16 pr-6 text-[10px] font-black text-neural-dark uppercase tracking-widest outline-none focus:border-[#22c55e]/50 focus:ring-4 focus:ring-[#22c55e]/10 transition-all italic shadow-sm"
            style={{ borderRadius: 40 }}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 relative z-10">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-6 bg-white animate-pulse border border-slate-100" style={{ borderRadius: 40 }}>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-slate-50" style={{ borderRadius: 40 }} />
                <div className="space-y-4 flex-1">
                  <div className="h-3 bg-slate-50 w-2/3" style={{ borderRadius: 40 }} />
                  <div className="h-2 bg-slate-50 w-1/2" style={{ borderRadius: 40 }} />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
           <div className="p-12 text-center flex flex-col items-center">
             <ShieldCheck size={32} className="text-slate-300 mb-6 opacity-50" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">NO_SE_ENCONTRARON_NODOS</p>
           </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full text-left p-5 transition-all duration-500 border group shadow-sm flex items-center gap-5 ${
                selectedConv?.id === conv.id
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[0_10px_30px_-10px_rgba(26,26,26,0.4)] scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-[#22c55e]/30 text-[#1a1a1a]'
              }`}
              style={{ borderRadius: 40 }}
            >
               <div 
                 className={`w-14 h-14 flex items-center justify-center font-black text-xl transition-colors border ${
                   selectedConv?.id === conv.id 
                     ? 'bg-white/10 border-white/10 text-white' 
                     : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-[#22c55e]/10 group-hover:text-[#22c55e] group-hover:border-[#22c55e]/20'
                 }`} 
                 style={{ borderRadius: 40 }}
               >
                  {conv.contacts?.full_name?.[0]?.toUpperCase() || '?'}
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center mb-2">
                   <h4 className={`text-[12px] font-black uppercase tracking-tight truncate italic ${selectedConv?.id === conv.id ? 'text-white' : 'text-[#1a1a1a]'}`}>
                     {conv.contacts?.full_name || 'Desconocido'}
                   </h4>
                   <span className={`text-[8px] font-black uppercase tracking-widest shrink-0 ${selectedConv?.id === conv.id ? 'text-white/60' : 'text-slate-400'}`}>
                     {conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                   </span>
                 </div>
                 <p className={`text-[9px] font-black uppercase tracking-widest truncate italic ${selectedConv?.id === conv.id ? 'text-white/60' : 'text-slate-400'}`}>
                   {conv.contacts?.phone || 'Sin número'}
                 </p>
               </div>
               {conv.status === 'waiting_human' && (
                 <div className="w-2.5 h-2.5 bg-[#22c55e] rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
               )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
