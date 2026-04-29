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
    <div className="flex flex-col w-full h-full bg-slate-50/30 backdrop-blur-3xl relative overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="p-8 lg:p-10 space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
             <h1 className="text-2xl font-black tracking-tighter text-neural-dark uppercase italic">Frecuencias</h1>
             <p className="text-[8px] font-black text-primary uppercase tracking-[0.6em] mt-2">NODOS_DE_SINCRONIZACIÓN</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center border border-primary/20 shadow-sm">
             <Activity className="w-5 h-5 text-primary animate-pulse" />
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 transition-colors group-focus-within:text-primary z-20" />
          <input
            type="text"
            placeholder="BUSCAR_FRECUENCIA_..."
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-neural-dark focus:border-primary/30 transition-all outline-none placeholder:text-slate-200 relative z-10 shadow-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* LIST SECTION */}
      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar relative z-10 divide-y divide-slate-100/30">
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full p-6 flex items-center gap-6 transition-all duration-300 group relative border-l-[4px] ${
              selectedConv?.id === conv.id
                ? 'bg-white border-primary shadow-[inset_0_0_20px_rgba(34,197,94,0.02)]'
                : 'bg-transparent border-transparent hover:bg-white/60'
            }`}
          >
            {/* AVATAR - PLATINUM STYLE */}
            <div className="relative shrink-0">
               <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xs shadow-sm transition-all duration-500 ${
                  selectedConv?.id === conv.id ? 'bg-accent text-white scale-105' : 'bg-white border border-slate-100 text-slate-400'
               }`}>
                  {conv.contacts?.full_name?.[0]?.toUpperCase() || 'D'}
               </div>
               {conv.status === 'new' && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full border-[3px] border-white shadow-md animate-bounce" />
               )}
            </div>

            {/* CONTENT - PLATINUM STYLE */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className={`text-[12px] font-black tracking-tighter uppercase truncate max-w-[150px] ${selectedConv?.id === conv.id ? 'text-neural-dark' : 'text-slate-600'}`}>
                  {conv.contacts?.full_name || 'CONTACTO_DESCONOCIDO'}
                </span>
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest shrink-0 italic">
                  {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between mt-1">
                <p className={`text-[9px] font-black truncate pr-4 uppercase tracking-widest ${selectedConv?.id === conv.id ? 'text-primary' : 'text-slate-300'}`}>
                   {conv.status === 'waiting_human' ? '⚠️ REQUERIDO' : 'LINK_ESTABLE'}
                </p>
                {conv.status === 'waiting_human' && (
                   <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
                )}
              </div>
            </div>
          </button>
        ))}
        
        {loading && (
          <div className="flex justify-center p-16">
             <div className="w-12 h-12 border-[5px] border-primary/10 border-t-primary rounded-full animate-spin shadow-inner" />
          </div>
        )}
      </div>

      {/* FOOTER DETAIL */}
      <div className="p-8 border-t border-slate-100 relative z-10 bg-white/40">
         <div className="flex items-center gap-4 justify-center text-slate-300 opacity-60">
            <ShieldCheck size={16} className="text-primary" />
            <span className="text-[8px] font-black uppercase tracking-widest">Protocolo Blindado v10.4</span>
         </div>
      </div>

    </div>
  );
}
