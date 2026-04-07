'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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

interface MessageViewProps {
  selectedConversation: ConversationSummary | null;
  selectedPhone: string | null;
}

export default function MessageView({ selectedConversation, selectedPhone }: MessageViewProps) {
  const supabase = createClient();
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  useEffect(() => {
    const fetchChatbotStatus = async () => {
      if (!selectedPhone) return;
      
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id, chatbot_enabled')
        .eq('phone_number', selectedPhone)
        .maybeSingle();
      
      if (conversation) {
        setChatbotEnabled(conversation.chatbot_enabled !== false);
      } else {
        setChatbotEnabled(true);
      }
    };
    
    fetchChatbotStatus();
  }, [selectedPhone, supabase]);

  const handleToggleChatbot = async () => {
    if (!selectedPhone) return;
    
    setLoadingToggle(true);
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('phone_number', selectedPhone)
        .maybeSingle();
      
      if (conversation) {
        const newEnabled = !chatbotEnabled;
        await supabase
          .from('conversations')
          .update({ chatbot_enabled: newEnabled })
          .eq('id', conversation.id);
        
        setChatbotEnabled(newEnabled);
      }
    } catch (error) {
      console.error('Error toggling chatbot:', error);
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleSendReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPhone || !replyText.trim()) return;

    setSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: selectedPhone,
          message: replyText.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSendResult({ success: true });
        setReplyText('');
        // Auto-clear resultado después de 2 segundos
        setTimeout(() => setSendResult(null), 2000);
      } else {
        setSendResult({ error: data.error || 'No se pudo enviar el mensaje' });
      }
    } catch (error) {
      setSendResult({ error: error instanceof Error ? error.message : 'Error de conexión' });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* Header del chat */}
      <div className="border-b border-slate-100 bg-white/80 backdrop-blur-sm px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-500 text-white font-semibold shadow-md">
            {selectedConversation ? selectedConversation.label[0] : 'W'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {selectedConversation ? selectedConversation.label : 'Selecciona una conversación'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {selectedConversation
                ? `${selectedConversation.messages.length} mensajes • ${new Date(selectedConversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Ver los chats en la lista de la izquierda'}
            </p>
          </div>
          
          {/* Toggle Chatbot */}
          {selectedConversation && (
            <button
              onClick={handleToggleChatbot}
              disabled={loadingToggle}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                chatbotEnabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={chatbotEnabled ? 'Desactivar chatbot' : 'Activar chatbot'}
            >
              <span className={`inline-block h-2 w-2 rounded-full ${chatbotEnabled ? 'bg-green-500' : 'bg-slate-400'}`}></span>
              {loadingToggle ? '...' : chatbotEnabled ? '🤖 Automático' : '👤 Manual'}
            </button>
          )}
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {selectedConversation ? (
          <div className="flex flex-col gap-3">
            {selectedConversation.messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                        : 'bg-white text-slate-800 ring-1 ring-slate-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    <div className={`mt-1.5 text-[10px] text-right ${isUser ? 'text-green-100' : 'text-slate-400'}`}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl mb-4">
                💬
              </div>
              <p className="text-slate-500 text-sm font-medium">Selecciona un chat</p>
              <p className="text-slate-400 text-xs mt-1">para ver la conversación</p>
            </div>
          </div>
        )}
      </div>

      {/* Área de input para responder desde la interfaz */}
      <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
        <form onSubmit={handleSendReply} className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-xl">💬</span>
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={!selectedConversation || !selectedPhone || sending}
              placeholder={
                selectedConversation
                  ? 'Escribe tu respuesta...'
                  : 'Selecciona una conversación para responder'
              }
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!selectedConversation || !selectedPhone || !replyText.trim() || sending}
              className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {sending ? 'Enviando...' : 'Enviar respuesta'}
            </button>
            {sendResult && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  sendResult.success
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {sendResult.success ? 'Respuesta enviada' : `Error: ${sendResult.error}`}
              </div>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}