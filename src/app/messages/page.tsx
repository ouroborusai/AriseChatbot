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
    // 1. Limpiar canal previo si existe
    if (activeChannelRef.current) {
      supabase.removeChannel(activeChannelRef.current);
    }

    // 2. Crear y configurar nuevo canal
    const channel = supabase.channel(`central_chat_${convId}`);
    
    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${convId}`
      }, (payload) => {
        setMessages(prev => {
          // Evitar duplicados si Realtime y Fetch inicial coinciden
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    activeChannelRef.current = channel;

    // 3. Cargar historial
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
  }, []);

  return (
    <main className="h-[calc(100vh-40px)] flex flex-col p-4 md:p-8 overflow-hidden">
      <header className="mb-8 flex justify-between items-center shrink-0">
        <div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Mensajes Neurales</h1>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Intercepción de Datos en Tiempo Real</p>
        </div>
        <div className="flex items-center gap-4 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
           <Activity size={14} className="text-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Servidor Activo (v7.0)</span>
        </div>
      </header>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* LISTA DE CONVERSACIONES */}
        <div className="w-96 flex flex-col arise-card overflow-hidden">
          <div className="p-4 border-b border-slate-50">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="text" 
                placeholder="Filtrar transmisiones..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="arise-input w-full pl-12 h-12"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-20 opacity-20 italic text-[11px]">Buscando conversaciones...</div>
            ) : (
              conversations.map((conv) => (
                <button 
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-6 flex flex-col gap-2 border-b border-slate-50 transition-all hover:bg-slate-50/50 ${selectedConv?.id === conv.id ? 'bg-slate-50 border-l-4 border-l-primary' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-black text-slate-800 tracking-tight">{conv.contacts?.full_name || 'Desconocido'}</p>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${conv.status === 'waiting_human' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {conv.status === 'waiting_human' ? 'Humano' : 'IA'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold truncate">+{conv.contacts?.phone}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ÁREA DE CHAT */}
        <div className="flex-1 arise-card flex flex-col overflow-hidden bg-white/50 backdrop-blur-sm">
          {selectedConv ? (
            <>
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white/80 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg">
                    {selectedConv.contacts?.full_name?.[0]}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">{selectedConv.contacts?.full_name}</h2>
                    <p className="text-[10px] font-bold text-slate-400">Canal de WhatsApp Directo</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => toggleHandoff(selectedConv)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedConv.status === 'waiting_human' 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600' 
                        : 'bg-slate-100 text-slate-400 hover:bg-primary hover:text-white'
                    }`}
                   >
                     {selectedConv.status === 'waiting_human' ? <ShieldCheck size={14} /> : <Power size={14} />}
                     {selectedConv.status === 'waiting_human' ? 'Control Humano Activo' : 'Tomar Control Manual'}
                   </button>
                   <button className="p-2 text-slate-300 hover:text-slate-900"><MoreVertical size={20} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/20">
                {messages.map((m, idx) => {
                  const isAgent = m.sender_type === 'agent';
                  const isBot = m.sender_type === 'bot';
                  const isClient = m.sender_type === 'user';
                  
                  return (
                    <div key={idx} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-5 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ring-1 ring-slate-100 ${
                        isClient ? 'bg-white text-slate-700 rounded-tl-none' : isBot ? 'bg-slate-900 text-slate-100 rounded-tr-none' : 'bg-primary text-white rounded-tr-none'
                      }`}>
                        {(isBot || isAgent) && (
                          <div className="flex items-center gap-2 mb-2 text-[8px] font-black uppercase tracking-widest opacity-40">
                             {isBot ? <Bot size={12}/> : <ShieldCheck size={12}/>}
                             {isBot ? 'Arise IA' : 'Agente Humano'}
                          </div>
                        )}
                        <p>{m.content}</p>
                        <span className="text-[8px] mt-2 block opacity-30 font-bold">
                          {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-slate-50 bg-white sticky bottom-0">
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
                    placeholder={selectedConv.status === 'waiting_human' ? "Escribe un mensaje..." : "IA respondiendo. Activa Control Humano para escribir."}
                    disabled={selectedConv.status !== 'waiting_human'}
                    className="w-full bg-slate-50/80 border border-slate-100 rounded-3xl p-5 pr-20 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-primary/5 min-h-[60px] max-h-[200px] resize-none disabled:opacity-50"
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || selectedConv.status !== 'waiting_human'}
                    className="absolute right-3 bottom-3 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-primary/30 disabled:grayscale disabled:opacity-20"
                  >
                    <Send size={18} />
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
    </main>
  );
}
