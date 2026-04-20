'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MessageSquare, 
  Search, 
  Bot, 
  User, 
  Power, 
  Send, 
  Activity,
  ShieldCheck,
  MoreVertical,
  Filter
} from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';

export default function MessagesPage() {
  const { activeCompany } = useActiveCompany();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const activeChannelRef = React.useRef<any>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (silent = false) => {
    if (!activeCompany) return;
    const activeCompanyId = activeCompany.id;
    if (!silent) setLoading(true);

    let query = supabase
      .from('conversations')
      .select('*, contacts(full_name, phone)')
      .order('updated_at', { ascending: false });

    if (activeCompanyId !== 'global') {
      query = query.eq('company_id', activeCompanyId);
    }

    const { data } = await query;
    if (data) setConversations(data);
    if (!silent) setLoading(false);
  };

  const fetchMessages = async (convId: string) => {
    if (activeChannelRef.current) {
      supabase.removeChannel(activeChannelRef.current);
    }

    const channel = supabase.channel(`chat_${convId}_${Date.now()}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${convId}`
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
        // También refrescar la lista de conversaciones para actualizar el orden/visto
        fetchConversations(true);
      })
      .subscribe();

    activeChannelRef.current = channel;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const selectConversation = (conv: any) => {
    setSelectedConv(conv);
    fetchMessages(conv.id);
  };

  const toggleHandoff = async (conv: any) => {
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    
    const content = newMessage;
    setNewMessage('');

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedConv.contact_id, content })
      });
      
      const data = await res.json();
      if (data.error) alert(`Error: ${data.error}`);
    } catch (err) {
      console.error('SEND ERROR:', err);
    }
  };

  useEffect(() => {
    if (activeCompany) {
      fetchConversations();
    }

    // Listener global para NUEVAS conversaciones
    const globalChannel = supabase.channel(`global_conv_updates_${Date.now()}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations' 
      }, () => {
        fetchConversations(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [activeCompany]);

  return (
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-500 h-[calc(100vh-2rem)] md:h-screen overflow-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8 md:mb-10 shrink-0">
        <div>
           <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none">Mensajes</h1>
           <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <Activity size={10} className="text-primary" />
            Neural Relationship Protocol / v7.1
           </p>
        </div>
        <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-white/40">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Neural_Status: Online</span>
        </div>
      </header>

      <div className="flex-1 flex gap-6 md:gap-8 min-h-0 overflow-hidden">
        {/* THREAD MATRIX */}
        <div className="w-80 md:w-96 flex flex-col bg-white rounded-[24px] md:rounded-[32px] shadow-arise overflow-hidden border-none shrink-0 hidden lg:flex">
          <div className="p-6 md:p-8 pb-4">
            <div className="relative group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="QUER_CONTACTS_..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#f7f9fb] text-[10px] font-black text-slate-600 placeholder:text-slate-300 placeholder:tracking-widest pl-10 pr-4 py-4 rounded-xl outline-none focus:bg-white focus:shadow-sm transition-all uppercase tracking-widest"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {conversations.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full opacity-10 text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">Waiting_Sync...</div>
            ) : (
              conversations
                .filter(conv => 
                  conv.contacts?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  conv.contacts?.phone?.includes(searchTerm)
                )
                .map((conv) => (
                <button 
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-5 rounded-[20px] flex flex-col gap-3 transition-all mb-1 ${selectedConv?.id === conv.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-[#f7f9fb] text-slate-500'}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <p className={`text-[11px] font-black tracking-tight uppercase truncate pr-2 ${selectedConv?.id === conv.id ? 'text-white' : 'text-slate-900'}`}>
                      {conv.contacts?.full_name || 'Anonymous_Node'}
                    </p>
                    <span className={`text-[7px] px-2 py-0.5 rounded font-black uppercase tracking-widest shrink-0 ${selectedConv?.id === conv.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {conv.status === 'waiting_human' ? 'MASTER' : 'AI'}
                    </span>
                  </div>
                  <p className={`text-[10px] font-mono font-medium ${selectedConv?.id === conv.id ? 'text-white/70' : 'text-slate-400'}`}>
                    +{conv.contacts?.phone}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* CHAT TERMINAL */}
        <div className="flex-1 bg-white flex flex-col min-w-0 overflow-hidden rounded-[24px] md:rounded-[32px] shadow-arise border-none">
          {selectedConv ? (
            <>
              <div className="p-6 md:p-8 flex justify-between items-center bg-[#f7f9fb]/50 backdrop-blur-sm shrink-0 border-b border-slate-50">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-[16px] md:rounded-[18px] flex items-center justify-center font-black text-xs md:text-sm shadow-md">
                    {selectedConv.contacts?.full_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-tight truncate">{selectedConv.contacts?.full_name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active_Link</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => toggleHandoff(selectedConv)}
                    className={`flex items-center gap-3 px-4 md:px-6 py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                      selectedConv.status === 'waiting_human' 
                        ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' 
                        : 'bg-white text-slate-400 shadow-sm hover:text-primary hover:shadow-md'
                    }`}
                   >
                     <Power size={14} />
                     <span className="hidden sm:inline">{selectedConv.status === 'waiting_human' ? 'Manual_Control' : 'AI_Operational'}</span>
                   </button>
                   <button className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white text-slate-300 hover:text-slate-900 rounded-xl md:rounded-2xl shadow-sm transition-all"><MoreVertical size={16} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-10 custom-scrollbar bg-white">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full opacity-10">
                    <MessageSquare size={60} strokeWidth={1} className="mb-4" />
                    <p className="text-[9px] font-black uppercase tracking-[1em]">Scanning_Link</p>
                  </div>
                )}
                {messages.map((m, idx) => {
                  const isAgent = m.sender_type === 'agent';
                  const isBot = m.sender_type === 'bot';
                  const isClient = m.sender_type === 'user';
                  
                  return (
                    <div key={idx} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] p-6 rounded-[24px] md:rounded-[28px] text-[12px] md:text-[13px] font-bold leading-relaxed shadow-sm transition-all hover:shadow-md ${
                        isClient ? 'bg-[#f7f9fb] text-slate-700 rounded-tl-none ring-1 ring-slate-100' : isBot ? 'bg-[#191c1e] text-white rounded-tr-none' : 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20'
                      }`}>
                        {(isBot || isAgent) && (
                          <div className={`flex items-center gap-3 mb-4 text-[7px] font-black uppercase tracking-[0.3em] ${!isBot ? 'text-white/70' : 'text-primary'}`}>
                             {isBot ? <Bot size={12}/> : <ShieldCheck size={12}/>}
                             {isBot ? 'Arise_Neural_Engine' : 'Human_Supervisor'}
                          </div>
                        )}
                        <div className="tracking-tight whitespace-pre-wrap">
                          {m.content.includes('---') && m.content.includes('|') ? (
                            <div className="flex flex-col gap-4">
                              <p>{m.content.split('---').filter((p: string) => !p.includes('|')).join('\n').trim()}</p>
                              <div className="flex flex-wrap gap-2 pt-2 border-t border-current/10">
                                {m.content.split('---').find((p: string) => p.includes('|'))?.split('|').map((opt: string, i: number) => (
                                  <div key={i} className="px-3 py-1.5 bg-current/10 rounded-full text-[9px] uppercase tracking-wider font-black">
                                    {opt.trim()}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            m.content
                          )}
                        </div>
                        <div className="mt-4 flex items-center gap-3 opacity-30 text-[8px] font-black uppercase tracking-widest">
                          {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-6 md:p-10 bg-white border-none shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.05)] shrink-0">
                <div className="relative">
                  <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={selectedConv.status === 'waiting_human' ? "Escribe como Agente Humano..." : "La IA responderá automáticamente..."}
                    disabled={selectedConv.status !== 'waiting_human'}
                    className="w-full bg-[#f7f9fb] text-slate-800 rounded-[24px] md:rounded-[32px] p-6 pr-20 md:pr-24 text-[12px] md:text-[13px] font-bold outline-none focus:bg-white focus:shadow-arise transition-all min-h-[60px] max-h-[160px] resize-none disabled:opacity-20"
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || selectedConv.status !== 'waiting_human'}
                    className="absolute right-4 bottom-4 md:right-6 md:bottom-6 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#135bec] to-[#0045bd] text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/30 disabled:opacity-10 transition-all hover:scale-105 active:scale-95"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-20">
               <MessageSquare size={80} strokeWidth={1} className="mb-6" />
               <p className="text-[10px] font-black uppercase tracking-[0.8em]">Establishing_Link</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
