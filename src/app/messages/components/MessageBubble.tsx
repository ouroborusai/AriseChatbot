'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { parseUIMessageContent } from '@/lib/whatsapp-parser';

interface Message {
  id: string;
  content: string;
  sender_type: 'bot' | 'user' | 'agent';
  created_at: string;
  conversation_id: string;
}

interface MessageBubbleProps {
  message: Message;
  index: number;
  onSendMessage: (content: string) => void;
}

export function MessageBubble({ message, index, onSendMessage }: MessageBubbleProps) {
  const isAI = message.sender_type === 'bot';
  const { textParts, buttonParts } = parseUIMessageContent(message.content);

  return (
    <div key={message.id || index} className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`max-w-[75%] space-y-2`}>
        <div className={`p-6 rounded-[28px] shadow-sm relative overflow-hidden ${
          isAI
            ? 'bg-slate-900 text-white rounded-tl-none'
            : 'bg-white text-slate-900 rounded-tr-none border border-slate-100 shadow-xl shadow-slate-200/20'
        }`}>
          {isAI && (
            <div className="flex items-center gap-2 mb-3 text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Arise_Neural_Engine</span>
            </div>
          )}

          <div className="space-y-4">
            {textParts.map((text, tidx) => (
              <p key={tidx} className={`text-[13px] leading-relaxed whitespace-pre-wrap ${isAI ? 'font-medium' : 'font-medium text-slate-600'}`}>
                {text}
              </p>
            ))}
            {buttonParts.map((group, gidx) => (
              <div key={gidx} className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-white/10">
                {group.map((btn, bidx) => (
                  <button
                    key={bidx}
                    onClick={() => onSendMessage(btn)}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2"
                  >
                    {btn}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <span className={`block mt-4 text-[9px] font-black uppercase tracking-tighter opacity-40 ${isAI ? 'text-left' : 'text-right'}`}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
