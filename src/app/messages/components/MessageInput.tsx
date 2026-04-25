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
    <div className="p-4 bg-slate-50/50 backdrop-blur-xl border-t border-slate-100 shrink-0">
      <div className="max-w-3xl mx-auto flex items-center gap-2 bg-white p-1.5 rounded-xl focus-within:ring-2 focus-within:ring-[#22c55e]/10 transition-all shadow-sm border border-slate-100">
        <input
          type="text"
          placeholder="INTERVENCIÓN_HUMANA_..."
          className="flex-1 bg-transparent border-none py-2 px-3.5 text-[9px] font-black uppercase tracking-widest outline-none placeholder:text-slate-200 text-slate-900"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="p-3 bg-[#0f172a] hover:bg-[#22c55e] disabled:bg-slate-50 text-white rounded-lg transition-all flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
