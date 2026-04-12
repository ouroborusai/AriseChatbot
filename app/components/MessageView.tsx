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
  onBack?: () => void;
}

export default function MessageView({ selectedConversation, selectedPhone, onBack }: MessageViewProps) {
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
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-slate-50 relative">
      {/* Header del chat Sólido */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 z-10">
        <div className="flex items-center gap-3">
          {/* Botón Volver (Móvil) */}
          {onBack && (
            <button 
              onClick={onBack}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors"
            >
              ⬅️
            </button>
          )}

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-base shadow-sm">
            {selectedConversation ? selectedConversation.label[0].toUpperCase() : 'W'}
          </div>
          
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate tracking-tight uppercase">
              {selectedConversation ? selectedConversation.label : 'Hilo de Mensajería'}
            </p>
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${selectedConversation ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                {selectedConversation
                  ? `SESIÓN ACTIVA`
                  : 'SISTEMA EN ESPERA'}
              </p>
            </div>
          </div>
          
          {/* Toggle Chatbot - Sólido */}
          {selectedConversation && (
            <button
              onClick={handleToggleChatbot}
              disabled={loadingToggle}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors border ${
                chatbotEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {loadingToggle ? '...' : chatbotEnabled ? '🤖 Auto' : '👤 Manual'}
            </button>
          )}
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-12 no-scrollbar bg-slate-50/30">
        {!selectedConversation ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div className="max-w-sm">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white border border-slate-100 text-4xl mb-8 shadow-2xl shadow-slate-200/50">
                💬
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 leading-relaxed">Neural Communication Interface</p>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter leading-tight">Seleccione una frecuencia activa para interceptar comunicaciones.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {selectedConversation.messages.map((message) => {
              const isUser = message.role === 'user';
              const parsed = parseInteractiveContent(message.content);
              const isInteractive = parsed.type !== 'text';
              const isPDF = !isUser && message.content.includes('📄 [PDF:');
              
              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] md:max-w-[70%] rounded-2xl px-5 py-3 border shadow-sm transition-all ${
                      isUser
                        ? 'bg-slate-900 text-white border-slate-900 rounded-tr-none'
                        : isPDF 
                          ? 'bg-white text-slate-900 border-l-[4px] border-indigo-600 rounded-tl-none border-slate-200' 
                          : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                    }`}
                  >
                    {isInteractive ? (
                       <div className="flex items-center gap-4 py-2">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl ${isUser ? 'bg-white/10' : 'bg-slate-100'}`}>
                            {parsed.type === 'button' ? '🔘' : '📋'}
                          </div>
                          <div>
                            <p className={`text-[8px] uppercase tracking-[0.2em] font-black mb-1 ${isUser ? 'text-white/40' : 'text-slate-400'}`}>System Protocol:</p>
                            <p className="text-[11px] font-black uppercase tracking-widest">{parsed.value.replace(/_/g, ' ')}</p>
                          </div>
                       </div>
                    ) : isPDF ? (
                      <div className="flex flex-col gap-3">
                         <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl shadow-inner">📄</div>
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Auditoría Documental</span>
                         </div>
                         <p className="text-[14px] leading-relaxed font-bold italic opacity-90">{message.content}</p>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium tracking-tight">{message.content}</p>
                    )}
                    
                    <div className={`mt-3 text-[9px] font-black uppercase tracking-widest text-right ${isUser ? 'text-white/30' : 'text-slate-300'}`}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input de Respuesta Industrial */}
      {selectedConversation && (
        <div className="shrink-0 bg-white/80 backdrop-blur-md px-4 py-4 md:px-8 md:py-6 border-t border-slate-100">
          <form onSubmit={handleSendReply} className="relative mx-auto max-w-4xl">
            {/* Slash Commands */}
            {showCommands && (
              <div className="absolute bottom-full left-0 mb-4 w-full md:w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl z-20">
                <div className="bg-slate-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  Workflows Disponibles
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredTemplates.map((t, index) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTemplate(t)}
                      className={`flex w-full flex-col px-5 py-3 text-left transition ${
                        index === selectedIndex ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-black text-slate-900 tracking-tight">/{t.trigger || t.id}</span>
                        <span className="text-[9px] font-bold uppercase text-slate-400">[{t.category}]</span>
                      </div>
                      <div className="truncate text-xs font-medium text-slate-500">{t.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-inner group focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white transition-all">
                <input
                  value={replyText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  placeholder="Escribe un mensaje o usa / para comandos..."
                  className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 py-1"
                />
              </div>
              <button
                type="submit"
                disabled={!replyText.trim() || sending}
                className="h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 transition-all hover:bg-slate-900 disabled:opacity-50 active:scale-90"
              >
                {sending ? (
                  <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="text-xl">↗️</span>
                )}
              </button>
            </div>

            {sendResult && (
              <div className={`absolute bottom-full left-0 right-0 mb-6 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest text-center shadow-xl animate-in fade-in slide-in-from-bottom-4 ${
                sendResult.success ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {sendResult.success ? '🚀 Comando Ejecutado' : `❌ Error: ${sendResult.error}`}
              </div>
            )}
          </form>
        </div>
      )}
    </main>
  );
}
