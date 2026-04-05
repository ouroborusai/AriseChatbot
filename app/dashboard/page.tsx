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
        setMessages((prev) => [...prev, payload.new as Message]);
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
    <div className="flex h-full min-h-0 flex-col bg-[#eff7f0] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[#128C7E] font-semibold">WhatsApp</p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">Mensajes recientes</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">Las últimas conversaciones recibidas en el panel de WhatsApp.</p>
            </div>
            <div className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-slate-200/70">
              Mensajes activos: {messages.length}
            </div>
          </div>
        </section>

        <section className="flex-1 min-h-0 overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 shadow-xl shadow-slate-200/30">
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">Chat en vivo</p>
                  <p className="text-xs text-slate-500">Se actualiza automáticamente con cada nuevo mensaje.</p>
                </div>
                <div className="rounded-full bg-[#128C7E]/10 px-3 py-1 text-xs font-semibold text-[#075E54]">
                  {messages.length} mensajes
                </div>
              </div>
            </div>

            <div className="flex h-full min-h-0 flex-col overflow-hidden px-6 pb-6 pt-5">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-[280px] items-center justify-center text-slate-600">
                  No hay mensajes aún.
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[90%] min-w-[180px] rounded-[28px] border px-5 py-4 shadow-sm transition ${
                        message.role === 'user'
                          ? 'self-end border-[#d1f5cd] bg-[#dcf8c6] text-slate-900'
                          : 'self-start border-slate-200 bg-white text-slate-900'
                      }`}
                      >
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span className="inline-flex rounded-full bg-[#128C7E]/10 px-3 py-1 text-[#075E54] font-semibold">
                            {message.role === 'user' ? 'Usuario' : 'Bot'}
                          </span>
                          {message.phone_number && (
                            <span className="text-slate-500">{message.phone_number}</span>
                          )}
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-900">
                          {message.content}
                        </p>
                        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{message.role === 'user' ? 'Mensaje entrante' : 'Respuesta generada'}</span>
                          <span>{new Date(message.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
