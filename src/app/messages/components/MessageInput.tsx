'use client';

import React from 'react';
import { Send, Zap } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function MessageInput({ value, onChange, onSend, disabled }: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim() && !disabled) {
      onSend();
    }
  };

  return (
    <div className="p-8 lg:p-10 bg-slate-50/40 backdrop-blur-3xl border-t border-slate-100 shrink-0 relative z-20">
      <div
        className="max-w-4xl mx-auto flex items-center gap-4 bg-white p-3 focus-within:ring-4 focus-within:ring-[#22c55e]/20 transition-all shadow-2xl border border-slate-200 overflow-hidden group"
        style={{ borderRadius: 40 }}
      >
        <input
          type="text"
          placeholder="INTERVENCIÓN_HUMANA_..."
          className="flex-1 bg-transparent border-none py-5 px-8 text-[11px] font-black uppercase tracking-[0.2em] outline-none placeholder:text-slate-300 text-neural-dark italic"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="w-16 h-16 bg-[#1a1a1a] hover:bg-[#22c55e] disabled:bg-slate-100 disabled:text-slate-400 text-white transition-all duration-500 flex items-center justify-center shadow-lg active:scale-95 group-hover:scale-[1.02]"
          style={{ borderRadius: 40 }}
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
      <div className="mt-8 flex justify-center items-center gap-3">
         <Zap size={12} className="text-[#22c55e] animate-pulse" />
         <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em] italic">
           Terminal_Segura_v12.0_Diamond
         </p>
      </div>
    </div>
  );
}
