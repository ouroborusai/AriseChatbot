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

type Contact = {
  phone_number: string;
  name?: string | null;
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
  const [contacts, setContacts] = useState<Map<string, string>>(new Map());
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('Conectando...');

  // Función para cargar mensajes
  const fetchMessages = async () => {
    // Obtener conversaciones primero
    const { data: convs, error: convError } = await supabase
      .from('conversations')
      .select('id, phone_number')
      .order('created_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      setLoading(false);
      return;
    }

    if (!convs || convs.length === 0) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Obtener todos los mensajes de esas conversaciones
    const convIds = convs.map(c => c.id);
    
    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, created_at, conversation_id')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else if (data) {
      // Mapear teléfono a cada mensaje
      const convMap = new Map(convs.map(c => [c.id, c.phone_number]));
      const transformedMessages = data.map(m => ({
        ...m,
        phone_number: convMap.get(m.conversation_id) || 'sin número'
      }));
      setMessages(transformedMessages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    // Suscribirse a nuevos mensajes en tiempo real
    const channel = supabase
      .channel('realtime-messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        console.log('📨 Nuevo mensaje recibido:', payload.new);
        // Recargar todos los mensajes para mantener consistencia
        fetchMessages();
      })
      .subscribe((status) => {
        console.log('📡 Estado de suscripción:', status);
        setRealtimeStatus(status === 'SUBSCRIBED' ? '🟢 En vivo' : '🔴 Desconectado');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Cargar contactos para obtener nombres
  useEffect(() => {
    const fetchContacts = async () => {
      const { data } = await supabase
        .from('contacts')
        .select('phone_number, name');
      
      if (data) {
        const contactMap = new Map<string, string>();
        data.forEach(c => {
          if (c.name) contactMap.set(c.phone_number, c.name);
        });
        setContacts(contactMap);
      }
    };
    
    fetchContacts();

    // Suscripción a cambios en contacts
    const channel = supabase
      .channel('realtime-contacts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'contacts' 
      }, () => {
        fetchContacts();
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
          label: phone, // provisional, se reemplaza abajo
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

    // Reemplazar labels con nombres reales
    const result = Array.from(groups.values()).map(conv => ({
      ...conv,
      label: contacts.get(conv.phone) || `Cliente ${conv.phone.slice(-4)}`
    }));

    return result.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
  }, [messages, contacts]);

  // Obtener nombres de contactos
  useEffect(() => {
    const fetchContactNames = async () => {
      const phones = conversations.map(c => c.phone);
      if (phones.length === 0) return;

      const { data: contacts } = await supabase
        .from('contacts')
        .select('phone_number, name')
        .in('phone_number', phones);

      if (contacts) {
        // Actualizar labels con nombres
        setMessages(prev => prev); // Esto fuerza re-render
      }
    };

    fetchContactNames();
  }, [conversations.length, supabase]);

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
      {/* Header con indicador de conexión */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mensajes</h1>
          <p className="text-sm text-slate-500 mt-1">
            {conversations.length} {conversations.length === 1 ? 'conversación' : 'conversaciones'} activas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Recargar
          </button>
          <span className="text-xs text-slate-500">{realtimeStatus}</span>
        </div>
      </div>
      <div className="card-base p-0 overflow-hidden flex-1">
        <div className="flex h-[calc(100vh-14rem)] gap-0">
          <ConversationList
            conversations={conversations}
            selectedPhone={selectedPhone}
            onSelect={setSelectedPhone}
          />
          <MessageView
            selectedConversation={selectedConversation}
            selectedPhone={selectedPhone}
          />
        </div>
      </div>
    </div>
  );
}
