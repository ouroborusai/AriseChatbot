'use client';

import { useState, useMemo } from 'react';
import { useConversations } from '@/lib/hooks/useConversations';
import ConversationList from '@/app/components/ConversationList';
import MessageView from '@/app/components/MessageView';

export default function DashboardPage() {
  const { conversations, contacts, loading, realtimeStatus } = useConversations();
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const convList = useMemo(() => conversations(), [conversations]);
  const selectedConversation = useMemo(() => 
    convList.find(c => c.phone === selectedPhone) || null,
    [convList, selectedPhone]
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando Comunicaciones...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden bg-white">
      {/* Sidebar de Conversaciones */}
      <div className={`
        ${selectedPhone ? 'hidden md:flex' : 'flex'} 
        w-full md:w-80 shrink-0 border-r border-slate-200 bg-white flex-col h-full
      `}>
        <div className="px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Canales Vivos</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">En Vivo</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList conversations={convList} selectedPhone={selectedPhone} onSelect={setSelectedPhone} />
        </div>
      </div>

      {/* Vista de Mensajes */}
      <div className={`
        ${selectedPhone ? 'flex' : 'hidden md:flex'} 
        flex-1 h-full bg-slate-50 overflow-hidden
      `}>
        <MessageView 
          selectedConversation={selectedConversation} 
          selectedPhone={selectedPhone} 
          onBack={() => setSelectedPhone(null)}
        />
      </div>
    </div>
  );
}