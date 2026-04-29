'use client';

import React from 'react';
import { Search, Sparkles, Activity, Clock, ShieldCheck } from 'lucide-react';
import { SUPER_ADMIN_COMPANY_ID } from '@/lib/neural-engine/constants';

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
  last_message?: string; // Add last message property
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConv: Conversation | null;
  onSelect: (conv: Conversation) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  loading: boolean;
  activeCompanyId?: string;
}

export function ConversationList({
  conversations,
  selectedConv,
  onSelect,
  searchTerm,
  onSearchChange,
  loading,
  activeCompanyId,
}: ConversationListProps) {
  const filtered = conversations.filter(c =>
    c.contacts?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contacts?.phone?.includes(searchTerm)
  );

  return (
    <div className="flex flex-col w-full h-full bg-slate-50/50 backdrop-blur-xl relative overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="p-4 lg:p-6 space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
             <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">Mensajes</h1>
             <p className="text-[6px] font-black text-[#22c55e] uppercase tracking-[0.4em] mt-1">Nodos de Comunicación</p>
          </div>
          <div className="w-6 h-6 bg-[#22c55e]/10 rounded flex items-center justify-center border border-[#22c55e]/20">
             <Activity className="w-3 h-3 text-[#22c55e] animate-pulse" />
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-[#22c55e]/5 rounded-lg blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 transition-colors group-focus-within:text-[#22c55e] z-20" />
          <input
            type="text"
            placeholder="BUSCAR_CHAT_..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-900 focus:border-[#22c55e]/30 transition-all outline-none placeholder:text-slate-200 relative z-10 shadow-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* LIST SECTION */}
      <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar relative z-10 divide-y divide-slate-100/30">
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full p-3 flex items-center gap-3 transition-all duration-200 group relative border-l-[3px] ${
              selectedConv?.id === conv.id
                ? 'bg-white border-[#22c55e] shadow-inner'
                : 'bg-transparent border-transparent hover:bg-white'
            }`}
          >
            {/* AVATAR - WHATSAPP STYLE */}
            <div className="relative shrink-0">
               <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm transition-all duration-300 ${
                  selectedConv?.id === conv.id ? 'bg-[#0f172a] text-white' : 'bg-white border border-slate-100 text-slate-300'
               }`}>
                  {conv.contacts?.full_name?.[0]?.toUpperCase() || 'D'}
               </div>
               {conv.status === 'new' && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#22c55e] rounded-full border border-white shadow-sm" />
               )}
            </div>

            {/* CONTENT - WHATSAPP STYLE */}
            <div className="flex-1 min-w-0 flex flex-col gap-0">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black tracking-tight uppercase truncate max-w-[120px] ${selectedConv?.id === conv.id ? 'text-slate-900' : 'text-slate-700'}`}>
                  {conv.contacts?.full_name || 'CONTACTO_DESCONOCIDO'}
                </span>
                <span className="text-[6px] font-black text-slate-300 uppercase tracking-widest shrink-0">
                  {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between mt-0.5">
                <p className={`text-[8px] font-black truncate pr-3 uppercase tracking-tight ${selectedConv?.id === conv.id ? 'text-[#22c55e]' : 'text-slate-300'}`}>
                   {conv.status === 'waiting_human' ? '⚠️ REQUIERE_OPERADOR' : 'LINK_NEURAL_ACTIVE'}
                </p>
                {conv.status === 'waiting_human' && (
                   <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </button>
        ))}
        
        {loading && (
          <div className="flex justify-center p-12">
             <div className="w-10 h-10 border-4 border-[#22c55e]/20 border-t-[#22c55e] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* FOOTER DETAIL */}
      <div className="p-6 border-t border-slate-100 relative z-10 bg-white/50">
         <div className="flex items-center gap-3 justify-center text-slate-300">
            <ShieldCheck size={12} />
            <span className="text-[7px] font-black uppercase tracking-widest">Protocolo Blindado</span>
         </div>
      </div>

    </div>
  );
}
