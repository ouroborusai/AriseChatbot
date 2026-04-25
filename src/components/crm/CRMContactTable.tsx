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
    <div className="bg-white border border-slate-100 shadow-sm overflow-hidden rounded-2xl relative">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px] md:min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-[0.4em]">Master_Identity</th>
              <th className="hidden md:table-cell px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-[0.4em]">Metadata_Stack</th>
              <th className="hidden lg:table-cell px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] text-center">Protocol_Segment</th>
              <th className="hidden md:table-cell px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-[0.4em]">Registry_Date</th>
              <th className="px-6 py-4 text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><div className="w-32 h-8 bg-slate-50 animate-pulse rounded-lg" /></td>
                  <td className="hidden md:table-cell px-6 py-4"><div className="w-24 h-4 bg-slate-50 animate-pulse rounded-md" /></td>
                  <td className="hidden lg:table-cell px-6 py-4 text-center"><div className="w-20 h-6 bg-slate-50 animate-pulse mx-auto rounded-full" /></td>
                  <td className="hidden md:table-cell px-6 py-4"><div className="w-24 h-4 bg-slate-50 animate-pulse rounded-md" /></td>
                  <td className="px-6 py-4 text-right"><div className="w-8 h-8 bg-slate-50 animate-pulse ml-auto rounded-lg" /></td>
                </tr>
              ))
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="group hover:bg-slate-50 transition-all cursor-pointer">
                  <td className="px-6 py-4" onClick={() => onOpenChat(contact)}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center font-black text-[10px] border border-slate-100 shadow-sm group-hover:bg-[#22c55e] group-hover:text-white group-hover:border-transparent transition-all">
                        {contact.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight group-hover:text-[#22c55e] transition-colors">{contact.full_name || 'Anonymous_Node'}</span>
                        <p className="md:hidden text-[7px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">{contact.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                    <p className="text-[9px] font-black text-slate-700 tracking-tight">{contact.phone}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{contact.email || 'NO_COMMS'}</p>
                      {contact.companies?.name && (
                        <span className="text-[6px] font-black bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                          {contact.companies.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 text-center">
                    <div className="relative inline-block group/select">
                      <select 
                        value={contact.category || 'lead'}
                        onChange={(e) => onUpdateSegment(contact.id, e.target.value)}
                        className={`text-[7px] font-black px-4 py-1.5 rounded-lg border appearance-none cursor-pointer outline-none transition-all shadow-sm tracking-widest uppercase \${
                          contact.category === 'client' ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20' : 
                          contact.category === 'family' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}
                      >
                        <option value="lead">LEAD_STG</option>
                        <option value="client">ELITE_NODE</option>
                        <option value="family">FAMILY_LINK</option>
                      </select>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(contact.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="w-8 h-8 flex ml-auto items-center justify-center bg-white border border-slate-100 text-slate-300 rounded-lg hover:border-[#22c55e] hover:text-[#22c55e] transition-all group/btn">
                      <ArrowUpRight size={14} />
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
