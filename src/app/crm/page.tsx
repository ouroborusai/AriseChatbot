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
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-8 mb-12">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">CRM_CORE</h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <Users size={10} className="text-primary" />
            Neural Relationship Mapping / v7.0
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-none">
            <input 
              type="text" 
              placeholder="QUER_CONTACTS_..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:w-96 pl-12 pr-6 py-4 bg-[#f2f4f6] text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-2xl outline-none focus:bg-white focus:shadow-arise transition-all"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
          <button className="flex items-center justify-center gap-4 bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <UserPlus size={16} />
            <span>Deploy_Entity</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
        <MetricSmall title="Registros Maestro" value={totalCount} icon={Users} loading={loading} />
        <MetricSmall title="Vínculos Neurales" value={stats.activeChats} icon={MessageSquare} active loading={loading} />
        <MetricSmall title="Estado de Sincronía" value="Online" icon={Activity} loading={loading} />
        <MetricSmall title="Integridad de Datos" value="99.9%" icon={ShieldCheck} loading={loading} />
      </div>

      <div className="arise-card bg-white border-none shadow-arise overflow-hidden rounded-[24px] md:rounded-[32px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px] md:min-w-[800px]">
          <thead>
            <tr>
              <th className="p-6 md:p-10 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Master_Identity</th>
              <th className="hidden md:table-cell p-6 md:p-10 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Metadata_Stack</th>
              <th className="hidden lg:table-cell p-6 md:p-10 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Protocol_Segment</th>
              <th className="hidden md:table-cell p-6 md:p-10 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Registry_Date</th>
              <th className="p-6 md:p-10 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="p-10"><div className="w-48 h-10 arise-skeleton rounded-xl" /></td>
                  <td className="p-10"><div className="w-32 h-6 arise-skeleton rounded-lg" /></td>
                  <td className="p-10 text-center"><div className="w-24 h-6 arise-skeleton mx-auto rounded-full" /></td>
                  <td className="p-10"><div className="w-28 h-6 arise-skeleton rounded-lg" /></td>
                  <td className="p-10 text-right"><div className="w-10 h-10 arise-skeleton ml-auto rounded-lg" /></td>
                </tr>
              ))
            ) : filteredContacts.map((contact) => (
              <tr key={contact.id} className="group hover:bg-[#f7f9fb] transition-all cursor-pointer">
                <td className="p-6 md:p-10" onClick={() => openChat(contact)}>
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-black text-xs md:text-sm uppercase shadow-xl shadow-slate-200 group-hover:bg-primary transition-all">
                      {contact.full_name?.[0] || '?'}
                    </div>
                    <div>
                      <span className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-primary transition-all">{contact.full_name || 'Anonymous_Node'}</span>
                      <p className="md:hidden text-[9px] font-mono text-slate-400 mt-1">{contact.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell p-10">
                  <p className="text-[11px] font-mono text-slate-900">{contact.phone}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{contact.email || 'NO_COMMS'}</p>
                    {contact.companies?.name && (
                      <span className="text-[7px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase tracking-[0.2em]">
                        {contact.companies.name}
                      </span>
                    )}
                  </div>
                </td>
                <td className="hidden lg:table-cell p-10 text-center">
                  <select 
                    value={contact.category || 'lead'}
                    onChange={(e) => handleUpdateSegment(contact.id, e.target.value)}
                    className={`text-[8px] font-black px-6 py-2 rounded-xl border-none appearance-none cursor-pointer outline-none transition-all shadow-sm ${
                      contact.category === 'client' ? 'bg-emerald-500/10 text-emerald-600' : 
                      contact.category === 'family' ? 'bg-indigo-500/10 text-indigo-600' : 
                      'bg-[#f2f4f6] text-slate-600'
                    }`}
                  >
                    <option value="lead">LEAD</option>
                    <option value="client">ELITE_NODE</option>
                    <option value="family">FAMILY_LINK</option>
                  </select>
                </td>
                <td className="hidden md:table-cell p-10 text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">
                  {new Date(contact.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="p-6 md:p-10 text-right">
                  <button className="w-14 h-14 flex items-center justify-center bg-[#f2f4f6] text-slate-400 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</div>

      <div className="p-6 md:p-10 flex flex-col sm:flex-row justify-between items-center bg-[#f7f9fb] mt-4 rounded-[24px] gap-6">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Registry_Range: {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} // Total: {totalCount}
        </p>
        <div className="flex gap-4">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-12 h-12 md:w-14 md:h-14 bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all rounded-2xl"><ArrowLeft size={18}/></button>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-12 h-12 md:w-14 md:h-14 bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all rounded-2xl"><ArrowRight size={18}/></button>
        </div>
      </div>

      {/* CHAT NEURAL SLIDE-OVER */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsChatOpen(false)} />
            <div className="relative w-full max-w-xl bg-white h-full flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden shadow-2xl">
              <header className="p-6 md:p-10 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-none">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="relative">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 text-white rounded-[18px] md:rounded-[24px] flex items-center justify-center font-black text-base md:text-lg shadow-2xl shadow-slate-200 uppercase italic">
                      {selectedContact?.full_name?.[0]}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-6 md:h-6 bg-emerald-500 border-2 md:border-[6px] border-white rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tighter leading-none mb-1 md:mb-3 italic uppercase">{selectedContact?.full_name}</h3>
                    <div className="flex items-center gap-2 md:gap-4">
                       <span className="flex items-center gap-2 px-2 py-0.5 md:px-3 md:py-1 rounded-lg bg-emerald-500/10 text-[7px] md:text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                         <Activity size={10} />
                         Live_Comm
                       </span>
                       <p className="text-[7px] md:text-[9px] font-mono text-slate-400">+{selectedContact?.phone}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#f7f9fb] hover:bg-rose-50 rounded-xl md:rounded-2xl transition-all text-slate-400 hover:text-rose-500">
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-10 bg-[#f7f9fb]/50 custom-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full opacity-10">
                    <MessageSquare size={80} strokeWidth={1} className="mb-6" />
                    <p className="text-[9px] font-black uppercase tracking-[1em]">Establishing_Link</p>
                  </div>
                )}
                {chatMessages.map((m, idx) => {
                  const isAgent = m.sender_type === 'agent';
                  const isBot = m.sender_type === 'bot';
                  const isClient = m.sender_type === 'user';
                  
                  return (
                    <div key={idx} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                      <div className={`group relative max-w-[90%] p-5 md:p-6 rounded-[24px] md:rounded-[28px] text-[12px] md:text-[13px] font-bold leading-relaxed shadow-sm transition-all hover:shadow-md ${
                        isClient 
                          ? 'bg-white text-slate-700 rounded-tl-none ring-1 ring-slate-100' 
                          : isBot
                            ? 'bg-[#191c1e] text-white rounded-tr-none'
                            : 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20'
                      }`}>
                        {(isBot || isAgent) && (
                          <div className={`flex items-center gap-3 mb-3 md:mb-4 text-[7px] font-black uppercase tracking-[0.3em] opacity-40 ${!isBot ? 'text-white/70' : ''}`}>
                            {isBot ? <Bot size={12} /> : <ShieldCheck size={12} />}
                            {isBot ? 'Arise_Neural_Engine' : 'Human_Supervisor'}
                          </div>
                        )}
                        <p className="tracking-tight">{m.content}</p>
                        <div className={`mt-3 md:mt-4 flex items-center gap-3 opacity-30 text-[8px] font-black uppercase tracking-widest`}>
                          {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 md:p-10 bg-white border-none shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                   <button 
                     onClick={toggleHandoff}
                     className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                       selectedContact?.convStatus === 'waiting_human'
                        ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200 rotate-0'
                        : 'bg-[#f2f4f6] text-slate-400 hover:bg-slate-200'
                     }`}
                   >
                     <Power className="w-4 h-4 md:w-5 md:h-5" />
                     {selectedContact?.convStatus === 'waiting_human' ? 'Manual_Control' : 'AI_Operational'}
                   </button>
                   <div className="text-[7px] md:text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] italic">
                     v7.0_Diamond_Protocol
                   </div>
                </div>
                
                <div className="relative">
                  <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={selectedContact?.convStatus === 'waiting_human' ? "Escribe como Agente Humano..." : "La IA responderá automáticamente..."}
                    className="w-full bg-[#f7f9fb] border-none rounded-[24px] md:rounded-[32px] p-6 md:p-8 pr-20 md:pr-24 text-[12px] md:text-[13px] font-bold text-slate-800 outline-none focus:bg-white focus:shadow-arise transition-all resize-none h-32 md:h-40"
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="absolute right-4 bottom-4 md:right-6 md:bottom-6 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#135bec] to-[#0045bd] text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-primary/40 disabled:opacity-20 disabled:grayscale"
                  >
                    <Send className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function MetricSmall({ title, value, icon: Icon, active, loading }: any) {
  if (loading) return <div className="arise-card p-6 md:p-10 bg-white border-none shadow-arise animate-pulse h-32 md:h-40" />;
  
  return (
    <div className={`arise-card p-5 md:p-10 border-none shadow-arise group ${active ? 'bg-gradient-to-br from-[#135bec] to-[#0045bd] text-white' : 'bg-white text-slate-900'}`}>
      <div className="flex justify-between items-start mb-6 md:mb-10">
        <p className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] ${active ? 'text-white/70' : 'text-slate-400'}`}>{title}</p>
        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-white/20' : 'bg-[#f7f9fb] text-slate-300 group-hover:text-primary group-hover:bg-primary/5'}`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>
      <h3 className="text-2xl md:text-4xl font-black tracking-tighter leading-none italic uppercase">{value}</h3>
    </div>
  );
}
