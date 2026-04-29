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
    <div className="flex flex-1 h-full bg-white text-neural-dark font-sans selection:bg-primary/20 relative animate-in fade-in duration-700">
      
      {/* PERFORMANCE: OPTIMIZED MESH BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-primary/5 blur-[128px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-accent/5 blur-[128px] rounded-full" />
        
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: 'url("/brand/auth-bg.png")',
            backgroundSize: '400px',
            backgroundRepeat: 'repeat',
          }}
        />
      </div>

      <div className="flex flex-1 relative z-10 overflow-hidden w-full">
        {/* Lado Izquierdo: Lista de Conversaciones */}
        <div className={`${selectedConv ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] lg:w-[450px] h-full flex-col border-r border-slate-100 bg-white/40 backdrop-blur-xl`}>
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
        <div className={`${!selectedConv ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white/60 backdrop-blur-2xl relative overflow-hidden shadow-sm h-full`}>


          {selectedConv ? (
            <>
              <ChatHeader 
                selectedConv={selectedConv} 
                onToggleHandoff={toggleHandoff} 
                onBack={() => setSelectedConv(null)}
              />

              <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6 relative">
                <div className="absolute inset-0 bg-[radial-gradient(rgba(46,58,140,0.02)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

                <div className="relative space-y-6 max-w-4xl mx-auto">
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
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 relative overflow-hidden p-10">
              <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] [background-size:40px_40px]" />
              
              <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-1000">
                <div className="relative mb-12 group">
                   <div className="absolute inset-0 bg-primary/20 blur-[64px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                   <div className="w-20 h-20 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-2xl relative z-10 transform group-hover:scale-110 transition-all duration-1000 overflow-hidden">
                      <Image 
                        src="/brand/official.png" 
                        alt="LOOP" 
                        width={40} 
                        height={40} 
                        className="object-contain"
                      />
                   </div>
                   <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-xl z-20">
                      <Activity size={14} className="text-primary animate-pulse" />
                   </div>
                </div>
                
                <h3 className="text-4xl md:text-5xl font-black text-neural-dark tracking-tighter mb-4 text-center uppercase italic">
                  Consola <span className="text-primary">Neural</span>
                </h3>
                <p className="text-[9px] tracking-[0.6em] uppercase font-black text-slate-400 text-center opacity-60">
                  seleccione una frecuencia para sincronizar ...
                </p>
                
                <div className="mt-20 flex items-center gap-12 opacity-30">
                   <div className="flex flex-col items-center gap-3">
                      <ShieldCheck size={20} className="text-slate-400" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">E2EE Safe</span>
                   </div>
                   <div className="flex flex-col items-center gap-3">
                      <Cpu size={20} className="text-primary" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Logic v10.4</span>
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
