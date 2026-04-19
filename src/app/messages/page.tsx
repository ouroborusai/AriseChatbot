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

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const activeChannelRef = React.useRef<any>(null);

  const fetchConversations = async () => {
    const activeCompanyId = localStorage.getItem('arise_active_company');
    if (!activeCompanyId) return;

    let query = supabase
      .from('conversations')
      .select('*, contacts(full_name, phone)')
      .order('updated_at', { ascending: false });

    if (activeCompanyId !== 'global') {
      query = query.eq('company_id', activeCompanyId);
    }

    const { data } = await query;
    if (data) setConversations(data);
    setLoading(false);
  };

  const fetchMessages = async (convId: string) => {
    if (activeChannelRef.current) {
      supabase.removeChannel(activeChannelRef.current);
    }

    const channel = supabase.channel(`chat_${convId}`)
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
        fetchConversations();
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
    fetchConversations();

    // Listener global para NUEVAS conversaciones
    const globalChannel = supabase.channel('global_conv_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations' 
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-500 overflow-hidden">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-6">
        <div>
           <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">Neural_Comm</h1>
           <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <Activity size={10} className="text-primary" />
            Real-Time Data Interception / v7.0
           </p>
        </div>
        <div className="flex items-center gap-4 bg-emerald-500/10 px-6 py-3 rounded-2xl">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
           <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">Flux_Status: Active</span>
        </div>
      </header>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* THREAD MATRIX */}
        <div className="w-96 flex flex-col bg-white rounded-[32px] shadow-arise overflow-hidden border-none shrink-0 hidden lg:flex">
          <div className="p-8 bg-[#f7f9fb]">
            <div className="relative group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="SCAN_THREADS_..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-[9px] font-black uppercase tracking-widest pl-12 pr-4 py-4 rounded-xl outline-none focus:shadow-arise transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y-0">
            {conversations.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-20 opacity-20 italic text-[11px] font-black uppercase tracking-widest">Scanning_Transmissions...</div>
            ) : (
              conversations.map((conv) => (
                <button 
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-8 flex flex-col gap-3 transition-all hover:bg-[#f7f9fb] border-none ${selectedConv?.id === conv.id ? 'bg-[#f0f4f8]' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-black text-slate-900 tracking-tight uppercase italic">{conv.contacts?.full_name || 'UNKNOWN_NODE'}</p>
                    <span className={`text-[7px] px-2 py-1 rounded-md font-black uppercase tracking-widest ${conv.status === 'waiting_human' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {conv.status === 'waiting_human' ? 'OPERATIONAL' : 'NEURAL'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-black tracking-widest">ID_CH: +{conv.contacts?.phone}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* CHAT TERMINAL */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden rounded-[32px] shadow-arise border-none">
          {selectedConv ? (
            <>
              <div className="p-8 flex justify-between items-center bg-[#f7f9fb] shrink-0 border-none">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-[20px] flex items-center justify-center font-black text-sm shadow-xl italic">
                    {selectedConv.contacts?.full_name?.[0]}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 uppercase italic tracking-tight">{selectedConv.contacts?.full_name}</h2>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 underline decoration-primary/30 underline-offset-4">Direct_WhatsApp_Channel</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => toggleHandoff(selectedConv)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                      selectedConv.status === 'waiting_human' 
                        ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' 
                        : 'bg-white text-slate-400 shadow-sm hover:text-primary hover:shadow-md'
                    }`}
                   >
                     {selectedConv.status === 'waiting_human' ? <ShieldCheck size={14} /> : <Power size={14} />}
                     {selectedConv.status === 'waiting_human' ? 'Control_Active' : 'Override_Control'}
                   </button>
                   <button className="w-12 h-12 flex items-center justify-center bg-white text-slate-300 hover:text-slate-900 rounded-2xl shadow-sm transition-all"><MoreVertical size={20} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-white">
                {messages.map((m, idx) => {
                  const isAgent = m.sender_type === 'agent';
                  const isBot = m.sender_type === 'bot';
                  const isClient = m.sender_type === 'user';
                  
                  return (
                    <div key={idx} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] p-8 rounded-[32px] text-sm font-bold leading-relaxed shadow-sm transition-all ${
                        isClient ? 'bg-[#f7f9fb] text-slate-700 rounded-tl-none' : isBot ? 'bg-[#0a0c10] text-slate-100 rounded-tr-none' : 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/10'
                      }`}>
                        {(isBot || isAgent) && (
                          <div className="flex items-center gap-3 mb-3 text-[8px] font-black uppercase tracking-[0.3em] opacity-40">
                             {isBot ? <Bot size={12}/> : <ShieldCheck size={12}/>}
                             {isBot ? 'Arise_Neural_Node' : 'Human_Operational_Node'}
                          </div>
                        )}
                        <p className="tracking-tight">{m.content}</p>
                        <span className="text-[7px] mt-4 block opacity-30 font-black uppercase tracking-widest">
                          {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} // TX_ID_{idx}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-8 bg-white border-none shrink-0">
                <div className="relative group">
                  <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={selectedConv.status === 'waiting_human' ? "ENTRY_MESSAGE_DATA_..." : "ENGINE_LOCK_ACTIVE: ACTIVATE OVERRIDE TO SEND"}
                    disabled={selectedConv.status !== 'waiting_human'}
                    className="w-full bg-[#f2f4f6] text-slate-900 rounded-[28px] p-8 pr-24 text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white focus:shadow-arise transition-all min-h-[80px] max-h-[200px] resize-none disabled:opacity-30"
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || selectedConv.status !== 'waiting_human'}
                    className="absolute right-5 bottom-5 w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:grayscale disabled:opacity-20"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20">
               <MessageSquare size={80} strokeWidth={1} className="mb-4" />
               <p className="text-[12px] font-black uppercase tracking-[0.4em]">Selecciona una transmisión</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
