'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type Contact = {
  id: string;
  phone_number: string;
  name?: string | null;
  email?: string | null;
  segment?: string | null;
  location?: string | null;
  last_message_at: string;
};

type CompanyLink = {
  company_id: string;
  is_primary: boolean;
  companies: { id: string; legal_name: string } | null;
};

type MessageData = {
  phone: string;
  message: string;
  documentUrl?: string;
  documentName?: string;
};

export default function ClientsPage() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageForm, setMessageForm] = useState({ message: '', documentUrl: '', documentName: '' });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const [companyLinks, setCompanyLinks] = useState<CompanyLink[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [newCompanyName, setNewCompanyName] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isEditingSegment, setIsEditingSegment] = useState(false);

  const [sendingAccessCode, setSendingAccessCode] = useState(false);
  const [accessCodeResult, setAccessCodeResult] = useState<{ success?: boolean; error?: string } | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.phone_number.toLowerCase().includes(query) ||
      (contact.name?.toLowerCase().includes(query) ?? false) ||
      (contact.email?.toLowerCase().includes(query) ?? false)
    );
  });

  useEffect(() => {
    if (!selectedContact) {
      setCompanyLinks([]);
      setSelectedCompanyId('');
      return;
    }
    const load = async () => {
      await fetchCompaniesForContact(selectedContact.id);
    };
    load();
  }, [selectedContact?.id]);

  const fetchCompaniesForContact = async (contactId: string) => {
    const { data, error } = await supabase
      .from('contact_companies')
      .select('company_id, is_primary, companies(id, legal_name)')
      .eq('contact_id', contactId);
    if (error) {
      console.error('Error fetching contact companies:', error);
      setCompanyLinks([]);
      return;
    }
    const links = (data ? data.map((item: any) => ({
      company_id: item.company_id,
      is_primary: item.is_primary,
      companies: item.companies ? [item.companies].flat()[0] : null
    })) : []) as CompanyLink[];
    setCompanyLinks(links);
    const primary = links.find((l) => l.is_primary)?.company_id || '';
    setSelectedCompanyId(primary);
  };

  const handleCreateAndLinkCompany = async () => {
    if (!selectedContact || !newCompanyName.trim()) return;
    try {
      // 1) crear company
      const { data: company, error: cErr } = await supabase
        .from('companies')
        .insert({ legal_name: newCompanyName.trim() })
        .select('id, legal_name')
        .single();
      if (cErr) throw cErr;

      // 2) vincular a contacto
      const { error: linkErr } = await supabase
        .from('contact_companies')
        .upsert({ contact_id: selectedContact.id, company_id: company.id, is_primary: companyLinks.length === 0 })
        .select();
      if (linkErr) throw linkErr;

      setNewCompanyName('');
      await fetchCompaniesForContact(selectedContact.id);
    } catch (e) {
      console.error('Error creating/linking company:', e);
    }
  };

  const handleSetPrimaryCompany = async (companyId: string) => {
    if (!selectedContact) return;
    try {
      // marcar todo false
      const { error: clearErr } = await supabase
        .from('contact_companies')
        .update({ is_primary: false })
        .eq('contact_id', selectedContact.id);
      if (clearErr) throw clearErr;

      // marcar uno true
      const { error: setErr } = await supabase
        .from('contact_companies')
        .update({ is_primary: true })
        .eq('contact_id', selectedContact.id)
        .eq('company_id', companyId);
      if (setErr) throw setErr;

      setSelectedCompanyId(companyId);
      await fetchCompaniesForContact(selectedContact.id);
    } catch (e) {
      console.error('Error setting primary company:', e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !messageForm.message) return;

    setSending(true);
    setSendResult(null);

    try {
      const payload: MessageData = {
        phone: selectedContact.phone_number,
        message: messageForm.message,
      };

      if (messageForm.documentUrl) {
        payload.documentUrl = messageForm.documentUrl;
        payload.documentName = messageForm.documentName || 'documento.pdf';
      }

      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSendResult({ success: true });
        setMessageForm({ message: '', documentUrl: '', documentName: '' });
        setSelectedContact(null);
        fetchContacts();
      } else {
        setSendResult({ error: data.error || 'Error al enviar' });
      }
    } catch (err) {
      setSendResult({ error: 'Error de conexion' });
    } finally {
      setSending(false);
    }
  };

  const handleUpdateContactName = async () => {
    if (!selectedContact || !editName.trim()) return;
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ name: editName.trim() })
        .eq('id', selectedContact.id);
      
      if (error) throw error;
      
      setIsEditingName(false);
      await fetchContacts();
      setSelectedContact({ ...selectedContact, name: editName.trim() });
    } catch (e) {
      console.error('Error updating name:', e);
    }
  };

  const handleUpdateSegment = async (newSegment: string) => {
    if (!selectedContact) return;
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ segment: newSegment })
        .eq('id', selectedContact.id);
      
      if (error) throw error;
      
      setIsEditingSegment(false);
      await fetchContacts();
      setSelectedContact({ ...selectedContact, segment: newSegment });
    } catch (e) {
      console.error('Error updating segment:', e);
    }
  };

  const handleSendAccessCode = async () => {
    if (!selectedContact) return;
    setSendingAccessCode(true);
    setAccessCodeResult(null);

    try {
      const res = await fetch('/api/access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: selectedContact.phone_number }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAccessCodeResult({ success: true });
      } else {
        setAccessCodeResult({ error: data.error || 'Error al enviar código' });
      }
    } catch (e) {
      setAccessCodeResult({ error: 'Error de conexión' });
    } finally {
      setSendingAccessCode(false);
    }
  };

  if (loading) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <p className="text-sm text-slate-500">Gestiona tus clientes y contactos</p>
      </div>

      <div className="flex-1 min-h-0 flex gap-6">
        {/* Lista de contactos */}
        <div className="w-80 shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar contacto..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="text-center py-8 text-slate-500 text-sm">Cargando...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">Sin contactos</div>
            ) : (
              <div className="space-y-1">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full text-left p-3 rounded-xl transition ${
                      selectedContact?.id === contact.id
                        ? 'bg-green-50 ring-1 ring-green-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium text-slate-900 truncate">
                      {contact.name || `Cliente ${contact.phone_number.slice(-4)}`}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{contact.phone_number}</p>
                    {contact.segment && (
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                        contact.segment === 'cliente' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {contact.segment === 'cliente' ? 'Cliente' : 'Prospecto'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de detalles */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 overflow-y-auto">
          {selectedContact ? (
            <div className="p-6 space-y-6">
              {/* Info del contacto */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Contacto</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(selectedContact.name || '');
                      setIsEditingName(true);
                    }}
                    className="text-xs text-whatsapp-green hover:underline"
                  >
                    Editar nombre
                  </button>
                </div>
                
                {isEditingName ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none"
                      placeholder="Nombre del contacto"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleUpdateContactName}
                      className="rounded-xl bg-whatsapp-green px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-whatsapp-greenHover"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="font-medium text-slate-900">
                      {selectedContact.name || 'Sin nombre'}
                    </p>
                    <p className="text-sm text-slate-600">{selectedContact.phone_number}</p>
                    
                    {/* Segmento editable */}
                    {isEditingSegment ? (
                      <div className="mt-3 flex gap-2">
                        <select
                          value={selectedContact.segment || ''}
                          onChange={(e) => handleUpdateSegment(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none"
                        >
                          <option value="">Sin clasificar</option>
                          <option value="cliente">Cliente</option>
                          <option value="prospect">Prospecto</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsEditingSegment(false)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                          selectedContact.segment === 'cliente' 
                            ? 'bg-green-100 text-green-700' 
                            : selectedContact.segment === 'prospect'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {selectedContact.segment === 'cliente' ? '✅ Cliente' : 
                           selectedContact.segment === 'prospect' ? '🆕 Prospecto' : 
                           '❓ Sin clasificar'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingSegment(true)}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Empresas vinculadas */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">🏢 Empresas</h3>
                
                {loading ? (
                  <p className="text-sm text-slate-500">Cargando...</p>
                ) : companyLinks.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay empresas vinculadas</p>
                ) : (
                  <div className="space-y-2">
                    {companyLinks.map((link) => (
                      <div
                        key={link.company_id}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          selectedCompanyId === link.company_id
                            ? 'border-whatsapp-green bg-green-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedCompanyId(link.company_id)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900">{link.companies?.legal_name}</p>
                          {link.is_primary && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Principal</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimaryCompany(link.company_id);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700 mt-1"
                        >
                          {link.is_primary ? '' : 'Definir como principal'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enviar código de acceso */}
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">🔐 Acceso Portal</h3>
                    <p className="text-xs text-slate-500 mt-1">Envía un código para ver documentos</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendAccessCode}
                    disabled={sendingAccessCode || !selectedContact}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {sendingAccessCode ? 'Enviando...' : '📤 Enviar Código'}
                  </button>
                </div>
                {accessCodeResult && (
                  <div className={`mt-3 text-sm ${accessCodeResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {accessCodeResult.success ? '✅ Código enviado correctamente' : `❌ ${accessCodeResult.error}`}
                  </div>
                )}
              </div>

              {/* Envío manual */}
              <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <p className="text-sm text-slate-500">Enviando a:</p>
                <p className="font-medium text-slate-900">
                  {selectedContact.name || `Cliente ${selectedContact.phone_number.slice(-4)}`}
                </p>
                <p className="text-sm text-slate-600">{selectedContact.phone_number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none"
                  placeholder="Escribe tu mensaje..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    URL de documento (opcional)
                  </label>
                  <input
                    type="text"
                    value={messageForm.documentUrl}
                    onChange={(e) => setMessageForm({ ...messageForm, documentUrl: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre del archivo (opcional)
                  </label>
                  <input
                    type="text"
                    value={messageForm.documentName}
                    onChange={(e) => setMessageForm({ ...messageForm, documentName: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none"
                    placeholder="documento.pdf"
                  />
                </div>
              </div>

              {sendResult && (
                <div
                  className={`rounded-2xl p-4 text-sm ${
                    sendResult.success
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {sendResult.success ? '✓ Mensaje enviado' : `✗ ${sendResult.error}`}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={sending || !messageForm.message}
                  className="flex-1 rounded-3xl bg-whatsapp-green px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-whatsapp-greenHover disabled:opacity-60"
                >
                  {sending ? 'Enviando...' : 'Enviar mensaje'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="px-4 py-3 rounded-3xl border border-slate-300 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
              </form>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-slate-500 text-sm mb-4">
                  Selecciona un cliente de la lista para gestionar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-whatsapp-border font-semibold">
              Gestion
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Clientes</h1>
            <p className="text-sm text-slate-500">
              Envía mensajes o documentos a tus clientes
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lista de contactos */}
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Contactos ({contacts.length})
          </h2>

          <input
            type="text"
            placeholder="Buscar por telefono, nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none mb-4"
          />

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No se encontraron contactos
              </p>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full text-left p-4 rounded-2xl border transition ${
                    selectedContact?.id === contact.id
                      ? 'border-whatsapp-green bg-green-50'
                      : 'border-slate-200 hover:border-whatsapp-green hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {contact.name || `Cliente ${contact.phone_number.slice(-4)}`}
                      </p>
                      <p className="text-sm text-slate-500">{contact.phone_number}</p>
                      {contact.email && (
                        <p className="text-xs text-slate-400 truncate">{contact.email}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(contact.last_message_at).toLocaleDateString('es')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Formulario de envio */}
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {selectedContact ? 'Enviar mensaje' : 'Selecciona un cliente'}
          </h2>

          {selectedContact ? (
            <div className="space-y-6">
              {/* Info del contacto */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Contacto</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(selectedContact.name || '');
                      setIsEditingName(true);
                    }}
                    className="text-xs text-whatsapp-green hover:underline"
                  >
                    Editar nombre
                  </button>
                </div>
                
                {isEditingName ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none"
                      placeholder="Nombre del contacto"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleUpdateContactName}
                      className="rounded-xl bg-whatsapp-green px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-whatsapp-greenHover"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="font-medium text-slate-900">
                      {selectedContact.name || 'Sin nombre'}
                    </p>
                    <p className="text-sm text-slate-600">{selectedContact.phone_number}</p>
                    
                    {/* Segmento editable */}
                    {isEditingSegment ? (
                      <div className="mt-3 flex gap-2">
                        <select
                          value={selectedContact.segment || ''}
                          onChange={(e) => handleUpdateSegment(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none"
                        >
                          <option value="">Sin clasificar</option>
                          <option value="cliente">Cliente</option>
                          <option value="prospect">Prospecto</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsEditingSegment(false)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                          selectedContact.segment === 'cliente' 
                            ? 'bg-green-100 text-green-700' 
                            : selectedContact.segment === 'prospect'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {selectedContact.segment === 'cliente' ? '✅ Cliente' : 
                           selectedContact.segment === 'prospect' ? '🆕 Prospecto' : 
                           '❓ Sin clasificar'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingSegment(true)}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Empresas vinculadas */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">Empresas</h3>
                  <span className="text-xs text-slate-500">{companyLinks.length} vinculada(s)</span>
                </div>

                <div className="mt-3 space-y-2">
                  {companyLinks.length === 0 ? (
                    <p className="text-sm text-slate-500">Este WhatsApp aún no tiene empresas asignadas.</p>
                  ) : (
                    companyLinks
                      .filter((l) => l.companies)
                      .map((l) => (
                        <button
                          key={l.company_id}
                          type="button"
                          onClick={() => handleSetPrimaryCompany(l.company_id)}
                          className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                            selectedCompanyId === l.company_id
                              ? 'border-whatsapp-green bg-green-50'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-slate-900">{l.companies!.legal_name}</span>
                            {l.is_primary && (
                              <span className="text-xs rounded-full bg-slate-900 text-white px-2 py-1">Activa</span>
                            )}
                          </div>
                        </button>
                      ))
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none"
                    placeholder="Nueva empresa (razón social)"
                  />
                  <button
                    type="button"
                    onClick={handleCreateAndLinkCompany}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Envío manual */}
              <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <p className="text-sm text-slate-500">Enviando a:</p>
                <p className="font-medium text-slate-900">
                  {selectedContact.name || `Cliente ${selectedContact.phone_number.slice(-4)}`}
                </p>
                <p className="text-sm text-slate-600">{selectedContact.phone_number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none resize-none"
                  rows={4}
                  placeholder="Escribe tu mensaje aqui..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL del documento (opcional)
                </label>
                <input
                  type="url"
                  value={messageForm.documentUrl}
                  onChange={(e) => setMessageForm({ ...messageForm, documentUrl: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none"
                  placeholder="https://ejemplo.com/documento.pdf"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del archivo (opcional)
                </label>
                <input
                  type="text"
                  value={messageForm.documentName}
                  onChange={(e) => setMessageForm({ ...messageForm, documentName: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none"
                  placeholder="documento.pdf"
                />
              </div>

              {sendResult && (
                <div
                  className={`rounded-2xl p-4 text-sm ${
                    sendResult.success
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {sendResult.success ? '✓ Mensaje enviado' : `✗ ${sendResult.error}`}
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !messageForm.message}
                className="w-full rounded-3xl bg-whatsapp-green px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-whatsapp-greenHover disabled:opacity-60"
              >
                {sending ? 'Enviando...' : 'Enviar mensaje'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="w-full rounded-3xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">
                Selecciona un cliente de la lista para enviarle un mensaje
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
