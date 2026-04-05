'use client';

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ConversationList from '@/app/components/ConversationList';
import MessageView from '@/app/components/MessageView';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  phone_number?: string;
  conversations?: { phone_number?: string };
};

type ConversationSummary = {
  phone: string;
  label: string;
  preview: string;
  updatedAt: string;
  messages: Message[];
};

export default function DashboardPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          conversations!inner(phone_number)
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const conversations = useMemo(() => {
    const groups = new Map<string, ConversationSummary>();

    messages.forEach((message) => {
      const phone =
        message.phone_number || message.conversations?.phone_number || 'sin número';
      const existing = groups.get(phone);
      const messageTime = message.created_at;
      const preview = message.content.length > 60 ? `${message.content.slice(0, 57)}...` : message.content;

      if (!existing) {
        groups.set(phone, {
          phone,
          label: `Cliente ${phone.slice(-4)}`,
          preview,
          updatedAt: messageTime,
          messages: [message],
        });
      } else {
        existing.messages.push(message);
        if (messageTime > existing.updatedAt) {
          existing.updatedAt = messageTime;
          existing.preview = preview;
        }
      }
    });

    return Array.from(groups.values()).sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
  }, [messages]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.phone === selectedPhone) || null,
    [conversations, selectedPhone]
  );

  useEffect(() => {
    if (!selectedPhone && conversations.length > 0) {
      setSelectedPhone(conversations[0].phone);
    }
  }, [conversations, selectedPhone]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-800 bg-gray-100">
        Cargando mensajes...
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 min-h-0 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] px-0">
        <ConversationList
          conversations={conversations}
          selectedPhone={selectedPhone}
          onSelect={setSelectedPhone}
        />
        <MessageView selectedConversation={selectedConversation} />
      </div>
    </div>
  );
}
