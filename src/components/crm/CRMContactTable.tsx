import React from 'react';
import { MoreHorizontal } from 'lucide-react';

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
    <div className="loop-card bg-white border-none shadow-arise overflow-hidden rounded-[24px] md:rounded-[32px] p-6 md:p-10">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px] md:min-w-[800px]">
          <thead>
            <tr>
              <th className="pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Master_Identity</th>
              <th className="hidden md:table-cell pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Metadata_Stack</th>
              <th className="hidden lg:table-cell pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Protocol_Segment</th>
              <th className="hidden md:table-cell pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Registry_Date</th>
              <th className="pb-8 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="py-6"><div className="w-48 h-10 loop-skeleton rounded-xl" /></td>
                  <td className="hidden md:table-cell py-6"><div className="w-32 h-6 loop-skeleton rounded-lg" /></td>
                  <td className="hidden lg:table-cell py-6 text-center"><div className="w-24 h-6 loop-skeleton mx-auto rounded-full" /></td>
                  <td className="hidden md:table-cell py-6"><div className="w-28 h-6 loop-skeleton rounded-lg" /></td>
                  <td className="py-6 text-right"><div className="w-10 h-10 loop-skeleton ml-auto rounded-lg" /></td>
                </tr>
              ))
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="group hover:bg-slate-50 transition-all cursor-pointer">
                  <td className="py-6 md:py-8" onClick={() => onOpenChat(contact)}>
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-[16px] flex items-center justify-center font-black text-xs shadow-md shadow-slate-200 group-hover:bg-primary group-hover:shadow-lg transition-all">
                        {contact.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <span className="text-[13px] md:text-[14px] font-black text-slate-900 uppercase tracking-tight group-hover:text-primary transition-colors">{contact.full_name || 'Anonymous_Node'}</span>
                        <p className="md:hidden text-[9px] font-mono text-slate-400 mt-1">{contact.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell py-6 md:py-8">
                    <p className="text-[11px] font-mono text-slate-900 font-medium">{contact.phone}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{contact.email || 'NO_COMMS'}</p>
                      {contact.companies?.name && (
                        <span className="text-[7px] font-black bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-md uppercase tracking-[0.2em]">
                          {contact.companies.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell py-6 md:py-8 text-center">
                    <select 
                      value={contact.category || 'lead'}
                      onChange={(e) => onUpdateSegment(contact.id, e.target.value)}
                      className={`text-[8px] font-black px-4 py-2 rounded-lg border border-slate-100 appearance-none cursor-pointer outline-none transition-all shadow-sm \${
                        contact.category === 'client' ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50' : 
                        contact.category === 'family' ? 'bg-indigo-50/50 text-indigo-600 border-indigo-100/50' : 
                        'bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <option value="lead">LEAD</option>
                      <option value="client">ELITE_NODE</option>
                      <option value="family">FAMILY_LINK</option>
                    </select>
                  </td>
                  <td className="hidden md:table-cell py-6 md:py-8 text-[10px] font-mono text-slate-400 font-medium">
                    {new Date(contact.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-6 md:py-8 text-right">
                    <button className="w-10 h-10 flex ml-auto items-center justify-center bg-white border border-slate-100 text-slate-400 rounded-[12px] hover:border-primary hover:text-primary transition-all shadow-sm">
                      <MoreHorizontal size={16} />
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
