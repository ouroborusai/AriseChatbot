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
    <div className="p-8 bg-white/80 backdrop-blur-xl border-t border-slate-100 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center gap-4 bg-slate-50 p-4 rounded-[32px] focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-inner border border-slate-100">
        <input
          type="text"
          placeholder="ESCRIBIR_COMO_AGENTE_HUMANO_..."
          className="flex-1 bg-transparent border-none py-2 px-4 text-[13px] font-medium outline-none placeholder:text-slate-300 text-slate-900"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="p-4 bg-primary hover:bg-primary-dark disabled:bg-slate-200 text-white rounded-[20px] transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
