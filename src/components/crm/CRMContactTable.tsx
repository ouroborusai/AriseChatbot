import React from 'react';
import { MoreHorizontal, ArrowUpRight, ShieldCheck, Activity } from 'lucide-react';

import type { Contact } from '@/types/database';

export type CRMContactType = Pick<Contact, 'id' | 'full_name' | 'phone' | 'email' | 'category' | 'created_at'> & {
  companies?: { name: string };
};

interface CRMContactTableProps {
  loading: boolean;
  contacts: CRMContactType[];
  onOpenChat: (contact: CRMContactType) => void;
  onUpdateCategory: (id: string, newCategory: CRMContactType['category']) => void;
}

export function CRMContactTable({ loading, contacts, onOpenChat, onUpdateCategory }: CRMContactTableProps) {
  return (
    <div className="arise-card overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Master_Identity</th>
              <th className="hidden md:table-cell px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Metadata_Stack</th>
              <th className="hidden lg:table-cell px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-center italic opacity-60">Protocol_Segment</th>
              <th className="hidden md:table-cell px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Registry_Date</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-right italic opacity-60">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="px-8 py-8"><div className="w-48 h-10 bg-[#22c55e]/10 animate-pulse" style={{ borderRadius: 40 }} /></td>
                  <td className="hidden md:table-cell px-8 py-8"><div className="w-32 h-6 bg-[#22c55e]/10 animate-pulse" style={{ borderRadius: 40 }} /></td>
                  <td className="hidden lg:table-cell px-8 py-8 text-center"><div className="w-24 h-8 bg-[#22c55e]/10 animate-pulse mx-auto" style={{ borderRadius: 40 }} /></td>
                  <td className="hidden md:table-cell px-8 py-8"><div className="w-28 h-6 bg-[#22c55e]/10 animate-pulse" style={{ borderRadius: 40 }} /></td>
                  <td className="px-8 py-8 text-right"><div className="w-12 h-12 bg-[#22c55e]/10 animate-pulse ml-auto" style={{ borderRadius: 40 }} /></td>
                </tr>
              ))
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="group hover:bg-slate-50 transition-all cursor-pointer">
                  <td className="px-8 py-8" onClick={() => onOpenChat(contact)}>
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-50 text-slate-300 flex items-center justify-center font-black text-[12px] border border-slate-100 shadow-inner group-hover:bg-[#22c55e] group-hover:text-white group-hover:border-transparent transition-all duration-500 italic" style={{ borderRadius: 40 }}>
                        {contact.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <span className="text-[12px] font-black text-neural-dark uppercase tracking-tight group-hover:text-primary transition-colors italic">{contact.full_name || 'Anonymous_Node'}</span>
                        <p className="md:hidden text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest italic opacity-60">{contact.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-8 py-8">
                    <p className="text-[11px] font-black text-neural-dark tracking-tight italic opacity-80">{contact.phone}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">{contact.email || 'NO_COMMS'}</p>
                      {contact.companies?.name && (
                        <span className="text-[8px] font-black bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-2.5 py-1 uppercase tracking-widest italic shadow-sm" style={{ borderRadius: 40 }}>
                          {contact.companies.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-8 py-8 text-center">
                    <div className="relative inline-block group/select">
                      <select 
                        value={contact.category || 'lead'}
                        onChange={(e) => onUpdateCategory(contact.id, e.target.value as CRMContactType['category'])}
                        style={{ borderRadius: 40 }}
                        className={`text-[9px] font-black px-5 py-2 border appearance-none cursor-pointer outline-none transition-all shadow-sm tracking-[0.2em] uppercase italic ${
                          contact.category === 'client' ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30' : 
                          contact.category === 'family' ? 'bg-accent/10 text-white border-transparent bg-accent' : 
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}
                      >
                        <option value="lead">LEAD_STG</option>
                        <option value="client">ELITE_NODE</option>
                        <option value="family">FAMILY_LINK</option>
                      </select>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-8 py-8 text-[10px] font-black text-slate-300 uppercase tracking-widest italic opacity-60">
                    {new Date(contact.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                  </td>
                  <td className="px-8 py-8 text-right">
                    <button className="btn-arise w-12 h-12 flex ml-auto items-center justify-center">
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
