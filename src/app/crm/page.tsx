'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Search, 
  UserPlus, 
  ArrowLeft, 
  ArrowRight
} from 'lucide-react';
import { CRMStats } from '@/components/crm/CRMStats';
import { CRMContactTable } from '@/components/crm/CRMContactTable';
import { ChatNeuralSlideOver } from '@/components/crm/ChatNeuralSlideOver';

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

    // Validar que la empresa existe en DB
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', storedCompanyId)
      .single();

    if (companyError || !companyData) {
      localStorage.removeItem('arise_active_company');
      console.error('[CRM] Empresa no existe o RLS bloquea acceso');
      setLoading(false);
      return;
    }

    const companyId = companyData.id;
    setActiveCompanyId(companyId);
    const isGlobal = companyId === 'global';

    try {
      // 1. Contador Maestro
      let countQuery = supabase.from('contacts').select('*', { count: 'exact', head: true });
      if (!isGlobal) countQuery = countQuery.eq('company_id', companyId);
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // 2. Fetch Contactos con JOIN a empresas
      let contactQuery = supabase
        .from('contacts')
        .select('*, companies(name)');

      if (!isGlobal) contactQuery = contactQuery.eq('company_id', companyId);

      const { data: contactData, error: contactError } = await contactQuery
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (contactError) throw contactError;

      // 3. Vínculos Neurales (Conversaciones)
      let activeCount = 0;
      try {
        let chatsQuery = supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'open');
        if (!isGlobal) chatsQuery = chatsQuery.eq('company_id', companyId);
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
    if (!activeCompanyId) return null;

    // Obtener conversación MÁS RECIENTE con company_id correcto
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, status')
      .eq('contact_id', contactId)
      .eq('company_id', activeCompanyId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

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

      // Cleanup function para eliminar subscription
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

    // Obtener conversación MÁS RECIENTE con company_id correcto
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
      } else {
        console.error('[Handoff] Error al actualizar estado:', error);
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

      if (data.error) {
        throw new Error(data.error);
      }

      // ✅ Solo limpiar si se envió correctamente
      setNewMessage('');
    } catch (err) {
      // ✅ Mantener el mensaje para reintentar
      console.error('[SEND ERROR]:', err);
      alert(`Error al enviar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchCRMData(page);
  }, [page]);

  // Cleanup de subscription Realtime cuando cambia el contacto o se cierra el chat
  useEffect(() => {
    return () => {
      // Limpiar todas las subscriptions al desmontar componente
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
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-8 mb-12">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none">CRM (Pagos)</h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <Users size={10} className="text-primary" />
            Neural Relationship Mapping / v9.0
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-none">
            <input 
              type="text" 
              placeholder="BUSCAR CONTACTOS ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:w-96 pl-12 pr-6 py-4 bg-white/60 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-2xl outline-none focus:bg-white focus:shadow-arise transition-all backdrop-blur-md"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          <button className="flex items-center justify-center gap-4 bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <UserPlus size={16} />
            <span>Añadir Entidad</span>
          </button>
        </div>
      </header>

      <CRMStats totalCount={totalCount} activeChats={stats.activeChats} loading={loading} />

      <CRMContactTable 
        loading={loading} 
        contacts={filteredContacts} 
        onOpenChat={openChat} 
        onUpdateSegment={handleUpdateSegment} 
      />

      <div className="p-6 md:p-10 flex flex-col sm:flex-row justify-between items-center bg-[#f7f9fb] mt-4 rounded-[24px] gap-6">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Rango de Registros: {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} // Total: {totalCount}
        </p>
        <div className="flex gap-4">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-12 h-12 md:w-14 md:h-14 bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all rounded-2xl"><ArrowLeft size={18}/></button>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="w-12 h-12 md:w-14 md:h-14 bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 transition-all rounded-2xl"><ArrowRight size={18}/></button>
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
