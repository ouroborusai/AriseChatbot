'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Sparkles, Cpu, Activity, Search, ShieldCheck } from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { ConversationList, ChatHeader, MessageBubble, MessageInput } from './components';
import { useMobileNav } from '@/contexts/MobileNavContext';

// Importación estricta SSOT de la base de datos
import type { Conversation, Message, Contact } from '@/types/database';
import type { ConvListType } from './components/ConversationList';

/**
 *  MESSAGES PAGE Diamond v12.0 (Diamond Resilience - OMNI-CHANNEL SSOT)
 *  Aislamiento Tenant Estricto y Tipado Certificado sin 'any'.
 */

export type ChatMessage = Pick<Message, 'id' | 'content' | 'sender_type' | 'created_at'>;

export default function MessagesPage() {
  const { activeCompany } = useActiveCompany();
  const { setIsVisible } = useMobileNav();
  
  const [conversations, setConversations] = useState<ConvListType[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConvListType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Extracción blindada del Tenant Activo
  const activeCompanyId = activeCompany?.id;

  const fetchConversations = async () => {
    if (!activeCompanyId) return;

    // Aislamiento Tenant aplicado estrictamente a nivel de query
    const { data, error } = await supabase
      .from('conversations')
      .select('*, contacts(full_name, phone)')
      .eq('company_id', activeCompanyId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Messages] Sincronización fallida:', error.message);
      setLoading(false);
      return;
    }

    setConversations((data as unknown as ConvListType[]) || []);
    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    if (!activeCompanyId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('id, content, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Messages] Fallo en recuperación de historial:', error.message);
      return;
    }

    setMessages((data as ChatMessage[]) || []);
  };

  useEffect(() => {
    if (activeCompanyId) {
      fetchConversations();
    }
  }, [activeCompanyId]);

  useEffect(() => {
    if (selectedConv?.id) {
      fetchMessages(selectedConv.id);
    }
  }, [selectedConv?.id]);

  const sendMessage = async (content: string) => {
    if (!selectedConv?.contact_id || !activeCompanyId || !content.trim()) return;
    
    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactId: selectedConv.contact_id, 
          content, 
          companyId: activeCompanyId 
        }),
      });

      // Optimistic Update del UI (Cero Cálculo Local en agregaciones)
      setNewMessage('');
      setMessages((prev) => [
        ...prev,
        {
          id: `opt-${Date.now()}`,
          content,
          sender_type: 'agent',
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('[Messages] Emisión de mensaje fallida:', error);
    }
  };

  return (
    <div 
      className="flex flex-1 h-full bg-white relative overflow-hidden shadow-2xl border border-slate-100" 
      style={{ borderRadius: 40 }}
    >
      {/* Luminous Pure Estética y Brillo de Fondo ARISE Green (#22c55e) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[#22c55e]/5 blur-[128px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-slate-50 blur-[100px] rounded-full" />
      </div>

      <div className="w-[450px] border-r border-slate-100 relative z-10 flex flex-col bg-white/50 backdrop-blur-3xl" style={{ borderTopLeftRadius: 40, borderBottomLeftRadius: 40 }}>
        <ConversationList 
          conversations={conversations} 
          selectedConv={selectedConv} 
          onSelect={(c: ConvListType) => setSelectedConv(c)} 
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      <div className="flex-1 flex flex-col relative z-10">
        {selectedConv ? (
          <>
            <ChatHeader 
              selectedConv={selectedConv} 
              onToggleHandoff={() => {}} 
              onBack={() => setSelectedConv(null)} 
            />
            
            <div className="flex-1 overflow-y-auto p-10 space-y-4">
              {messages.map((m) => (
                <MessageBubble 
                  key={m.id} 
                  message={m} 
                />
              ))}
            </div>

            <div className="px-8 pb-8 pt-4">
               <MessageInput 
                 value={newMessage} 
                 onChange={setNewMessage} 
                 onSend={() => sendMessage(newMessage)} 
                 disabled={!newMessage.trim()}
               />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <h3 className="text-5xl font-black text-neural-dark uppercase italic flex items-center gap-4">
              Consola <span className="text-[#22c55e]">Neural</span>
            </h3>
            <p className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.5em] mt-4 flex items-center gap-2 italic">
              <ShieldCheck size={12} className="text-[#22c55e]" />
              v12.0_DIAMOND_OPERATIVO
            </p>
            <div className="mt-12 p-8 bg-slate-50/50 rounded-full animate-pulse border border-slate-100">
               <Activity size={32} className="text-[#22c55e] opacity-40" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
