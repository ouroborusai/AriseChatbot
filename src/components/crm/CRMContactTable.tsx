import React from 'react';
import { MoreHorizontal, ArrowUpRight, ShieldCheck, Activity } from 'lucide-react';

interface CRMContact {
  id: string;
  full_name?: string;
  phone?: string;
  email?: string;
  category?: string;
  created_at: string;
  companies?: { name: string };
}

interface CRMContactTableProps {
  loading: boolean;
  contacts: CRMContact[];
  onOpenChat: (contact: CRMContact) => void;
  onUpdateSegment: (id: string, newCategory: string) => void;
}

export function CRMContactTable({ loading, contacts, onOpenChat, onUpdateSegment }: CRMContactTableProps) {
  return (
    <div className="loop-card bg-white/5 backdrop-blur-2xl border-white/5 shadow-2xl overflow-hidden rounded-[40px] p-8 md:p-12 mb-16 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px] md:min-w-[800px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Master_Identity</th>
              <th className="hidden md:table-cell pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Metadata_Stack</th>
              <th className="hidden lg:table-cell pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] text-center">Protocol_Segment</th>
              <th className="hidden md:table-cell pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Registry_Date</th>
              <th className="pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="py-10"><div className="w-56 h-12 bg-white/5 animate-pulse rounded-2xl" /></td>
                  <td className="hidden md:table-cell py-10"><div className="w-32 h-6 bg-white/5 animate-pulse rounded-xl" /></td>
                  <td className="hidden lg:table-cell py-10 text-center"><div className="w-24 h-8 bg-white/5 animate-pulse mx-auto rounded-full" /></td>
                  <td className="hidden md:table-cell py-10"><div className="w-32 h-6 bg-white/5 animate-pulse rounded-xl" /></td>
                  <td className="py-10 text-right"><div className="w-12 h-12 bg-white/5 animate-pulse ml-auto rounded-2xl" /></td>
                </tr>
              ))
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="group hover:bg-white/[0.02] transition-all cursor-pointer">
                  <td className="py-10" onClick={() => onOpenChat(contact)}>
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-white/5 text-slate-500 rounded-[22px] flex items-center justify-center font-black text-xs border border-white/5 shadow-xl group-hover:bg-green-500 group-hover:text-slate-900 group-hover:border-transparent transition-all duration-500">
                        {contact.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <span className="text-[15px] font-black text-white uppercase tracking-tight italic group-hover:text-green-500 transition-colors">{contact.full_name || 'Anonymous_Node'}</span>
                        <p className="md:hidden text-[9px] font-mono font-black text-slate-600 mt-1 uppercase tracking-widest">{contact.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell py-10">
                    <p className="text-[11px] font-mono font-black text-white tracking-tighter">{contact.phone}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{contact.email || 'NO_COMMS'}</p>
                      {contact.companies?.name && (
                        <span className="text-[7px] font-black bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-1 rounded-lg uppercase tracking-[0.2em]">
                          {contact.companies.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell py-10 text-center">
                    <div className="relative inline-block group/select">
                      <select 
                        value={contact.category || 'lead'}
                        onChange={(e) => onUpdateSegment(contact.id, e.target.value)}
                        className={`text-[8px] font-black px-6 py-2.5 rounded-xl border appearance-none cursor-pointer outline-none transition-all shadow-2xl tracking-[0.2em] \${
                          contact.category === 'client' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          contact.category === 'family' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                          'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <option value="lead">LEAD_STG</option>
                        <option value="client">ELITE_NODE</option>
                        <option value="family">FAMILY_LINK</option>
                      </select>
                    </div>
                  </td>
                  <td className="hidden md:table-cell py-10 text-[10px] font-mono font-black text-slate-600 uppercase tracking-widest">
                    {new Date(contact.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-10 text-right">
                    <button className="w-12 h-12 flex ml-auto items-center justify-center bg-white/5 border border-white/5 text-slate-600 rounded-2xl hover:border-green-500/30 hover:text-white hover:bg-white/10 transition-all group/btn">
                      <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
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
