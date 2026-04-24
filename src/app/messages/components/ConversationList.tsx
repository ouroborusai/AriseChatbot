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
    <div className="flex flex-col w-1/3 border-r border-white/5 bg-white/20 backdrop-blur-xl relative overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="p-8 lg:p-10 space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
             <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase">Mensajes</h1>
             <p className="text-[8px] font-black text-[#25D366] uppercase tracking-[0.4em] mt-1">Nodos de Comunicación</p>
          </div>
          <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center border border-[#25D366]/20">
             <Activity className="w-5 h-5 text-[#25D366] animate-pulse" />
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-[#25D366]/5 rounded-[20px] blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-[#25D366] z-20" />
          <input
            type="text"
            placeholder="BUSCAR_CHAT_..."
            className="w-full pl-14 pr-6 py-4.5 bg-white/40 border border-white rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-900 focus:border-[#25D366]/30 focus:bg-white/60 transition-all outline-none placeholder:text-slate-400 relative z-10 shadow-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* LIST SECTION */}
      <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-10 custom-scrollbar relative z-10">
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full p-6 text-left rounded-[28px] transition-all duration-500 group relative overflow-hidden border ${
              selectedConv?.id === conv.id
                ? 'bg-white text-slate-900 border-white shadow-[0_20px_40px_rgba(0,0,0,0.05)] scale-[1.02]'
                : 'bg-white/40 text-slate-500 border-white/60 hover:bg-white/60 hover:border-white shadow-sm'
            }`}
          >
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className={`text-[12px] font-black tracking-tight uppercase truncate max-w-[160px] italic ${selectedConv?.id === conv.id ? 'text-slate-900' : 'text-slate-900/80'}`}>
                  {conv.contacts?.full_name || 'CONTACTO_DESCONOCIDO'}
                </span>
                <div className="flex items-center gap-2">
                  {conv.status === 'waiting_human' && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  )}
                  <span className={`text-[8px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border ${
                    selectedConv?.id === conv.id 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : (conv.status === 'waiting_human' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20')
                  }`}>
                    {conv.status === 'waiting_human' ? 'URGENTE' : 'NEURAL'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                 <div className="flex flex-col gap-0.5">
                    <span className={`text-[10px] font-mono tracking-tighter font-bold ${selectedConv?.id === conv.id ? 'text-slate-400' : 'text-slate-500'}`}>
                       {conv.contacts?.phone ? `+${conv.contacts.phone}` : 'SIN_VINCULO'}
                    </span>
                    {activeCompanyId === 'global' && (
                       <span className={`text-[8px] font-black uppercase tracking-widest ${selectedConv?.id === conv.id ? 'text-[#25D366]' : 'text-slate-400'}`}>
                          {conv.company_id === SUPER_ADMIN_COMPANY_ID ? 'Sede Central' : 'Nodo Externo'}
                       </span>
                    )}
                 </div>
                 <Clock size={12} className={`opacity-20 ${selectedConv?.id === conv.id ? 'text-slate-900' : 'text-slate-400'}`} />
              </div>
            </div>
            
            {/* ACTIVE INDICATOR */}
            {selectedConv?.id === conv.id && (
               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#25D366] rounded-r-full shadow-[0_0_15px_#25D366]" />
            )}
          </button>
        ))}
        
        {loading && (
          <div className="flex justify-center p-12">
             <div className="w-10 h-10 border-4 border-[#25D366]/20 border-t-[#25D366] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* FOOTER DETAIL */}
      <div className="p-8 border-t border-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)] relative z-10">
         <div className="flex items-center gap-4 justify-center text-slate-400">
            <ShieldCheck size={14} />
            <span className="text-[8px] font-black uppercase tracking-widest">Protocolo Blindado</span>
         </div>
      </div>

    </div>
  );
}
