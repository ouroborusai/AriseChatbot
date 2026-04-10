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
    return <div className="h-full flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="h-full flex">
      <div className="w-80 shrink-0 border-r border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Conversaciones</h2>
            <span className="text-xs text-slate-500">{realtimeStatus}</span>
          </div>
        </div>
        <ConversationList conversations={convList} selectedPhone={selectedPhone} onSelect={setSelectedPhone} />
      </div>
      <div className="flex-1">
        <MessageView selectedConversation={selectedConversation} selectedPhone={selectedPhone} />
      </div>
    </div>
  );
}