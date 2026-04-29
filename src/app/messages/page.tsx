'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Sparkles, Cpu, Activity, Search, ShieldCheck } from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { ConversationList, ChatHeader, MessageBubble, MessageInput } from './components';
import Image from 'next/image';
import { useMobileNav } from '@/contexts/MobileNavContext';

interface Contact {
  full_name: string | null;
  phone: string | null;
}

interface Conversation {
  id: string;
  status: 'new' | 'open' | 'waiting_human' | 'closed';
  updated_at: string;
  company_id: string;
  contact_id: string;
  contacts?: Contact;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'bot' | 'user' | 'agent';
  created_at: string;
  conversation_id: string;
}

export default function MessagesPage() {
  const { activeCompany } = useActiveCompany();
  const { setIsVisible } = useMobileNav();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  useEffect(() => {
    // Hide mobile nav when a conversation is selected on mobile
    if (selectedConv) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
    
    // Cleanup to ensure nav is visible when leaving the page
    return () => setIsVisible(true);
  }, [selectedConv, setIsVisible]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const BRAND_GREEN = "#22c55e";
  const ACCENT_BLACK = "#0f172a";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (silent = false) => {
    if (!activeCompany) return;
    if (!silent) setLoading(true);

    try {
      let query = supabase
        .from('conversations')
        .select('*, contacts(full_name, phone)')
        .order('updated_at', { ascending: false });

      if (activeCompany?.id !== 'global') {
        query = query.eq('company_id', activeCompany?.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const uniqueContacts: Record<string, boolean> = {};
        const filtered = data.filter(conv => {
          if (!conv.contact_id) return true;
          if (!uniqueContacts[conv.contact_id]) {
            uniqueContacts[conv.contact_id] = true;
            return true;
          }
          return false;
        });

        const sorted = [...filtered].sort((a, b) => {
          if (a.status === 'waiting_human' && b.status !== 'waiting_human') return -1;
          if (a.status !== 'waiting_human' && b.status === 'waiting_human') return 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

        setConversations(sorted);
      }
    } catch {
      // Error manejado silenciosamente
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (!activeCompany) return;

    const globalChannel = supabase.channel('global_conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, () => {
        fetchConversations(true);
      })
      .subscribe();

    const interval = setInterval(() => fetchConversations(true), 60000);

    return () => {
      supabase.removeChannel(globalChannel);
      clearInterval(interval);
    };
  }, [activeCompany?.id]);

  useEffect(() => {
    if (!selectedConv?.id) return;

    const convId = selectedConv.id;

    const channel = supabase.channel(`chat_${convId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, async (payload: { new: Message }) => {
        if (payload.new.sender_type === 'bot') {
          fetch('/api/neural-processor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: payload.new.id, companyId: selectedConv.company_id }),
          }).catch(() => {});
        }

        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConv?.id]);

  useEffect(() => {
    if (activeCompany) {
      fetchConversations();
      if (selectedConv && activeCompany?.id !== 'global' && selectedConv.company_id !== activeCompany?.id) {
        setSelectedConv(null);
        setMessages([]);
      }
    }
  }, [activeCompany?.id]);

  const selectConversation = async (conv: Conversation) => {
    const newStatus = conv.status === 'new' ? 'open' : conv.status;
    setSelectedConv({ ...conv, status: newStatus });
    await fetchMessages(conv.id);

    if (conv.status === 'new') {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'open' })
        .eq('id', conv.id);

      if (error) {
        setSelectedConv({ ...conv, status: conv.status });
      }
      fetchConversations(true);
    }
  };

  const toggleHandoff = async (conv: Conversation) => {
    const newStatus = conv.status === 'waiting_human' ? 'open' : 'waiting_human';
    const { error } = await supabase
      .from('conversations')
      .update({ status: newStatus })
      .eq('id', conv.id);

    if (!error) {
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, status: newStatus } : c));
      setSelectedConv({ ...conv, status: newStatus });
    }
  };

  const sendMessage = async (overrideContent?: string) => {
    const content = overrideContent || newMessage;
    if (!content.trim() || !selectedConv) return;

    if (!overrideContent) setNewMessage('');

    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedConv.contact_id,
          content,
          companyId: selectedConv.company_id,
        }),
      });
      fetchConversations(true);
    } catch {}
  };

  return (
    <div className="flex flex-1 h-full bg-white text-slate-900 font-sans selection:bg-[#22c55e]/20 relative animate-in fade-in duration-300">
      
      {/* PERFORMANCE: OPTIMIZED MESH BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[#22c55e]/5 blur-[64px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-slate-900/5 blur-[64px] rounded-full" />
        
        <div 
          className="absolute inset-0 opacity-5 mix-blend-overlay"
          style={{
            backgroundImage: 'url("/brand/auth-bg.png")',
            backgroundSize: '400px',
            backgroundRepeat: 'repeat',
          }}
        />
      </div>

      <div className="flex flex-1 relative z-10 overflow-hidden w-full">
        {/* Lado Izquierdo: Lista de Conversaciones */}
        <div className={`${selectedConv ? 'hidden md:flex' : 'flex'} w-full md:w-[350px] lg:w-[400px] h-full flex-col border-r border-slate-100`}>
          <ConversationList
            conversations={conversations}
            selectedConv={selectedConv}
            onSelect={selectConversation}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            loading={loading}
            activeCompanyId={activeCompany?.id}
          />
        </div>

        {/* Lado Derecho: Chat Content */}
        <div className={`${!selectedConv ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white/60 backdrop-blur-md relative overflow-hidden shadow-sm h-full`}>


          {selectedConv ? (
            <>
              <ChatHeader 
                selectedConv={selectedConv} 
                onToggleHandoff={toggleHandoff} 
                onBack={() => setSelectedConv(null)}
              />

              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 relative">
                <div className="absolute inset-0 bg-[radial-gradient(rgba(46,58,140,0.02)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

                <div className="relative space-y-4 max-w-3xl mx-auto">
                  {messages.map((m, i) => (
                    <MessageBubble key={m.id} message={m} index={i} onSendMessage={sendMessage} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <MessageInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={() => sendMessage()}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.01)_1px,transparent_1px)] [background-size:32px_32px]" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-6 group">
                   <div className="absolute inset-0 bg-[#22c55e]/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                   <div className="w-14 h-14 bg-white border border-slate-100 rounded-[22px] flex items-center justify-center shadow-sm relative z-10 transform group-hover:scale-105 transition-all duration-700">
                      <Image 
                        src="/brand/official.png" 
                        alt="LOOP" 
                        width={28} 
                        height={28} 
                        className="object-contain"
                      />
                   </div>
                   <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm">
                      <Activity size={10} className="text-[#22c55e] animate-pulse" />
                   </div>
                </div>
                
                <h3 className="text-lg font-black text-slate-900 tracking-tighter mb-1.5 text-center">
                  Consola <span className="text-[#22c55e]">Neural.</span>
                </h3>
                <p className="text-[7px] tracking-[0.3em] uppercase font-black text-slate-400 text-center">
                  seleccione una frecuencia para sincronizar ...
                </p>
                
                <div className="mt-12 flex items-center gap-8 opacity-30">
                   <div className="flex flex-col items-center gap-1.5">
                      <ShieldCheck size={14} className="text-slate-400" />
                      <span className="text-[6px] font-black uppercase tracking-widest text-slate-400">E2EE Safe</span>
                   </div>
                   <div className="flex flex-col items-center gap-1.5">
                      <Cpu size={14} className="text-slate-400" />
                      <span className="text-[6px] font-black uppercase tracking-widest text-slate-400">Logic v2.5</span>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
