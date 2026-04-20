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
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);

    const { data } = await supabase
      .from('conversations')
      .select('*, contacts(full_name, phone)')
      .order('updated_at', { ascending: false });

    if (data) {
      // De-duplicación por contacto: Solo quedarnos con el hilo más reciente por persona
      const uniqueContacts: any = {};
      const filtered = data.filter(conv => {
        if (!conv.contact_id) return true; // Hilos sin contacto (raro)
        if (!uniqueContacts[conv.contact_id]) {
          uniqueContacts[conv.contact_id] = true;
          return true;
        }
        return false;
      });
      setConversations(filtered);
    }
    if (!silent) setLoading(false);
  };

  // --- CARGA DE MENSAJES ---
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

  // --- SUSCRIPCIÓN REALTIME (INDUSTRIAL) ---
  useEffect(() => {
    if (!selectedConv?.id) return;

    const convId = selectedConv.id;
    console.log(`[Realtime] Suscribiendo a chat_${convId}`);

    const channel = supabase.channel(`chat_${convId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${convId}` 
      }, async (payload: any) => {
        console.log('[Realtime] Nuevo mensaje recibido:', payload.new);
        
        // --- TRIGGER NEURAL PROCESSOR v7.9 ---
        if (payload.new.sender_type === 'bot') {
          console.log('[Neural] Triggering processor for action detection...');
          fetch('/api/neural-processor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              messageId: payload.new.id, 
              companyId: selectedConv.company_id 
            })
          }).catch(e => console.error('[Neural] Processor Trigger Failed:', e));
        }

        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          const newList = [...prev, payload.new];
          return newList.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });
        
        fetchConversations(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConv?.id]);

  useEffect(() => {
    fetchConversations();
  }, []); // Carga global única al montar

  // Selección de conversación
  const selectConversation = async (conv: any) => {
    const newStatus = conv.status === 'new' ? 'open' : conv.status;
    setSelectedConv({ ...conv, status: newStatus });
    await fetchMessages(conv.id);
    
    if (conv.status === 'new') {
      await supabase
        .from('conversations')
        .update({ status: 'open' })
        .eq('id', conv.id);
      fetchConversations(true);
    }
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
          companyId: selectedConv.company_id
        })
      });
      fetchConversations(true);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-[#EAE1DF]">
      {/* Sidebar de Conversaciones */}
      <div className="flex flex-col w-1/3 border-r border-[#F5F2F0] bg-white/80 backdrop-blur-md">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold tracking-tight text-[#0D0D0D]">Mensajes</h1>
            <Activity className="w-5 h-5 text-[#4CAF50] animate-pulse" />
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999] transition-colors group-focus-within:text-[#1A1A1A]" />
            <input 
              type="text" 
              placeholder="QUER_CONTACTS_..."
              className="w-full pl-12 pr-4 py-4 bg-[#F9F7F6] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#EAE1DF] transition-all outline-none placeholder:text-[#BBB]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-8 custom-scrollbar">
          {conversations.filter(c => 
            c.contacts?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.contacts?.phone?.includes(searchTerm)
          ).map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={`w-full p-6 text-left rounded-3xl transition-all duration-300 group relative overflow-hidden ${
                selectedConv?.id === conv.id 
                  ? 'bg-[#0047BB] text-white shadow-2xl shadow-[#0047BB]/20 scale-[1.02]' 
                  : 'hover:bg-[#F9F7F6] text-[#444]'
              }`}
            >
              <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold tracking-wide uppercase truncate">
                    {conv.contacts?.full_name || 'CONTACT_UNKNOWN'}
                  </span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-black ${
                    selectedConv?.id === conv.id ? 'bg-white/20 text-white' : 'bg-[#1A1A1A] text-white'
                  }`}>
                    {conv.status === 'waiting_human' ? 'MASTER' : 'AI'}
                  </span>
                </div>
                <span className={`text-xs opacity-60 font-mono ${selectedConv?.id === conv.id ? 'text-white' : 'text-[#666]'}`}>
                  {conv.contacts?.phone ? `+${conv.contacts.phone}` : 'ID_UNLINKED'}
                </span>
              </div>
              {selectedConv?.id === conv.id && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              )}
            </button>
          ))}
          {loading && <div className="flex justify-center p-8"><Activity className="animate-spin text-[#999]" /></div>}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1 bg-white relative overflow-hidden">
        {selectedConv ? (
          <>
            {/* Cabecera del Chat */}
            <div className="p-8 flex items-center justify-between border-b border-[#F5F2F0] bg-white/50 backdrop-blur-xl z-20">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#1A1A1A] rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {selectedConv.contacts?.full_name?.[0] || 'D'}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-[#0D0D0D]">
                    {selectedConv.contacts?.full_name || 'DIRECTOR_ARise'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-[#4CAF50] uppercase tracking-widest">ACTIVE_LINK</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleHandoff(selectedConv)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all ${
                    selectedConv.status === 'waiting_human' 
                      ? 'bg-[#E53935] text-white shadow-lg shadow-red-500/20' 
                      : 'bg-[#4CAF50] text-white shadow-lg shadow-green-500/20'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-tighter">
                    {selectedConv.status === 'waiting_human' ? 'MANUAL_CONTROL' : 'AI_NEURAL_LINK'}
                  </span>
                </button>
                <button className="p-3 hover:bg-[#F9F7F6] rounded-2xl transition-colors">
                  <MoreVertical className="w-5 h-5 text-[#999]" />
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-12 space-y-8 bg-[#FDFCFB] custom-scrollbar relative">
              <div className="absolute inset-0 bg-[radial-gradient(#EAE1DF_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
              
              <div className="relative space-y-8 max-w-4xl mx-auto">
                {messages.map((m, i) => {
                  const isAI = m.sender_type === 'bot';
                  return (
                    <div key={m.id || i} className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                      <div className={`max-w-[75%] space-y-2`}>
                        <div className={`p-6 rounded-3xl shadow-sm relative overflow-hidden ${
                          isAI 
                            ? 'bg-[#1A1A1A] text-white rounded-tl-none' 
                            : 'bg-[#F1EFEE] text-[#1A1A1A] rounded-tr-none'
                        }`}>
                          {isAI && (
                            <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-[#666] tracking-[0.2em] uppercase">
                              <Bot className="w-3 h-3" />
                              <span>Arise_Neural_Engine</span>
                            </div>
                          )}
                          
                          {/* Lógica de Renderizado Inteligente de Botones */}
                          {m.content.includes('---') ? (() => {
                            const [text, buttonsPart] = m.content.split('---');
                            const buttons = buttonsPart.split('|').map((b: string) => b.trim()).filter((b: string) => b.length > 0);
                            
                            return (
                              <div className="space-y-3">
                                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isAI ? 'font-medium' : 'font-normal'}`}>
                                  {text.trim()}
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#333]">
                                  {buttons.map((btn: string, j: number) => (
                                    <button
                                      key={j}
                                      onClick={() => sendMessage(btn)}
                                      className="px-4 py-2 bg-[#262626] hover:bg-[#333] border border-[#444] text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-2"
                                    >
                                      {btn}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })() : (
                            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isAI ? 'font-medium' : 'font-normal'}`}>
                              {m.content}
                            </p>
                          )}
                          
                          <span className={`block mt-3 text-[10px] font-mono opacity-40 ${isAI ? 'text-left' : 'text-right'}`}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-8 bg-white border-none shrink-0">
              <div className="max-w-4xl mx-auto flex items-center gap-4 bg-[#F9F7F6] p-4 rounded-[2.5rem] focus-within:ring-2 focus-within:ring-[#EAE1DF] transition-all shadow-inner">
                <input 
                  type="text" 
                  placeholder="Escribe como Agente Humano..."
                  className="flex-1 bg-transparent border-none py-2 px-4 text-sm outline-none placeholder:text-[#BBB]"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button 
                  onClick={() => sendMessage()}
                  disabled={!newMessage.trim()}
                  className="p-4 bg-[#0047BB] hover:bg-[#003da1] disabled:bg-[#CCC] text-white rounded-full transition-all shadow-xl shadow-[#0047BB]/20 hover:scale-110 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#999] bg-[#FDFCFB]">
            <div className="w-24 h-24 bg-[#F1EFEE] rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">Selector de Frecuencia</h3>
            <p className="text-sm tracking-widest uppercase font-mono opacity-50">esperando_enlace_neuronal_...</p>
          </div>
        )}
      </div>
    </div>
  );
}
