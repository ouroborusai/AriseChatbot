'use client';

import React, { useRef, useEffect } from 'react';

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
}

export default function MessageView({ selectedConversation }: MessageViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

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

      {/* Área de input (deshabilitada por ahora) */}
      <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-400">
          <span className="text-xl opacity-50">😊</span>
          <input
            disabled
            placeholder="Respuestas automáticas por WhatsApp"
            className="flex-1 bg-transparent text-sm text-slate-500 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
    </main>
  );
}