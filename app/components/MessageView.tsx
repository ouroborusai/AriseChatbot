'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTemplates } from '@/lib/hooks/useTemplates';
import type { Template } from '@/app/components/templates/types';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  phone_number?: string;
  conversations?: { phone_number?: string };
};

/**
 * Parsea el contenido del mensaje para extraer botones/listas interactivas
 * Formatos: [button:btn_id] o [list:list_id]
 */
function parseInteractiveContent(content: string): {
  type: 'button' | 'list' | 'text';
  value: string;
  displayName?: string;
} {
  if (content.startsWith('[button:') && content.endsWith(']')) {
    return {
      type: 'button',
      value: content.slice('[button:'.length, -1)
    };
  }
  if (content.startsWith('[list:') && content.endsWith(']')) {
    return {
      type: 'list',
      value: content.slice('[list:'.length, -1)
    };
  }
  return { type: 'text', value: content };
}

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
  
  // Slash Commands (Workflows)
  const { templates } = useTemplates();
  const [showCommands, setShowCommands] = useState(false);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  // Nota: La suscripción realtime está en page.tsx, aquí solo scroll al fondo
  // cuando llegue un nuevo mensaje se propagará por el estado global

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
        setShowCommands(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReplyText(value);

    if (value.startsWith('/')) {
      const query = value.slice(1).toLowerCase();
      const filtered = templates.filter(t => 
        t.is_active && (
          t.id.toLowerCase().includes(query) || 
          (t.trigger && t.trigger.toLowerCase().includes(query)) ||
          t.name.toLowerCase().includes(query)
        )
      );
      setFilteredTemplates(filtered);
      setShowCommands(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowCommands(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredTemplates.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredTemplates.length) % filteredTemplates.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectTemplate(filteredTemplates[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowCommands(false);
      }
    }
  };

  const selectTemplate = (template: Template) => {
    setReplyText(template.trigger || template.id);
    setShowCommands(false);
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
            {selectedConversation.messages.map((message, idx) => {
              const isUser = message.role === 'user';
              const parsed = parseInteractiveContent(message.content);
              const isInteractive = parsed.type !== 'text';

              // Mensaje de usuario con botón/lista seleccionada
              if (isUser && isInteractive) {
                const buttonLabel = parsed.value.replace(/_/g, ' ').toUpperCase();
                const icon = parsed.type === 'button' ? '🔘' : '📋';

                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm bg-gradient-to-br from-green-500 to-green-600 text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <p className="text-[10px] text-green-100 uppercase tracking-wider mb-0.5">
                            Seleccionaste:
                          </p>
                          <p className="text-sm font-semibold leading-relaxed">
                            {buttonLabel}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1.5 text-[10px] text-right text-green-100">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              }

              // Mensaje del asistente con botones/listas
              if (!isUser && isInteractive) {
                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm bg-white text-slate-800 ring-1 ring-slate-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🤖</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {parsed.type === 'button' ? 'Botones' : 'Lista de opciones'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-medium">
                          {parsed.type === 'button' ? '🔘' : '📋'}
                          {parsed.value}
                        </div>
                      </div>
                      <div className="mt-1.5 text-[10px] text-right text-slate-400">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              }

              // Mensaje de texto normal o PDF loggeado
              const isPDF = !isUser && message.content.includes('📄 [PDF:');
              
              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                        : isPDF 
                          ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100 border-l-4 border-blue-500' 
                          : 'bg-white text-slate-800 ring-1 ring-slate-200'
                    }`}
                  >
                    {isPDF ? (
                      <div className="flex items-start gap-3 py-1">
                        <span className="text-2xl">📋</span>
                        <div>
                          <p className="font-bold text-sm tracking-tight">Documento Entregado</p>
                          <p className="text-xs opacity-80 mt-1 leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    )}
                    <div className={`mt-1.5 text-[10px] text-right ${isUser ? 'text-green-100' : isPDF ? 'text-blue-500' : 'text-slate-400'}`}>
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
      <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 relative">
        {/* Menu de comandos / workflows */}
        {showCommands && (
          <div className="absolute bottom-full left-5 mb-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workflows / Plantillas
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredTemplates.map((t, index) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTemplate(t)}
                  className={`flex w-full flex-col px-4 py-2.5 text-left transition ${
                    index === selectedIndex ? 'bg-green-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">/{t.trigger || t.id}</span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{t.category}</span>
                  </div>
                  <div className="truncate text-xs text-slate-500">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendReply} className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-xl">💬</span>
            <input
              value={replyText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={!selectedConversation || !selectedPhone || sending}
              placeholder={
                selectedConversation
                  ? 'Escribe tu respuesta o usa / para workflows...'
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