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
  type: 'button' | 'list' | 'user_reply' | 'text';
  body: string;
  data?: any;
} {
  // Caso 1: Respuesta del usuario a un botón/lista
  if (content.startsWith('[interactive:') && content.endsWith(']')) {
    return {
      type: 'user_reply',
      body: content.slice('[interactive:'.length, -1).replace(/_/g, ' ')
    };
  }

  // Caso 2: Menú de botones enviado por el asistente
  if (content.includes('[buttons:')) {
    const parts = content.split('[buttons:');
    const bodyText = parts[0].trim();
    try {
      const data = JSON.parse(parts[1].split(']')[0]);
      return { type: 'button', body: bodyText, data };
    } catch (e) {
      return { type: 'text', body: content };
    }
  }

  // Caso 3: Menú de lista enviado por el asistente
  if (content.includes('[list:')) {
    const parts = content.split('[list:');
    const bodyText = parts[0].trim();
    try {
      const data = JSON.parse(parts[1].split(']')[0]);
      return { type: 'list', body: bodyText, data };
    } catch (e) {
      return { type: 'text', body: content };
    }
  }

  return { type: 'text', body: content };
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
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPhone) return;

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `manual-attachments/${selectedPhone}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setAttachedFile({
        url: publicUrl,
        name: file.name,
        type: file.type
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      setSendResult({ error: 'Error al cargar el archivo' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSendReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPhone || (!replyText.trim() && !attachedFile)) return;

    setSending(true);
    setSendResult(null);

    try {
      const isImage = attachedFile?.type.startsWith('image/');
      
      const payload: any = {
        phone_number: selectedPhone,
        message: replyText.trim(),
      };

      if (attachedFile) {
        if (isImage) {
          payload.image_url = attachedFile.url;
        } else {
          payload.document_url = attachedFile.url;
          payload.document_name = attachedFile.name;
        }
      }

      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSendResult({ success: true });
        setReplyText('');
        setAttachedFile(null);
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
        <div className="flex items-center gap-2 md:gap-3">
          {/* Botón Volver (Móvil) - Mejorado */}
          {onBack && (
            <button 
              onClick={onBack}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 active:bg-slate-200 transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
          )}

          <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm md:text-base shadow-sm">
            {selectedConversation ? selectedConversation.label[0].toUpperCase() : 'W'}
          </div>
          
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm font-bold text-slate-900 truncate tracking-tight uppercase">
              {selectedConversation ? selectedConversation.label : 'Hilo de Mensajería'}
            </p>
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${selectedConversation ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                {selectedConversation
                  ? `SESIÓN ACTIVA`
                  : 'SISTEMA EN ESPERA'}
              </p>
            </div>
          </div>
          
          {/* Toggle Chatbot - Sólido y Responsivo */}
          {selectedConversation && (
            <button
              onClick={handleToggleChatbot}
              disabled={loadingToggle}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 md:px-3 md:py-1.5 text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-colors border ${
                chatbotEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {loadingToggle ? '...' : chatbotEnabled ? '🤖 AUTO' : '👤 MANUAL'}
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
                    {parsed.type === 'user_reply' ? (
                       <div className="flex items-center gap-4 py-1">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm ${isUser ? 'bg-white/10' : 'bg-slate-100'}`}>
                            🔘
                          </div>
                          <div>
                            <p className={`text-[8px] uppercase tracking-[0.2em] font-black mb-0.5 ${isUser ? 'text-white/40' : 'text-slate-400'}`}>Usuario Seleccionó:</p>
                            <p className="text-[11px] font-black uppercase tracking-widest">{parsed.body}</p>
                          </div>
                       </div>
                    ) : parsed.type === 'button' ? (
                      <div className="flex flex-col gap-3">
                         <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium tracking-tight">{parsed.body}</p>
                         <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                            {parsed.data?.map((btn: any) => (
                              <span key={btn.id} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-indigo-100">
                                {btn.title}
                              </span>
                            ))}
                         </div>
                      </div>
                    ) : parsed.type === 'list' ? (
                      <div className="flex flex-col gap-3">
                         <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium tracking-tight">{parsed.body}</p>
                         <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">📋</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{parsed.data?.buttonText || 'Opciones'}</span>
                            </div>
                            <div className="space-y-2">
                               {parsed.data?.sections?.map((sec: any, idx: number) => (
                                 <div key={idx} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{sec.title}</p>
                                    <div className="flex flex-col gap-1">
                                      {sec.rows?.map((row: any) => (
                                        <div key={row.id} className="text-[10px] font-bold text-slate-700 flex items-center gap-2">
                                          <span className="h-1 w-1 bg-slate-400 rounded-full" />
                                          {row.title}
                                        </div>
                                      ))}
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                    ) : isPDF ? (
                      <div className="flex flex-col gap-3">
                         <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl shadow-inner">📄</div>
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Auditoría Documental</span>
                         </div>
                         <p className="text-[14px] leading-relaxed font-bold italic opacity-90">{parsed.body}</p>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium tracking-tight">{parsed.body}</p>
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

      {/* Input de Respuesta Industrial - Más compacto en móvil */}
      {selectedConversation && (
        <div className="shrink-0 bg-white/80 backdrop-blur-md px-3 py-3 md:px-8 md:py-6 border-t border-slate-100">
          <form onSubmit={handleSendReply} className="relative mx-auto max-w-4xl">
            {/* Slash Commands */}
            {showCommands && (
              <div className="absolute bottom-full left-0 mb-4 w-full md:w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl z-20">
                <div className="bg-slate-900 px-4 py-2 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  Workflows Disponibles
                </div>
                <div className="max-h-48 md:max-h-64 overflow-y-auto">
                  {filteredTemplates.map((t, index) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTemplate(t)}
                      className={`flex w-full flex-col px-4 py-2.5 text-left transition ${
                        index === selectedIndex ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs md:text-sm font-black text-slate-900 tracking-tight">/{t.trigger || t.id}</span>
                        <span className="text-[8px] font-bold uppercase text-slate-400">[{t.category}]</span>
                      </div>
                      <div className="truncate text-[10px] md:text-xs font-medium text-slate-500">{t.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Previsualización de Adjunto */}
            {attachedFile && (
              <div className="absolute bottom-full left-0 mb-4 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white p-3 shadow-xl animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl shadow-inner">
                  {attachedFile.type.startsWith('image/') ? '🖼️' : '📄'}
                </div>
                <div className="flex flex-col">
                  <span className="max-w-[150px] truncate text-[10px] font-black uppercase tracking-tight text-slate-900">{attachedFile.name}</span>
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Archivo Listo</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <span className="text-xs">✕</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 md:gap-3">
              {/* Botón Adjuntar */}
              <label className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 ${uploadingFile ? 'animate-pulse' : ''}`}>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
                {uploadingFile ? (
                   <div className="h-4 w-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                ) : (
                  <span className="text-lg">📎</span>
                )}
              </label>

              <div className="flex-1 flex items-center gap-2 rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 md:px-4 md:py-2.5 shadow-inner group focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white transition-all">
                <input
                  value={replyText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  placeholder={attachedFile ? "Añadir un comentario..." : "Escribe un mensaje..."}
                  className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 py-1"
                />
              </div>
              <button
                type="submit"
                disabled={(!replyText.trim() && !attachedFile) || sending || uploadingFile}
                className="h-10 w-10 md:h-12 md:w-12 shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 transition-all hover:bg-slate-900 disabled:opacity-50 active:scale-95"
              >
                {sending ? (
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="text-lg md:text-xl">↗️</span>
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
