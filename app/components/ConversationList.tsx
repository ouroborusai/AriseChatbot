'use client';

import React from 'react';

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

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedPhone: string | null;
  onSelect: (phone: string) => void;
}

export default function ConversationList({ conversations, selectedPhone, onSelect }: ConversationListProps) {
  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-whatsapp-panel shadow-xl shadow-slate-200/30">
      <div className="border-b border-slate-200 bg-whatsapp-sidebar px-5 py-4 text-white">
        <h2 className="text-lg font-semibold">Conversaciones</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <div className="rounded-[28px] bg-white p-6 text-slate-600 shadow-sm">
              No hay conversaciones aún.
            </div>
          ) : (
            conversations.map((conversation) => {
              const active = selectedPhone === conversation.phone;
              return (
                <button
                  key={conversation.phone}
                  type="button"
                  onClick={() => onSelect(conversation.phone)}
                  className={`w-full rounded-[28px] border px-4 py-4 text-left transition ${
                    active ? 'border-whatsapp-border bg-whatsapp-messageBg' : 'border-slate-200 bg-white hover:border-whatsapp-border/60 hover:bg-whatsapp-messageHover'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{conversation.label}</p>
                      <p className="mt-1 text-sm text-slate-500">{conversation.phone}</p>
                    </div>
                    <span className="rounded-full bg-whatsapp-border/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-whatsapp-sidebar">
                      {conversation.messages.length}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500 line-clamp-2">{conversation.preview}</p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}