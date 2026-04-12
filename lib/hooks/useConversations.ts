'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  conversation_id: string;
  phone_number?: string;
};

export type ConversationSummary = {
  phone: string;
  label: string;
  preview: string;
  updatedAt: string;
  messages: Message[];
};

export function useConversations() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('Conectando...');

  const fetchMessages = useCallback(async () => {
    const { data: convs } = await supabase.from('conversations').select('id, phone_number').order('created_at', { ascending: false });
    if (!convs || convs.length === 0) { setMessages([]); setLoading(false); return; }
    
    const convIds = convs.map(c => c.id);
    const { data } = await supabase.from('messages').select('id, role, content, created_at, conversation_id').in('conversation_id', convIds).order('created_at', { ascending: true });
    
    if (data) {
      const convMap = new Map(convs.map(c => [c.id, c.phone_number]));
      const transformed = data.map(m => ({ ...m, phone_number: convMap.get(m.conversation_id) || 'sin número' }));
      setMessages(transformed);
    }
    setLoading(false);
  }, [supabase]);

  const fetchContacts = useCallback(async () => {
    const { data } = await supabase.from('contacts').select('phone_number, name');
    if (data) {
      const map = new Map<string, string>();
      data.forEach(c => { if (c.name) map.set(c.phone_number, c.name); });
      setContacts(map);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMessages();
    fetchContacts();

    // ID único para evitar colisiones de canales en el cliente
    const channelId = Math.random().toString(36).slice(2, 7);
    const msgChannelName = `msg-${channelId}`;
    const contactChannelName = `contact-${channelId}`;

    const msgChannel = supabase.channel(msgChannelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        console.log('[Realtime] Nuevo mensaje detectado');
        fetchMessages();
      })
      .subscribe((status) => {
        setRealtimeStatus(status === 'SUBSCRIBED' ? '🟢 En vivo' : '🔴 Desconectado');
      });

    const contactChannel = supabase.channel(contactChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => fetchContacts())
      .subscribe();

    return () => {
      console.log('[Realtime] Limpiando canales...');
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(contactChannel);
    };
  }, [supabase, fetchMessages, fetchContacts]);

  const conversations = useCallback(() => {
    const groups = new Map<string, ConversationSummary>();
    messages.forEach((m) => {
      const phone = m.phone_number || 'sin número';
      const existing = groups.get(phone);
      const preview = m.content.length > 60 ? `${m.content.slice(0, 57)}...` : m.content;
      if (!existing) {
        groups.set(phone, { phone, label: phone, preview, updatedAt: m.created_at, messages: [m] });
      } else {
        existing.messages.push(m);
        if (m.created_at > existing.updatedAt) { existing.updatedAt = m.created_at; existing.preview = preview; }
      }
    });
    return Array.from(groups.values()).map(c => ({ ...c, label: contacts.get(c.phone) || `Cliente ${c.phone.slice(-4)}` })).sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
  }, [messages, contacts]);

  return { conversations, messages, contacts, loading, realtimeStatus, refetch: fetchMessages };
}