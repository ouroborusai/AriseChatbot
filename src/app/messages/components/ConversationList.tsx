'use client';

import React from 'react';
import { Search, Sparkles } from 'lucide-react';
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
    <div className="flex flex-col w-1/3 border-r border-slate-100 bg-white/60 backdrop-blur-xl">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Mensajes</h1>
          <Sparkles className="w-5 h-5 text-green-600 animate-pulse" />
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-green-600" />
          <input
            type="text"
            placeholder="BUSCAR_CHAT_..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-green-500/10 focus:border-green-500/20 transition-all outline-none placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-8 custom-scrollbar">
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full p-6 text-left rounded-[28px] transition-all duration-500 group relative overflow-hidden ${
              selectedConv?.id === conv.id
                ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200 scale-[1.02]'
                : 'hover:bg-white text-slate-600 border border-transparent hover:border-slate-100 shadow-sm'
            }`}
          >
            <div className="relative z-10 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-widest uppercase truncate max-w-[180px]">
                  {conv.contacts?.full_name || 'CONTACTO_DESCONOCIDO'}
                </span>
                <div className="flex items-center gap-2">
                  {conv.status === 'waiting_human' && (
                    <div className="w-2 h-2 bg-rose-400 rounded-full animate-ping" />
                  )}
                  <span className={`text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest ${
                    selectedConv?.id === conv.id ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'
                  }`}>
                    {conv.status === 'waiting_human' ? 'Master' : 'AI'}
                  </span>
                </div>
              </div>
              {activeCompanyId === 'global' && (
                <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 block mb-1 ${selectedConv?.id === conv.id ? 'text-white' : 'text-green-600'}`}>
                  {conv.company_id === SUPER_ADMIN_COMPANY_ID ? 'Sede Central' : 'Nodo Externo'}
                </span>
              )}
              <span className={`text-[10px] font-mono opacity-60 ${selectedConv?.id === conv.id ? 'text-white' : 'text-slate-400'}`}>
                {conv.contacts?.phone ? `+${conv.contacts.phone}` : 'SIN_VINCULO'}
              </span>
            </div>
          </button>
        ))}
        {loading && <div className="flex justify-center p-8"><Sparkles className="animate-spin text-green-600" /></div>}
      </div>
    </div>
  );
}
