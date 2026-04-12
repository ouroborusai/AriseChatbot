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
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto px-1 py-1 no-scrollbar">
        <div className="space-y-0.5">
          {conversations.length === 0 ? (
            <div className="flex flex-col h-40 items-center justify-center p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl mx-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Sin Canales Activos</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const active = selectedPhone === conversation.phone;
              return (
                <button
                  key={conversation.phone}
                  type="button"
                  onClick={() => onSelect(conversation.phone)}
                  className={`w-full px-4 py-3 text-left transition-colors border-b border-slate-50 ${
                    active ? 'bg-slate-100' : 'hover:bg-slate-50 active:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar Sólido */}
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold border ${active ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                      {conversation.label[0].toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-[13px] font-bold truncate tracking-tight ${active ? 'text-indigo-600' : 'text-slate-900'}`}>
                          {conversation.label}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400 tracking-tighter shrink-0">
                          {new Date(conversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] line-clamp-1 font-medium text-slate-500 tracking-tight">
                          {conversation.preview.startsWith('📄') ? '📎 Documento...' : conversation.preview}
                        </p>
                        {conversation.messages.length > 0 && !active && (
                          <span className="flex h-4 min-w-[16px] items-center justify-center rounded bg-indigo-500 px-1 text-[8px] font-bold text-white uppercase tracking-tighter">
                            {conversation.messages.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}