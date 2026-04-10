'use client';

import React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '' }: SearchInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none ${className}`}
    />
  );
}