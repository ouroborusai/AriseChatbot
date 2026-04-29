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
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import useSWR from 'swr';

const PAGE_SIZE = 10;

export default function CRMPage() {
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const activeCompanyId = activeCompany?.id;

  const fetchCRMData = async (companyId: string, currentPage: number) => {
    const isGlobal = companyId === 'global';

    let countQuery = supabase.from('contacts').select('*', { count: 'estimated', head: true });
    if (!isGlobal) countQuery = countQuery.eq('company_id', companyId);

    let contactQuery = supabase
      .from('contacts')
      .select('*, companies(name)');

    if (!isGlobal) contactQuery = contactQuery.eq('company_id', companyId);
    
    let chatsQuery = supabase.from('conversations').select('*', { count: 'estimated', head: true }).eq('status', 'open');
    if (!isGlobal) chatsQuery = chatsQuery.eq('company_id', companyId);

    const [
      { count },
      { data: contactData, error: contactError },
      chatsResult
    ] = await Promise.all([
      countQuery,
      contactQuery
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1),
      chatsQuery
    ]);

    if (contactError) throw contactError;

    return {
      totalCount: count || 0,
      contacts: contactData || [],
      activeChats: chatsResult?.count || 0
    };
  };

  const { data, error, mutate, isLoading: isSwrLoading } = useSWR(
    !isContextLoading && activeCompanyId ? `crm_${activeCompanyId}_${page}` : null,
    () => fetchCRMData(activeCompanyId!, page),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const loading = isContextLoading || isSwrLoading || !data;
  const contacts = data?.contacts || [];
  const totalCount = data?.totalCount || 0;
  const stats = { total: totalCount, activeChats: data?.activeChats || 0 };

  const fetchMessages = async (contactId: string) => {
    if (!activeCompanyId) return null;

    let query = supabase
      .from('conversations')
      .select('id, status')
      .eq('contact_id', contactId);
    
    if (activeCompanyId !== 'global') {
      query = query.eq('company_id', activeCompanyId);
    }

    const { data: conv } = await query
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

    let query = supabase
      .from('conversations')
      .select('id, status')
      .eq('contact_id', selectedContact.id);
    
    if (activeCompanyId !== 'global') {
      query = query.eq('company_id', activeCompanyId);
    }

    const { data: conv } = await query
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
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  const handleUpdateSegment = async (id: string, newCategory: string) => {
    const { error } = await supabase.from('contacts').update({ category: newCategory }).eq('id', id);
    if (!error) {
      mutate({
        ...data!,
        contacts: contacts.map(c => c.id === id ? { ...c, category: newCategory } : c)
      }, false);
    }

  };

  const filteredContacts = contacts.filter(c => 
    (c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.phone?.includes(searchTerm) ||
     c.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-300 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full -z-10" />

      {/* HEADER SECTION - ASLAS STYLE (Optimized Scales) */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-12 mb-24 px-4 relative z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="relative">
          <h1 className="text-h1-mobile md:text-h1 font-black text-neural-dark tracking-tighter leading-[0.85] uppercase italic">
            Centro de <br/><span className="text-primary drop-shadow-2xl">Contactos.</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-10 flex items-center gap-4 italic opacity-60">
            <Users size={16} className="text-primary animate-pulse" />
            NEURAL_RELATIONSHIP_MAPPING_//_v10.4_PLATINUM
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 relative z-10">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="BUSCAR_ENTIDAD_/_CLIENTE_..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="loop-input w-full lg:w-96 pl-14 pr-8 py-5 placeholder:text-slate-200"
            />
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors z-20" />
          </div>
          
          <button className="btn-loop flex items-center justify-center gap-5">
            <UserPlus size={18} />
            <span>AÑADIR_ENTIDAD</span>
          </button>
        </div>
      </header>

      {/* STATS SECTION */}
      <div className="mb-12 px-2">
        <CRMStats totalCount={totalCount} activeChats={stats.activeChats} loading={loading} />
      </div>

      {/* CONTACT TABLE */}
      <div className="px-2">
        <CRMContactTable 
          loading={loading} 
          contacts={filteredContacts} 
          onOpenChat={openChat} 
          onUpdateSegment={handleUpdateSegment} 
        />
      </div>

      {/* PAGINATION - COMPACT PLATINUM */}
      <div className="loop-card p-8 flex flex-col sm:flex-row justify-between items-center mt-12 gap-8 relative z-10">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-inner">
              <Layers size={16} className="text-slate-300" />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic opacity-60">
              Página <span className="text-neural-dark opacity-100">{page + 1}</span> // Registros <span className="text-primary opacity-100">{totalCount}</span>
           </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-14 h-14 bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 disabled:opacity-20 transition-all group shadow-sm" style={{ borderRadius: 'var(--radius-md)' }}>
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/>
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-14 h-14 bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 disabled:opacity-20 transition-all group shadow-sm" style={{ borderRadius: 'var(--radius-md)' }}>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
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
