'use client';

import React from 'react';
import type { Contact } from '@/lib/types';

interface ContactCardProps {
  contact: Contact;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ContactCard({ contact, isSelected = false, onClick }: ContactCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition ${
        isSelected
          ? 'bg-green-50 ring-1 ring-green-200'
          : 'hover:bg-slate-50'
      }`}
    >
      <p className="font-medium text-slate-900 truncate">
        {contact.name || `Cliente ${contact.phone_number.slice(-4)}`}
      </p>
      <p className="text-xs text-slate-500 truncate">{contact.phone_number}</p>
      {contact.segment && (
        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
          contact.segment === 'cliente' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {contact.segment === 'cliente' ? 'Cliente' : 'Prospecto'}
        </span>
      )}
    </button>
  );
}