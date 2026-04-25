'use client';

import React from 'react';
import { Sparkles, Zap, Cpu, ArrowRight, ShieldCheck } from 'lucide-react';
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
  const isAI = message.sender_type === 'bot' || message.sender_type === 'agent';
  const { textParts, buttonParts } = parseUIMessageContent(message.content);

  return (
    <div key={message.id || index} className={`flex ${isAI ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`max-w-[85%] sm:max-w-[70%] space-y-1 relative`}>
        
        <div className={`p-2 lg:p-2.5 rounded-xl shadow-sm relative overflow-hidden transition-all duration-300 border ${
          isAI
            ? 'bg-[#0f172a] text-white rounded-tr-none border-white/5'
            : 'bg-white text-slate-900 rounded-tl-none border-slate-100'
        }`}>
          
          <div className="space-y-1.5 relative z-10">
            {textParts.map((text, tidx) => (
              <p key={tidx} className={`text-[10px] lg:text-[10.5px] leading-snug whitespace-pre-wrap ${isAI ? 'font-black text-white' : 'font-bold text-slate-900 tracking-tight'}`}>
                {text}
              </p>
            ))}
            
            {buttonParts.map((group, gidx) => (
              <div key={gidx} className="flex flex-wrap gap-1 pt-1.5 mt-1 border-t border-white/5">
                {group.map((btn, bidx) => (
                  <button
                    key={bidx}
                    onClick={() => onSendMessage(btn)}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-[#22c55e] hover:text-white border border-white/10 text-[6.5px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-sm group/btn text-white"
                  >
                    <span>{btn}</span>
                    <ArrowRight size={8} className="opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-1 group-hover/btn:translate-x-0" />
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* TIME AND STATUS INSIDE BUBBLE - WHATSAPP STYLE */}
          <div className={`mt-1.5 flex items-center justify-end gap-1 opacity-30`}>
             <span className="text-[6px] font-black uppercase tracking-widest shrink-0">
               {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
             {isAI && (
                <div className="flex items-center -space-x-1">
                   <ShieldCheck size={8} className="text-[#22c55e]" />
                   <ShieldCheck size={8} className="text-[#22c55e]" />
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
