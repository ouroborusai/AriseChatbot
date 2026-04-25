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
    <div className="loop-card-light bg-white border-none shadow-xl overflow-hidden rounded-[40px] p-8 md:p-12 mb-16 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px] md:min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Master_Identity</th>
              <th className="hidden md:table-cell pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Metadata_Stack</th>
              <th className="hidden lg:table-cell pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] text-center">Protocol_Segment</th>
              <th className="hidden md:table-cell pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Registry_Date</th>
              <th className="pb-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="py-10"><div className="w-56 h-12 bg-slate-100 animate-pulse rounded-2xl" /></td>
                  <td className="hidden md:table-cell py-10"><div className="w-32 h-6 bg-slate-100 animate-pulse rounded-xl" /></td>
                  <td className="hidden lg:table-cell py-10 text-center"><div className="w-24 h-8 bg-slate-100 animate-pulse mx-auto rounded-full" /></td>
                  <td className="hidden md:table-cell py-10"><div className="w-32 h-6 bg-slate-100 animate-pulse rounded-xl" /></td>
                  <td className="py-10 text-right"><div className="w-12 h-12 bg-slate-100 animate-pulse ml-auto rounded-2xl" /></td>
                </tr>
              ))
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="group hover:bg-slate-50 transition-all cursor-pointer">
                  <td className="py-10" onClick={() => onOpenChat(contact)}>
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-slate-50 text-slate-500 rounded-[22px] flex items-center justify-center font-black text-xs border border-slate-100 shadow-sm group-hover:bg-green-500 group-hover:text-white group-hover:border-transparent transition-all duration-500 group-hover:shadow-md">
                        {contact.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <span className="text-[15px] font-black text-slate-900 uppercase tracking-tight italic group-hover:text-green-600 transition-colors">{contact.full_name || 'Anonymous_Node'}</span>
                        <p className="md:hidden text-[9px] font-mono font-black text-slate-600 mt-1 uppercase tracking-widest">{contact.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell py-10">
                    <p className="text-[11px] font-mono font-black text-slate-900 tracking-tighter">{contact.phone}</p>
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
                          'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
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
                    <button className="w-12 h-12 flex ml-auto items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl hover:border-green-500/30 hover:text-green-500 hover:bg-white transition-all group/btn shadow-sm">
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
