'use client';

import React from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function MessageInput({ value, onChange, onSend, disabled }: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSend();
    }
  };

  return (
    <div className="p-8 lg:p-10 bg-slate-50/40 backdrop-blur-3xl border-t border-slate-100 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center gap-3 bg-white p-2.5 rounded-xl focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-xl border border-slate-100 overflow-hidden group">
        <input
          type="text"
          placeholder="INTERVENCIÓN_HUMANA_..."
          className="flex-1 bg-transparent border-none py-4 px-6 text-[11px] font-black uppercase tracking-[0.2em] outline-none placeholder:text-slate-200 text-neural-dark italic"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="w-14 h-14 bg-accent hover:bg-primary disabled:bg-slate-50 text-white rounded-xl transition-all duration-500 flex items-center justify-center shadow-xl active:scale-95 group-hover:scale-105"
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
      <div className="mt-4 flex justify-center">
         <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.5em] opacity-40 italic">Terminal_Segura_v10.4</p>
      </div>
    </div>
  );
}
