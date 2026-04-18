'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  MessageSquare, 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';

const PAGE_SIZE = 10;

export default function CRMPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, activeChats: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCRMData = async (currentPage: number) => {
    setLoading(true);
    const activeCompanyId = typeof window !== 'undefined' ? localStorage.getItem('arise_active_company') : null;
    
    if (!activeCompanyId || activeCompanyId === 'null' || activeCompanyId === 'undefined') {
      setLoading(false);
      return;
    }

    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', activeCompanyId);
      
    setTotalCount(count || 0);

    const { data: contactData } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', activeCompanyId)
      .order('created_at', { ascending: false })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);
    
    const { count: activeCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('active_company_id', activeCompanyId)
      .eq('is_open', true);

    if (contactData) setContacts(contactData);
    setStats({ total: count || 0, activeChats: activeCount || 0 });
    setLoading(false);
  };

  useEffect(() => {
    fetchCRMData(page);
  }, [page]);

  const handleUpdateSegment = async (id: string, newSegment: string) => {
    const { error } = await supabase.from('contacts').update({ segment: newSegment }).eq('id', id);
    if (!error) setContacts(prev => prev.map(c => c.id === id ? { ...c, segment: newSegment } : c));
  };

  const filteredContacts = contacts.filter(c => 
    (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.phone_number?.includes(searchTerm) ||
     c.rut?.includes(searchTerm))
  );

  return (
    <main className="p-4 md:p-10">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-12">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inteligencia de Contactos</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Mapeo de Relaciones Industriales</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-none">
            <input 
              type="text" 
              placeholder="Consultar base de datos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="arise-input w-full lg:w-80 pl-12"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
          <button className="btn-arise flex items-center justify-center gap-3 w-full sm:w-auto">
            <UserPlus size={16} />
            <span>Nueva Entidad</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricSmall title="Registros Maestro" value={totalCount} icon={Users} loading={loading} />
        <MetricSmall title="Vínculos Neurales" value={stats.activeChats} icon={MessageSquare} active loading={loading} />
        <MetricSmall title="Estado de Sincronía" value="Online" icon={Activity} loading={loading} />
        <MetricSmall title="Integridad de Datos" value="99.9%" icon={ShieldCheck} loading={loading} />
      </div>

      <div className="arise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad Maestra</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Segmento de Protocolo</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Registro</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="p-8"><div className="w-48 h-10 arise-skeleton" /></td>
                  <td className="p-8"><div className="w-32 h-6 arise-skeleton" /></td>
                  <td className="p-8 text-center"><div className="w-24 h-6 arise-skeleton mx-auto rounded-full" /></td>
                  <td className="p-8"><div className="w-28 h-6 arise-skeleton" /></td>
                  <td className="p-8 text-right"><div className="w-10 h-10 arise-skeleton ml-auto" /></td>
                </tr>
              ))
            ) : filteredContacts.map((contact) => (
              <tr key={contact.id} className="group hover:bg-slate-50/50 transition-all">
                <td className="p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-[18px] flex items-center justify-center font-black text-sm uppercase shadow-xl shadow-slate-200">
                      {contact.name?.[0] || '?'}
                    </div>
                    <span className="text-sm font-black text-slate-900 tracking-tight">{contact.name || 'Nodo Anónimo'}</span>
                  </div>
                </td>
                <td className="p-8">
                  <p className="text-xs font-bold text-slate-900">{contact.phone_number}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{contact.rut || 'SIN-ID'}</p>
                </td>
                <td className="p-8 text-center">
                  <select 
                    value={contact.segment || 'prospecto'}
                    onChange={(e) => handleUpdateSegment(contact.id, e.target.value)}
                    className={`text-[9px] font-black px-5 py-2 rounded-full border-none appearance-none cursor-pointer outline-none transition-all shadow-sm ${
                      contact.segment === 'cliente' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' : 
                      contact.segment === 'familia' ? 'bg-indigo-50 text-indigo-600 shadow-indigo-100' : 
                      'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <option value="prospecto">PROSPECTO</option>
                    <option value="cliente">CLIENTE ELITE</option>
                    <option value="familia">NODO FAMILIAR</option>
                    <option value="admin">ADMIN SISTEMA</option>
                  </select>
                </td>
                <td className="p-8 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                  {new Date(contact.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="p-8 text-right">
                  <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#135bec] hover:text-white transition-all">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-8 border-t border-slate-50 flex justify-between items-center bg-slate-50/20">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Rango de Registros: {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount}
        </p>
        <div className="flex gap-3">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-12 h-12 arise-card flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all"><ArrowLeft size={18}/></button>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-12 h-12 arise-card flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all"><ArrowRight size={18}/></button>
        </div>
      </div>
     </div>
    </main>
  );
}

function MetricSmall({ title, value, icon: Icon, active, loading }: any) {
  if (loading) {
    return (
      <div className="arise-card p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="w-20 h-2 arise-skeleton" />
          <div className="w-10 h-10 arise-skeleton rounded-xl" />
        </div>
        <div className="w-16 h-8 arise-skeleton" />
      </div>
    );
  }
  return (
    <div className="arise-card p-6 group">
      <div className="flex justify-between items-start mb-6">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-50 text-slate-300 group-hover:text-primary group-hover:bg-primary/5'}`}>
          <Icon size={18} />
        </div>
      </div>
      <h3 className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{value}</h3>
    </div>
  );
}
