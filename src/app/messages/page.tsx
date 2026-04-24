'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { ConversationList, ChatHeader, MessageBubble, MessageInput } from './components';

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

interface Message {
  id: string;
  content: string;
  sender_type: 'bot' | 'user' | 'agent';
  created_at: string;
  conversation_id: string;
}

export default function MessagesPage() {
  const { activeCompany } = useActiveCompany();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (silent = false) => {
    if (!activeCompany) return;
    if (!silent) setLoading(true);

    try {
      let query = supabase
        .from('conversations')
        .select('*, contacts(full_name, phone)')
        .order('updated_at', { ascending: false });

      // Filtro Multi-tenant Industrial (Bypass para SuperAdmin)
      if (activeCompany.id !== 'global') {
        query = query.eq('company_id', activeCompany.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const uniqueContacts: Record<string, boolean> = {};
        const filtered = data.filter(conv => {
          if (!conv.contact_id) return true;
          if (!uniqueContacts[conv.contact_id]) {
            uniqueContacts[conv.contact_id] = true;
            return true;
          }
          return false;
        });

        // --- SMART TRIAGE v9.0 ---
        const sorted = [...filtered].sort((a, b) => {
          if (a.status === 'waiting_human' && b.status !== 'waiting_human') return -1;
          if (a.status !== 'waiting_human' && b.status === 'waiting_human') return 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

        setConversations(sorted);
      }
    } catch {
      // Error manejado silenciosamente
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // --- SUSCRIPCIÓN GLOBAL (SIDEBAR) ---
  useEffect(() => {
    if (!activeCompany) return;

    const globalChannel = supabase.channel('global_conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, () => {
        fetchConversations(true);
      })
      .subscribe();

    const interval = setInterval(() => fetchConversations(true), 60000);

    return () => {
      supabase.removeChannel(globalChannel);
      clearInterval(interval);
    };
  }, [activeCompany?.id]);

  // --- SUSCRIPCIÓN ESPECÍFICA (MENSAJES) ---
  useEffect(() => {
    if (!selectedConv?.id) return;

    const convId = selectedConv.id;

    const channel = supabase.channel(`chat_${convId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, async (payload: { new: Message }) => {
        if (payload.new.sender_type === 'bot') {
          fetch('/api/neural-processor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: payload.new.id, companyId: selectedConv.company_id }),
          }).catch(() => {
            // Neural processor trigger failure - silent fail
          });
        }

        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConv?.id]);

  useEffect(() => {
    if (activeCompany) {
      fetchConversations();
      if (selectedConv && activeCompany.id !== 'global' && selectedConv.company_id !== activeCompany.id) {
        setSelectedConv(null);
        setMessages([]);
      }
    }
  }, [activeCompany?.id]);

  const selectConversation = async (conv: Conversation) => {
    const newStatus = conv.status === 'new' ? 'open' : conv.status;

    // Actualizar estado primero para UX responsiva
    setSelectedConv({ ...conv, status: newStatus });

    // Fetchear mensajes en paralelo con actualización de estado
    await fetchMessages(conv.id);

    // Solo actualizar DB si el status era 'new'
    if (conv.status === 'new') {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'open' })
        .eq('id', conv.id);

      if (error) {
        console.error('[selectConversation] Failed to update status:', error);
        // Revertir estado local si falló la actualización
        setSelectedConv({ ...conv, status: conv.status });
      }
      fetchConversations(true);
    }
  };

  const toggleHandoff = async (conv: Conversation) => {
    const newStatus = conv.status === 'waiting_human' ? 'open' : 'waiting_human';
    const { error } = await supabase
      .from('conversations')
      .update({ status: newStatus })
      .eq('id', conv.id);

    if (!error) {
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, status: newStatus } : c));
      setSelectedConv({ ...conv, status: newStatus });
    }
  };

  const sendMessage = async (overrideContent?: string) => {
    const content = overrideContent || newMessage;
    if (!content.trim() || !selectedConv) return;

    if (!overrideContent) setNewMessage('');

    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedConv.contact_id,
          content,
          companyId: selectedConv.company_id,
        }),
      });
      fetchConversations(true);
    } catch {
      // Message send failure - silent fail
    }
  };

  return (
    <div className="flex h-screen bg-white text-[#1A1A1A] font-sans selection:bg-green-100">
      <ConversationList
        conversations={conversations}
        selectedConv={selectedConv}
        onSelect={selectConversation}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        loading={loading}
        activeCompanyId={activeCompany?.id}
      />

      <div className="flex flex-col flex-1 bg-white relative overflow-hidden border-l border-slate-100">
        {selectedConv ? (
          <>
            <ChatHeader selectedConv={selectedConv} onToggleHandoff={toggleHandoff} />

            <div className="flex-1 overflow-y-auto p-12 space-y-8 bg-slate-50/50 relative">
              <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

              <div className="relative space-y-8 max-w-4xl mx-auto">
                {messages.map((m, i) => (
                  <MessageBubble key={m.id} message={m} index={i} onSendMessage={sendMessage} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <MessageInput
              value={newMessage}
              onChange={setNewMessage}
              onSend={() => sendMessage()}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mb-8 shadow-xl animate-bounce border border-slate-100">
                <MessageSquare className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">
                Selector de Frecuencia
              </h3>
              <p className="text-[10px] tracking-[0.4em] uppercase font-black text-slate-400">
                esperando enlace neuronal ...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
