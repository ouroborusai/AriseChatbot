'use client';

import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { parseUIMessageContent } from '@/lib/whatsapp-parser';
import type { Message } from '@/types/database';

interface MessageBubbleProps {
  message: Pick<Message, 'id' | 'content' | 'sender_type' | 'created_at'>;
  index?: number;
  onSendMessage?: (text: string) => void;
}

export function MessageBubble({ message, index, onSendMessage }: MessageBubbleProps) {
  const isAI = message.sender_type === 'bot' || message.sender_type === 'agent' || message.sender_type === 'system';
  const { textParts, buttonParts } = parseUIMessageContent(message.content || '');

  return (
    <div key={message.id || index} className={`flex ${isAI ? 'justify-end' : 'justify-start'} mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 w-full`}>
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 relative`}>
        <div
          className={`p-6 lg:p-8 shadow-xl relative overflow-hidden transition-all duration-500 border ${
            isAI
              ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[0_15px_40px_-10px_rgba(26,26,26,0.3)]'
              : 'bg-white text-[#1a1a1a] border-slate-100 shadow-sm'
          }`}
          style={{
            borderTopLeftRadius: isAI ? 40 : 0,
            borderTopRightRadius: isAI ? 0 : 40,
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40
          }}
        >
          <div className="space-y-4 relative z-10">
            {textParts.map((text: string, tidx: number) => (
              <p key={tidx} className={`text-[12px] lg:text-[13px] leading-relaxed whitespace-pre-wrap ${isAI ? 'font-black text-white italic' : 'font-black text-[#1a1a1a] tracking-tight'}`}>
                {text}
              </p>
            ))}
            {buttonParts.map((group: string[], gidx: number) => (
              <div key={gidx} className={`flex flex-wrap gap-2 pt-5 mt-5 border-t ${isAI ? 'border-white/10' : 'border-slate-100'}`}>
                {group.map((btn: string, bidx: number) => (
                  <button
                    key={bidx}
                    onClick={() => onSendMessage?.(btn)}
                    className={`px-6 py-4 hover:bg-[#22c55e] hover:text-white hover:border-[#22c55e] border text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3 shadow-sm group/btn ${
                      isAI ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                    style={{ borderRadius: 40 }}
                  >
                    <span>{btn}</span>
                    <ArrowRight size={10} className="opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-2 group-hover/btn:translate-x-0" />
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className={`mt-8 flex items-center justify-end gap-3 opacity-60 ${isAI ? 'text-white' : 'text-slate-400'}`}>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] shrink-0 italic">
              {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </span>
            {isAI && (
              <div className="flex items-center -space-x-1.5">
                <ShieldCheck size={14} className="text-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                <ShieldCheck size={14} className="text-[#22c55e]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
