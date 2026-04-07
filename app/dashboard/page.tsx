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
  const supabase = useMemo(() => createClient(), []);
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
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-3 border-solid border-green-500 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Mensajes</h1>
        <p className="text-sm text-slate-500 mt-1">
          {conversations.length} {conversations.length === 1 ? 'conversación' : 'conversaciones'} activas
        </p>
      </div>
      <div className="card-base p-0 overflow-hidden flex-1">
        <div className="flex h-[calc(100vh-14rem)] gap-0">
          <ConversationList
            conversations={conversations}
            selectedPhone={selectedPhone}
            onSelect={setSelectedPhone}
          />
          <MessageView selectedConversation={selectedConversation} />
        </div>
      </div>
    </div>
  );
}
