'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Search, 
  UserPlus, 
  ArrowLeft, 
  ArrowRight,
  Activity,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Filter
} from 'lucide-react';
import { CRMStats } from '@/components/crm/CRMStats';
import { CRMContactTable } from '@/components/crm/CRMContactTable';
import { ChatNeuralSlideOver } from '@/components/crm/ChatNeuralSlideOver';
import Image from 'next/image';

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
  const [isSending, setIsSending] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const fetchCRMData = async (currentPage: number) => {
    setLoading(true);
    const storedCompanyId = typeof window !== 'undefined' ? localStorage.getItem('arise_active_company') : null;

    if (!storedCompanyId || storedCompanyId === 'null' || storedCompanyId === 'undefined') {
      setLoading(false);
      return;
    }

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', storedCompanyId)
      .single();

    if (companyError || !companyData) {
      localStorage.removeItem('arise_active_company');
      setLoading(false);
      return;
    }

    const companyId = companyData.id;
    setActiveCompanyId(companyId);
    const isGlobal = companyId === 'global';

    try {
      let countQuery = supabase.from('contacts').select('*', { count: 'exact', head: true });
      if (!isGlobal) countQuery = countQuery.eq('company_id', companyId);
      const { count } = await countQuery;
      setTotalCount(count || 0);

      let contactQuery = supabase
        .from('contacts')
        .select('*, companies(name)');

      if (!isGlobal) contactQuery = contactQuery.eq('company_id', companyId);

      const { data: contactData, error: contactError } = await contactQuery
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (contactError) throw contactError;

      let activeCount = 0;
      try {
        let chatsQuery = supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'open');
        if (!isGlobal) chatsQuery = chatsQuery.eq('company_id', companyId);
        const { count: c } = await chatsQuery;
        activeCount = c || 0;
      } catch (e) {}

      if (contactData) setContacts(contactData);
      setStats({ total: count || 0, activeChats: activeCount });
    } catch (err) {
      console.error('CRM NODE ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (contactId: string) => {
    if (!activeCompanyId) return null;

    const { data: conv } = await supabase
      .from('conversations')
      .select('id, status')
      .eq('contact_id', contactId)
      .eq('company_id', activeCompanyId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conv) {
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

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setChatMessages([]);
    }
    return null;
  };

  const toggleHandoff = async () => {
    if (!selectedContact || !activeCompanyId) return;

    const { data: conv } = await supabase
      .from('conversations')
      .select('id, status')
      .eq('contact_id', selectedContact.id)
      .eq('company_id', activeCompanyId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conv) {
      const newStatus = conv.status === 'waiting_human' ? 'open' : 'waiting_human';
      const { error } = await supabase
        .from('conversations')
        .update({ status: newStatus })
        .eq('id', conv.id);

      if (!error) {
        setSelectedContact({ ...selectedContact, convStatus: newStatus });
      }
    }
  };

  const openChat = (contact: any) => {
    setSelectedContact(contact);
    setIsChatOpen(true);
    fetchMessages(contact.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || isSending) return;
    setIsSending(true);
    const content = newMessage;

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedContact.id, content })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNewMessage('');
    } catch (err) {
      console.error('[SEND ERROR]:', err);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchCRMData(page);
  }, [page]);

  useEffect(() => {
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

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
    <div className="flex flex-col w-full max-w-full py-6 md:py-12 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PREMIUM BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-green-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full -z-10" />

      {/* HEADER SECTION - DIAMOND v10.0 */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16 px-2">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]" />
             <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Gestión de Relaciones</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic uppercase">
            Centro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-500">Contactos</span>
          </h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-5 flex items-center gap-3">
            <Users size={12} className="text-green-500" />
            NEURAL RELATIONSHIP MAPPING / PROTOCOLO LOOP
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input 
              type="text" 
              placeholder="BUSCAR ENTIDAD / CLIENTE..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:w-96 pl-14 pr-6 py-4.5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white rounded-[24px] outline-none border border-white/10 focus:border-green-500/30 focus:bg-white/10 transition-all relative z-10"
            />
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 z-20" />
          </div>
          
          <button className="flex items-center justify-center gap-4 bg-white text-slate-900 px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-green-500 hover:text-white transition-all active:scale-95">
            <UserPlus size={18} />
            <span>Añadir Entidad</span>
          </button>
        </div>
      </header>

      {/* STATS SECTION */}
      <div className="mb-12 px-1">
        <CRMStats totalCount={totalCount} activeChats={stats.activeChats} loading={loading} />
      </div>

      {/* CONTACT TABLE */}
      <div className="px-1">
        <CRMContactTable 
          loading={loading} 
          contacts={filteredContacts} 
          onOpenChat={openChat} 
          onUpdateSegment={handleUpdateSegment} 
        />
      </div>

      {/* PAGINATION */}
      <div className="p-10 flex flex-col sm:flex-row justify-between items-center bg-white/5 backdrop-blur-xl mt-8 rounded-[40px] border border-white/5 border-dashed gap-10">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
              <Layers size={16} className="text-slate-500" />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
              Página <span className="text-white">{page + 1}</span> // Registros <span className="text-green-500">{totalCount}</span>
           </p>
        </div>
        <div className="flex gap-5">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-16 h-16 bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-green-500 disabled:opacity-20 transition-all rounded-2xl group shadow-2xl">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform"/>
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-16 h-16 bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-green-500 disabled:opacity-20 transition-all rounded-2xl group shadow-2xl">
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        </div>
      </div>

      <ChatNeuralSlideOver
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedContact={selectedContact}
        chatMessages={chatMessages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={sendMessage}
        onToggleHandoff={toggleHandoff}
        isSending={isSending}
      />
    </div>
  );
}
