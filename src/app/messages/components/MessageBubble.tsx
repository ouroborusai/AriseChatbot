'use client';

import React from 'react';
import { Sparkles, Zap, Cpu, ArrowRight } from 'lucide-react';
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

  const BRAND_GREEN = "#22c55e";

  return (
    <div key={message.id || index} className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`max-w-[85%] sm:max-w-[70%] space-y-2 relative`}>
        
        {/* AVATAR / IDENTIFIER */}
        <div className={`flex items-center gap-3 mb-1 ${isAI ? 'justify-start' : 'justify-end'}`}>
           {isAI ? (
              <>
                 <div className="w-6 h-6 bg-[#25D366]/10 rounded-lg flex items-center justify-center border border-[#25D366]/20 shadow-sm">
                    <Cpu size={12} className="text-[#25D366]" />
                 </div>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Engine v2.5</span>
              </>
           ) : (
              <>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocolo Usuario</span>
                 <div className="w-6 h-6 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-sm">
                    <Zap size={12} className="text-slate-400" />
                 </div>
              </>
           )}
        </div>

        <div className={`p-6 lg:p-8 rounded-[28px] shadow-xl relative overflow-hidden transition-all duration-500 border ${
          isAI
            ? 'bg-white text-slate-900 rounded-tl-none border-white hover:border-[#25D366]/30'
            : 'bg-[#25D366] text-white rounded-tr-none border-[#25D366]/20 shadow-[#25D366]/10'
        }`}>
          
          <div className="space-y-4 relative z-10">
            {textParts.map((text, tidx) => (
              <p key={tidx} className={`text-[14px] leading-relaxed whitespace-pre-wrap ${isAI ? 'font-bold text-slate-900 tracking-tight' : 'font-black text-white'}`}>
                {text}
              </p>
            ))}
            
            {buttonParts.map((group, gidx) => (
              <div key={gidx} className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-slate-100">
                {group.map((btn, bidx) => (
                  <button
                    key={bidx}
                    onClick={() => onSendMessage(btn)}
                    className="px-5 py-3 bg-slate-50 hover:bg-[#25D366] hover:text-white border border-slate-100 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-3 shadow-sm group/btn text-slate-900"
                  >
                    <span>{btn}</span>
                    <ArrowRight size={12} className="opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-2 group-hover/btn:translate-x-0" />
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className={`mt-5 flex items-center gap-4 ${isAI ? 'justify-start' : 'justify-end'} opacity-40`}>
             <span className="text-[8px] font-black uppercase tracking-tighter shrink-0">
               {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
             {isAI && <Sparkles size={10} className="text-[#25D366]" />}
          </div>
        </div>
      </div>
    </div>
  );
}
