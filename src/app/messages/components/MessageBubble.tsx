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
    <div key={message.id || index} className={`flex ${isAI ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-6 duration-1000`}>
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 relative`}>
        
        <div className={`p-5 lg:p-8 rounded-xl shadow-xl relative overflow-hidden transition-all duration-500 border ${
          isAI
            ? 'bg-accent text-white rounded-tr-none border-white/5'
            : 'bg-white text-neural-dark rounded-tl-none border-slate-100 shadow-sm'
        }`}>
          
          <div className="space-y-3 relative z-10">
            {textParts.map((text, tidx) => (
              <p key={tidx} className={`text-[12px] lg:text-[13px] leading-relaxed whitespace-pre-wrap ${isAI ? 'font-black text-white italic' : 'font-black text-neural-dark tracking-tighter'}`}>
                {text}
              </p>
            ))}
            
            {buttonParts.map((group, gidx) => (
              <div key={gidx} className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-white/5">
                {group.map((btn, bidx) => (
                  <button
                    key={bidx}
                    onClick={() => onSendMessage(btn)}
                    className="px-6 py-3 bg-white/5 hover:bg-primary hover:text-white border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 flex items-center gap-3 shadow-lg group/btn text-white"
                  >
                    <span>{btn}</span>
                    <ArrowRight size={10} className="opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-2 group-hover/btn:translate-x-0" />
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* TIME AND STATUS INSIDE BUBBLE - PLATINUM STYLE */}
          <div className={`mt-6 flex items-center justify-end gap-3 opacity-40`}>
             <span className="text-[7px] font-black uppercase tracking-[0.3em] shrink-0 italic">
               {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
             {isAI && (
                <div className="flex items-center -space-x-1.5">
                   <ShieldCheck size={12} className="text-primary shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                   <ShieldCheck size={12} className="text-primary" />
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
