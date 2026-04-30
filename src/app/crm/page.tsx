'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Search, UserPlus, ArrowLeft, ArrowRight, Activity, Sparkles, ShieldCheck, Cpu, Layers, Filter } from 'lucide-react';
import { CRMStats } from '@/components/crm/CRMStats';
import { CRMContactTable } from '@/components/crm/CRMContactTable';
import { ChatNeuralSlideOver, ChatMessage } from '@/components/crm/ChatNeuralSlideOver';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import useSWR from 'swr';
import type { Message, Contact } from '@/types/database';

const PAGE_SIZE = 10;

export type CRMContactType = Pick<Contact, 'id' | 'full_name' | 'phone' | 'email' | 'category' | 'created_at'> & { companies?: { name: string } };

export default function CRMPage() {
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [selectedContact, setSelectedContact] = useState<CRMContactType | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const activeCompanyId = activeCompany?.id;

  const fetchCRMData = async (companyId: string, currentPage: number) => {
    const isGlobal = companyId === 'global';
    
    let countQuery = supabase.from('contacts').select('*', { count: 'exact', head: true });
    let dataQuery = supabase.from('contacts')
      .select('id, full_name, phone, email, category, created_at, companies(name)')
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)
      .order('created_at', { ascending: false });

    if (!isGlobal) {
        countQuery = countQuery.eq('company_id', companyId);
        dataQuery = dataQuery.eq('company_id', companyId);
    }

    const [{ count }, { data }] = await Promise.all([countQuery, dataQuery]);

    return { totalCount: count || 0, contacts: (data as unknown as CRMContactType[]) || [], activeChats: 0 };
  };

  const { data, error, mutate, isLoading: isSwrLoading } = useSWR(
    !isContextLoading && activeCompanyId ? `crm_${activeCompanyId}_${page}` : null,
    () => fetchCRMData(activeCompanyId!, page),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const loading = isContextLoading || isSwrLoading || !data;
  const contacts = data?.contacts || [];
  const totalCount = data?.totalCount || 0;
  const stats = { total: totalCount, activeChats: data?.activeChats || 0 };

  const fetchMessages = async (contactId: string) => {
    if (!activeCompanyId) return null;
    const { data: convData } = await supabase.from('conversations').select('id').eq('contact_id', contactId).eq('company_id', activeCompanyId).maybeSingle();
    
    if (convData) {
        const { data: msgs } = await supabase.from('messages').select('id, content, sender_type, created_at').eq('conversation_id', convData.id).order('created_at', { ascending: true });
        if (msgs) {
            setChatMessages(msgs as ChatMessage[]);
        }
    } else {
        setChatMessages([]);
    }
  };

  const toggleHandoff = async () => {
    if (!selectedContact || !activeCompanyId) return;
    const { data: convData } = await supabase.from('conversations').select('id, status').eq('contact_id', selectedContact.id).eq('company_id', activeCompanyId).maybeSingle();
    if (convData) {
        const newStatus = convData.status === 'waiting_human' ? 'open' : 'waiting_human';
        await supabase.from('conversations').update({ status: newStatus }).eq('id', convData.id);
    }
  };

  const openChat = (contact: CRMContactType) => {
    setSelectedContact(contact);
    setIsChatOpen(true);
    fetchMessages(contact.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || isSending || !activeCompanyId) return;
    setIsSending(true);
    const content = newMessage;
    setNewMessage('');
    
    try {
        await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactId: selectedContact.id, content, companyId: activeCompanyId })
        });
        await fetchMessages(selectedContact.id);
    } catch (err: unknown) {
        console.error(err);
    } finally {
        setIsSending(false);
    }
  };

  useEffect(() => {
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  const handleUpdateCategory = async (id: string, newCategory: CRMContactType['category']) => {
    const { error } = await supabase.from('contacts').update({ category: newCategory }).eq('id', id);
    if (!error && data) {
      mutate({ ...data, contacts: contacts.map(c => c.id === id ? { ...c, category: newCategory } : c) }, false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    (c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     c.phone?.includes(searchTerm) ||
     c.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-300 overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      
      <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-12 lg:mb-24 px-4 gap-6 relative z-10">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-neural-dark tracking-tighter uppercase italic">CRM <span className="text-primary drop-shadow-xl">Neural.</span></h1>
          <p className="text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] mt-6 flex items-center gap-4 italic opacity-60">
            <ShieldCheck size={14} className="text-primary" /> DIAMOND_RESILIENCE_SYNC_//_v11.9.1
          </p>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={16} />
            <input
              type="text"
              placeholder="IDENTIFICADOR_DE_NODO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-100 pl-14 pr-6 py-5 rounded-xl text-[10px] font-black uppercase italic tracking-widest outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-sm text-neural-dark placeholder:text-slate-300"
            />
          </div>
          <button className="flex-1 md:flex-none btn-loop flex items-center justify-center gap-3 w-full md:w-auto">
            <UserPlus size={16} />
            <span>NUEVO_NODO</span>
          </button>
        </div>
      </header>

      <div className="px-4 mb-16 relative z-10">
        <CRMStats loading={loading} totalCount={stats.total} activeChats={stats.activeChats} />
      </div>

      <div className="px-4 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
              <Layers size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-neural-dark italic">Nodos_Activos</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Total_Registros: {totalCount}</p>
            </div>
          </div>
          
          <button className="p-3 bg-white text-slate-400 hover:text-primary border border-slate-100 rounded-xl shadow-sm transition-all">
            <Filter size={16} />
          </button>
        </div>

        <CRMContactTable
          loading={loading}
          contacts={filteredContacts}
          onOpenChat={openChat}
          onUpdateCategory={handleUpdateCategory}
        />

        {!loading && totalCount > PAGE_SIZE && (
          <div className="mt-12 flex justify-between items-center bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              PÁGINA {page + 1} DE {Math.ceil(totalCount / PAGE_SIZE)}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-primary hover:text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-400"
              >
                <ArrowLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= totalCount}
                className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-primary hover:text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-400"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isChatOpen && selectedContact && (
        <ChatNeuralSlideOver 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          contact={selectedContact}
          chatMessages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={sendMessage}
          onToggleHandoff={toggleHandoff}
          isSending={isSending}
        />
      )}
    </div>
  );
}
