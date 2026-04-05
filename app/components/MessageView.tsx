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
    <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp-border/10 text-2xl font-semibold text-whatsapp-sidebar">
            {selectedConversation ? selectedConversation.label[0] : 'W'}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {selectedConversation ? selectedConversation.label : 'Selecciona una conversación'}
            </p>
            <p className="text-sm text-slate-500">
              {selectedConversation
                ? `${selectedConversation.messages.length} mensajes • Última actualización ${new Date(selectedConversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Ver los chats en la lista de la izquierda'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col bg-whatsapp-chatBg">
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {selectedConversation ? (
            <div className="flex flex-col gap-4">
              {selectedConversation.messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-[24px] px-5 py-4 shadow-sm ${isUser ? 'bg-whatsapp-userMessage text-slate-900' : 'bg-white text-slate-900'}`}>
                      <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                      <div className="mt-3 text-[11px] text-slate-400 text-right">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-10 text-center text-slate-500">
              Selecciona un chat para ver la conversación.
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-whatsapp-panel px-5 py-4">
          <div className="flex items-center gap-3 rounded-full border border-slate-300 bg-white px-4 py-3 text-slate-500 shadow-sm">
            <span className="text-xl">😊</span>
            <input
              disabled
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
            />
            <button disabled className="rounded-full bg-whatsapp-green px-4 py-2 text-sm font-semibold text-slate-950 opacity-40">
              Enviar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}