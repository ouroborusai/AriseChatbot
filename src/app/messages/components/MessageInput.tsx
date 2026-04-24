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
    <div className="p-8 bg-white/20 backdrop-blur-xl border-t border-white shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
      <div className="max-w-4xl mx-auto flex items-center gap-4 bg-white/60 p-3 rounded-[28px] focus-within:ring-2 focus-within:ring-[#25D366]/20 transition-all shadow-sm border border-white">
        <input
          type="text"
          placeholder="INTERVENCIÓN_HUMANA_..."
          className="flex-1 bg-transparent border-none py-3 px-5 text-[11px] font-black uppercase tracking-widest outline-none placeholder:text-slate-300 text-slate-900"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="p-4 bg-[#25D366] hover:bg-[#1fb355] disabled:bg-slate-100 text-white rounded-[20px] transition-all shadow-xl shadow-[#25D366]/20 hover:scale-105 active:scale-95 flex items-center justify-center italic"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
