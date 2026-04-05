'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  phone_number?: string;
};

export default function DashboardPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          conversations!inner(phone_number)
        `)
        .order('created_at', { ascending: true })
        .limit(50);

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
        console.log('Nuevo mensaje recibido:', payload.new);
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-800">
        Cargando mensajes...
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-[#f8faf7] text-slate-900">
      <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-6">
        <section className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#128C7E] font-semibold">WhatsApp</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Mensajes recientes</h1>
              <p className="text-sm text-slate-500">Las últimas conversaciones recibidas en el panel de WhatsApp.</p>
            </div>
            <div className="rounded-3xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm">
              Mensajes activos: {messages.length}
            </div>
          </div>
        </section>

        <section className="flex-1 min-h-0 overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-600">
              No hay mensajes aún.
            </div>
          ) : (
            <div className="h-full min-h-0 overflow-y-auto space-y-4 pr-1 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-[32px] border px-5 py-4 shadow-sm transition ${
                    message.role === 'user'
                      ? 'border-[#d1f5cd] bg-[#dcf8c6]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="inline-flex rounded-full bg-[#128C7E]/10 px-3 py-1 text-[#075E54] font-semibold">
                          {message.role === 'user' ? 'Usuario' : 'Bot'}
                        </span>
                        {message.phone_number && (
                          <span className="text-slate-500">{message.phone_number}</span>
                        )}
                      </div>
                      <p className="text-base leading-7 text-slate-900">{message.content}</p>
                    </div>
                    <span className="shrink-0 text-sm text-slate-500">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
