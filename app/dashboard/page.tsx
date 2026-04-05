'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { SystemStatusPanel } from './system-status-panel';
import Link from 'next/link';

type Contact = {
  id: string;
  phone_number: string;
  name?: string;
  email?: string;
  segment?: string;
  location?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (data) {
        setContacts(data);
        if (data.length > 0 && !selectedContactId) {
          setSelectedContactId(data[0].id);
        }
      }
      setLoading(false);
    };

    fetchContacts();

    const channel = supabase
      .channel('contacts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedContactId]);

  // Fetch messages for selected contact
  useEffect(() => {
    if (!selectedContactId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', selectedContactId)
        .single();

      if (!conv) {
        setMessages([]);
        return;
      }

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);
    };

    fetchMessages();

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContactId, supabase]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const filteredContacts = contacts.filter((c) =>
    !searchQuery ||
    c.phone_number.includes(searchQuery) ||
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - d.getTime()) / 60000);

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-gray-300">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <SystemStatusPanel />
      
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-400">PERSONAS</h2>
              <Link href="/dashboard/metrics" className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded">
                Métricas
              </Link>
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">Sin personas</p>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`w-full p-3 text-left border-b border-gray-800 hover:bg-gray-800 transition ${
                    selectedContactId === contact.id ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {(contact.name?.charAt(0) || contact.phone_number.charAt(0)).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {contact.name || contact.phone_number}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{contact.phone_number}</p>
                      {contact.segment && (
                        <p className="text-xs text-gray-500">{contact.segment}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-1">{formatDate(contact.last_message_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Chat */}
        <main className="flex-1 flex flex-col bg-gray-950">
          {selectedContact ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {(selectedContact.name?.charAt(0) || selectedContact.phone_number.charAt(0)).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedContact.name || 'Sin nombre'}</h3>
                    <p className="text-xs text-gray-400">{selectedContact.phone_number}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1 border border-gray-700 rounded hover:bg-gray-800"
                >
                  Salir
                </button>
              </div>

              {/* Contact Info */}
              {(selectedContact.email || selectedContact.segment || selectedContact.location) && (
                <div className="p-4 bg-gray-900 border-b border-gray-800 grid grid-cols-3 gap-4 text-sm">
                  {selectedContact.email && (
                    <div>
                      <p className="text-gray-500 text-xs">Email</p>
                      <p className="text-gray-300">{selectedContact.email}</p>
                    </div>
                  )}
                  {selectedContact.segment && (
                    <div>
                      <p className="text-gray-500 text-xs">Segmento</p>
                      <p className="text-gray-300">{selectedContact.segment}</p>
                    </div>
                  )}
                  {selectedContact.location && (
                    <div>
                      <p className="text-gray-500 text-xs">Ubicación</p>
                      <p className="text-gray-300">{selectedContact.location}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 mt-8">Sin mensajes</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-sm px-3 py-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-60">
                          {new Date(msg.created_at).toLocaleTimeString('es')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Selecciona una persona
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
