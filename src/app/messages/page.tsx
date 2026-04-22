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
  Filter,
  Sparkles
} from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { parseUIMessageContent } from '@/lib/whatsapp-parser';

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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
    if (!activeCompany) return;
    if (!silent) setLoading(true);

    const startTime = performance.now();
    console.log(`[Telemetry] Iniciando carga de conversaciones para Nodo: ${activeCompany.name}`);

    try {
      let query = supabase
        .from('conversations')
        .select('*, contacts(full_name, phone)')
        .order('updated_at', { ascending: false });

      // Filtro Multi-tenant Industrial (Bypass para SuperAdmin)
      if (activeCompany.id !== 'global' && activeCompany.id !== 'ca69f43b-7b11-4dd3-abe8-8338580b2d84') {
        query = query.eq('company_id', activeCompany.id);
      } else {
        console.log('[SuperAdmin] Modo Global Detectado: Aplicando percepción omnicanal.');
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
        
        // --- SMART TRIAGE v9.0 ---
        // Priorizar hilos en espera de humano y ordenar por actualización
        const sorted = [...filtered].sort((a, b) => {
          if (a.status === 'waiting_human' && b.status !== 'waiting_human') return -1;
          if (a.status !== 'waiting_human' && b.status === 'waiting_human') return 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

        setConversations(sorted);
        const duration = (performance.now() - startTime).toFixed(2);
        console.log(`[Telemetry] Carga finalizada en ${duration}ms. Nodos: ${sorted.length}`);
      }
    } catch (err) {
      console.error('[CRITICAL] Error en fetchConversations:', err);
    } finally {
      if (!silent) setLoading(false);
    }
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

  // --- SUSCRIPCIÓN GLOBAL (SIDEBAR) ---
  useEffect(() => {
    if (!activeCompany) return;

    console.log('[Realtime] Suscribiendo a flujo global de conversaciones...');
    const globalChannel = supabase.channel('global_conversations')
      .on('postgres_changes', { 
        event: '*', // Escuchar INSERT, UPDATE y DELETE
        schema: 'public', 
        table: 'conversations'
      }, (payload) => {
        console.log(`[Realtime] Cambio en conversaciones detectado (${payload.eventType})`);
        fetchConversations(true); // Re-fetch ligero
      })
      .subscribe();

    // Auto-refresh industrial cada 60s como failsafe
    const interval = setInterval(() => fetchConversations(true), 60000);

    return () => {
      supabase.removeChannel(globalChannel);
      clearInterval(interval);
    };
  }, [activeCompany?.id]);

  // --- SUSCRIPCIÓN ESPECÍFICA (MENSAJES) ---
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
      }, async (payload: { new: Message }) => {
        console.log('[Realtime] Nuevo mensaje recibido:', payload.new);
        
        // --- TRIGGER NEURAL PROCESSOR v9.0 ---
        if (payload.new.sender_type === 'bot') {
          fetch('/api/neural-processor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: payload.new.id, companyId: selectedConv.company_id })
          }).catch(e => console.error('[Neural] Processor Trigger Failed:', e));
        }

        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
      // Limpiar selección si la empresa activa ya no coincide con la conversación seleccionada
      if (selectedConv && activeCompany.id !== 'global' && selectedConv.company_id !== activeCompany.id) {
        setSelectedConv(null);
        setMessages([]);
      }
    }
  }, [activeCompany?.id]);

  // Selección de conversación
  const selectConversation = async (conv: Conversation) => {
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
      <div className="flex flex-col w-1/3 border-r border-slate-100 bg-white/60 backdrop-blur-xl">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Mensajes</h1>
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
            <input 
              type="text" 
              placeholder="BUSCAR_CHAT_..."
              className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-100 rounded-[20px] text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-300"
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
              className={`w-full p-6 text-left rounded-[28px] transition-all duration-500 group relative overflow-hidden ${
                selectedConv?.id === conv.id 
                  ? 'bg-primary text-white shadow-[0_20px_40px_rgba(var(--primary-rgb),0.3)] scale-[1.02]' 
                  : 'hover:bg-white text-slate-600 border border-transparent hover:border-slate-100 shadow-sm'
              }`}
            >
              <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-widest uppercase truncate max-w-[180px]">
                    {conv.contacts?.full_name || 'CONTACTO_DESCONOCIDO'}
                  </span>
                  <div className="flex items-center gap-2">
                    {conv.status === 'waiting_human' && (
                      <div className="w-2 h-2 bg-rose-400 rounded-full animate-ping" />
                    )}
                    <span className={`text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest ${
                      selectedConv?.id === conv.id ? 'bg-white/20 text-white' : 'bg-slate-900 text-white'
                    }`}>
                      {conv.status === 'waiting_human' ? 'Master' : 'AI'}
                    </span>
                  </div>
                </div>
                {activeCompany?.id === 'global' && (
                   <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 block mb-1 ${selectedConv?.id === conv.id ? 'text-white' : 'text-primary'}`}>
                      {conv.company_id === 'ca69f43b-7b11-4dd3-abe8-8338580b2d84' ? 'Sede Central' : 'Nodo Externo'}
                   </span>
                )}
                <span className={`text-[10px] font-mono opacity-60 ${selectedConv?.id === conv.id ? 'text-white' : 'text-slate-400'}`}>
                  {conv.contacts?.phone ? `+${conv.contacts.phone}` : 'SIN_VINCULO'}
                </span>
              </div>
            </button>
          ))}
          {loading && <div className="flex justify-center p-8"><Sparkles className="animate-spin text-primary" /></div>}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1 bg-white relative overflow-hidden">
        {selectedConv ? (
          <>
            {/* Cabecera del Chat */}
            <div className="p-8 flex items-center justify-between border-b border-slate-100 bg-white/60 backdrop-blur-xl z-20">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center text-white text-xl font-black shadow-xl">
                  {selectedConv.contacts?.full_name?.[0] || 'D'}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
                    {selectedConv.contacts?.full_name || 'CONTACTO_DESCONOCIDO'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Enlace_Activo</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleHandoff(selectedConv)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-[20px] font-black transition-all shadow-lg ${
                    selectedConv.status === 'waiting_human' 
                      ? 'bg-rose-500 text-white shadow-rose-500/20' 
                      : 'bg-emerald-500 text-white shadow-emerald-500/20'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-widest">
                    {selectedConv.status === 'waiting_human' ? 'Control_Manual' : 'Neural_Link'}
                  </span>
                </button>
                <button className="p-3 hover:bg-slate-50 rounded-[15px] transition-colors text-slate-300 hover:text-slate-900">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-12 space-y-8 bg-[#F7F9FB] custom-scrollbar relative">
              <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
              
              <div className="relative space-y-8 max-w-4xl mx-auto">
                {messages.map((m, i) => {
                  const isAI = m.sender_type === 'bot';
                  return (
                    <div key={m.id || i} className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                      <div className={`max-w-[75%] space-y-2`}>
                        <div className={`p-6 rounded-[28px] shadow-sm relative overflow-hidden \${
                          isAI 
                            ? 'bg-slate-900 text-white rounded-tl-none' 
                            : 'bg-white text-slate-900 rounded-tr-none border border-slate-100 shadow-xl shadow-slate-200/20'
                        }`}>
                          {isAI && (
                            <div className="flex items-center gap-2 mb-3 text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase">
                              <Sparkles className="w-3 h-3 text-primary" />
                              <span>Arise_Neural_Engine</span>
                            </div>
                          )}
                          
                          {/* Lógica de Renderizado Inteligente de Botones v9.0 */}
                          {(() => {
                            const { textParts, buttonParts } = parseUIMessageContent(m.content);
                            
                            return (
                              <div className="space-y-4">
                                {textParts.map((text, tidx) => (
                                  <p key={tidx} className={`text-[13px] leading-relaxed whitespace-pre-wrap \${isAI ? 'font-medium' : 'font-medium text-slate-600'}`}>
                                    {text}
                                  </p>
                                ))}
                                {buttonParts.map((group, gidx) => (
                                  <div key={gidx} className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-white/10">
                                    {group.map((btn, bidx) => (
                                      <button
                                        key={bidx}
                                        onClick={() => sendMessage(btn)}
                                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2"
                                      >
                                        {btn}
                                      </button>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                          
                          <span className={`block mt-4 text-[9px] font-black uppercase tracking-tighter opacity-40 \${isAI ? 'text-left' : 'text-right'}`}>
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
            <div className="p-8 bg-white/80 backdrop-blur-xl border-t border-slate-100 shrink-0">
              <div className="max-w-4xl mx-auto flex items-center gap-4 bg-slate-50 p-4 rounded-[32px] focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-inner border border-slate-100">
                <input 
                  type="text" 
                  placeholder="ESCRIBIR_COMO_AGENTE_HUMANO_..."
                  className="flex-1 bg-transparent border-none py-2 px-4 text-[13px] font-medium outline-none placeholder:text-slate-300 text-slate-900"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button 
                  onClick={() => sendMessage()}
                  disabled={!newMessage.trim()}
                  className="p-4 bg-primary hover:bg-primary-dark disabled:bg-slate-200 text-white rounded-[20px] transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mb-8 shadow-2xl animate-bounce">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Selector de Frecuencia</h3>
              <p className="text-[10px] tracking-[0.4em] uppercase font-black text-slate-400">esperando_enlace_neuronal_...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
