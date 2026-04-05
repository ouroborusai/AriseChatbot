'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Conversation = {
  id: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setConversations(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
      setLoading(false);
    };

    fetchConversations();

    const convChannel = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
    };
  }, [supabase]);

  useEffect(() => {
    if (!selectedId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();

    const msgChannel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.conversation_id === selectedId) {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [selectedId, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const formatPhone = (phone: string) => {
    return phone.length > 12 ? phone.slice(0, 12) + '...' : phone;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-60px)]">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-60px)]">
      <aside className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Conversaciones ({conversations.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-gray-500 text-sm">No hay conversaciones</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full p-4 text-left border-b border-gray-800 transition-colors ${
                  selectedId === conv.id
                    ? 'bg-gray-800'
                    : 'hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{formatPhone(conv.phone_number)}</span>
                  <span className="text-gray-500 text-xs">{formatDate(conv.updated_at)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {selectedId ? (
          <>
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-white font-medium">
                {formatPhone(conversations.find(c => c.id === selectedId)?.phone_number || '')}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-60">{formatDate(msg.created_at)}</p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-gray-500 text-center">No hay mensajes</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Selecciona una conversación</p>
          </div>
        )}
      </main>
    </div>
  );
}