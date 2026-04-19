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
  Activity,
  Send,
  X,
  Bot,
  User,
  Power
} from 'lucide-react';

const PAGE_SIZE = 10;

export default function CRMPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, activeChats: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const fetchCRMData = async (currentPage: number) => {
    setLoading(true);
    const activeCompanyId = typeof window !== 'undefined' ? localStorage.getItem('arise_active_company') : null;
    
    if (!activeCompanyId || activeCompanyId === 'null' || activeCompanyId === 'undefined') {
      setLoading(false);
      return;
    }

    const isGlobal = activeCompanyId === 'global';

    try {
      // 1. Contador Maestro
      let countQuery = supabase.from('contacts').select('*', { count: 'exact', head: true });
      if (!isGlobal) countQuery = countQuery.eq('company_id', activeCompanyId);
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // 2. Fetch Contactos con JOIN a empresas
      let contactQuery = supabase
        .from('contacts')
        .select('*, companies(name)');
      
      if (!isGlobal) contactQuery = contactQuery.eq('company_id', activeCompanyId);
      
      const { data: contactData, error: contactError } = await contactQuery
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);
      
      if (contactError) throw contactError;

      // 3. Vínculos Neurales (Conversaciones)
      let activeCount = 0;
      try {
        let chatsQuery = supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'open');
        if (!isGlobal) chatsQuery = chatsQuery.eq('company_id', activeCompanyId);
        const { count: c } = await chatsQuery;
        activeCount = c || 0;
      } catch (e) { console.warn('Legacy conversations schema'); }

      if (contactData) setContacts(contactData);
      setStats({ total: count || 0, activeChats: activeCount });
    } catch (err) {
      console.error('CRM NODE ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (contactId: string) => {
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, status')
      .eq('contact_id', contactId)
      .single();

    if (conv) {
      // Suscripción Realtime para esta conversación
      const channel = supabase
        .channel(`chat_${conv.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conv.id}`
        }, (payload) => {
          setChatMessages(prev => [...prev, payload.new]);
        })
        .subscribe();

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });
      
      if (msgs) setChatMessages(msgs);
      return () => { supabase.removeChannel(channel); };
    } else {
      setChatMessages([]);
    }
  };

  const toggleHandoff = async () => {
    if (!selectedContact) return;
    
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, status')
      .eq('contact_id', selectedContact.id)
      .single();

    if (conv) {
      const newStatus = conv.status === 'waiting_human' ? 'open' : 'waiting_human';
      const { error } = await supabase
        .from('conversations')
        .update({ status: newStatus })
        .eq('id', conv.id);
        
      if (!error) setSelectedContact({ ...selectedContact, convStatus: newStatus });
    }
  };

  const openChat = (contact: any) => {
    setSelectedContact(contact);
    setIsChatOpen(true);
    fetchMessages(contact.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    const content = newMessage;
    setNewMessage('');

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedContact.id, content })
      });
      
      const data = await res.json();
      if (data.error) alert(`Error de Transmisión: ${data.error}`);
    } catch (err) {
      console.error('SEND ERROR:', err);
    }
  };

  useEffect(() => {
    fetchCRMData(page);
  }, [page]);

  const handleUpdateSegment = async (id: string, newCategory: string) => {
    const { error } = await supabase.from('contacts').update({ category: newCategory }).eq('id', id);
    if (!error) setContacts(prev => prev.map(c => c.id === id ? { ...c, category: newCategory } : c));
  };

  const filteredContacts = contacts.filter(c => 
    (c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.phone?.includes(searchTerm) ||
     c.email?.toLowerCase().includes(searchTerm.toLowerCase()))
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
                <td className="p-8 cursor-pointer" onClick={() => openChat(contact)}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-[18px] flex items-center justify-center font-black text-sm uppercase shadow-xl shadow-slate-200 group-hover:bg-primary transition-all">
                      {contact.full_name?.[0] || '?'}
                    </div>
                    <span className="text-sm font-black text-slate-900 tracking-tight group-hover:text-primary transition-all">{contact.full_name || 'Nodo Anónimo'}</span>
                  </div>
                </td>
                <td className="p-8">
                  <p className="text-xs font-bold text-slate-900">{contact.phone}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{contact.email || 'SIN-MAIL'}</p>
                    {contact.companies?.name && (
                      <span className="text-[8px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded-md uppercase tracking-widest">
                        {contact.companies.name}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-8 text-center">
                  <select 
                    value={contact.category || 'lead'}
                    onChange={(e) => handleUpdateSegment(contact.id, e.target.value)}
                    className={`text-[9px] font-black px-5 py-2 rounded-full border-none appearance-none cursor-pointer outline-none transition-all shadow-sm ${
                      contact.category === 'client' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' : 
                      contact.category === 'family' ? 'bg-indigo-50 text-indigo-600 shadow-indigo-100' : 
                      'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <option value="lead">LEAD / PROSPECTO</option>
                    <option value="client">CLIENTE ELITE</option>
                    <option value="family">NODO FAMILIAR</option>
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

      {/* CHAT NEURAL SLIDE-OVER */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsChatOpen(false)} />
           <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden ring-1 ring-slate-200">
              <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-xl shadow-slate-200">
                      {selectedContact?.full_name?.[0]}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-none mb-2">{selectedContact?.full_name}</h3>
                    <div className="flex items-center gap-3">
                       <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                         <Activity size={10} />
                         Live
                       </span>
                       <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">+{selectedContact?.phone}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-300 hover:text-red-500">
                  <X size={20} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/40 custom-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full opacity-20">
                    <MessageSquare size={64} strokeWidth={1} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Iniciando Conexión</p>
                  </div>
                )}
                {chatMessages.map((m, idx) => {
                  const isAgent = m.sender_type === 'agent';
                  const isBot = m.sender_type === 'bot';
                  const isClient = m.sender_type === 'user';
                  
                  return (
                    <div key={idx} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                      <div className={`group relative max-w-[85%] p-5 rounded-3xl text-sm font-medium leading-relaxed shadow-sm transition-all hover:shadow-md ${
                        isClient 
                          ? 'bg-white text-slate-700 rounded-tl-none border border-slate-100' 
                          : isBot
                            ? 'bg-slate-900 text-slate-100 rounded-tr-none'
                            : 'bg-primary text-white rounded-tr-none'
                      }`}>
                        {isBot && (
                          <div className="flex items-center gap-2 mb-3 text-[8px] font-black uppercase tracking-widest opacity-40">
                            <Bot size={12} />
                            Arise Engine
                          </div>
                        )}
                        {isAgent && (
                          <div className="flex items-center gap-2 mb-3 text-[8px] font-black uppercase tracking-widest opacity-40 text-white/60">
                            <ShieldCheck size={12} />
                            Agente Humano
                          </div>
                        )}
                        <p>{m.content}</p>
                        <div className={`mt-3 flex items-center gap-3 border-t pt-3 ${isClient ? 'border-slate-50' : 'border-white/10'}`}>
                           <span className="text-[9px] font-bold opacity-30">
                             {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-5">
                   <button 
                     onClick={toggleHandoff}
                     className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                       selectedContact?.convStatus === 'waiting_human'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                     }`}
                   >
                     <Power size={14} />
                     {selectedContact?.convStatus === 'waiting_human' ? 'Control Humano Activo' : 'IA Operativa'}
                   </button>
                   <div className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                     Diamante v7.0 Core
                   </div>
                </div>
                
                <div className="relative">
                  <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={selectedContact?.convStatus === 'waiting_human' ? "Escribe como Agente Humano..." : "La IA responderá automáticamente..."}
                    className="w-full bg-slate-50/80 border border-slate-100 rounded-[32px] p-6 pr-20 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all resize-none h-32"
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="absolute right-4 bottom-4 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-xl shadow-primary/30 disabled:opacity-20 disabled:grayscale disabled:scale-100"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
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
