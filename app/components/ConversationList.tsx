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
    <aside className="flex h-full w-80 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">Conversaciones</h2>
        <p className="text-xs text-slate-500 mt-0.5">{conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}</p>
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="space-y-1.5">
          {conversations.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-center">
              <div>
                <p className="text-2xl mb-2">💬</p>
                <p className="text-sm text-slate-500">Sin conversaciones</p>
              </div>
            </div>
          ) : (
            conversations.map((conversation) => {
              const active = selectedPhone === conversation.phone;
              return (
                <button
                  key={conversation.phone}
                  type="button"
                  onClick={() => onSelect(conversation.phone)}
                  className={`w-full rounded-xl px-3.5 py-3 text-left transition-all ${
                    active
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm ring-1 ring-green-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{conversation.label}</p>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 shrink-0">
                          {conversation.messages.length}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{conversation.phone}</p>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2 text-left">{conversation.preview}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}