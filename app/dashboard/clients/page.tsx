'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useContacts, useContactCompanies } from '@/lib/hooks/useContacts';
import { SearchInput } from '@/app/components/SearchInput';
import { ContactCard } from '@/app/components/ContactCard';
import type { MessageData } from '@/lib/types';

export default function ClientsPage() {
  const supabase = createClient();
  const { contacts, loading, refetch, searchContacts } = useContacts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messageForm, setMessageForm] = useState({ message: '', documentUrl: '', documentName: '' });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isEditingSegment, setIsEditingSegment] = useState(false);
  const [sendingAccessCode, setSendingAccessCode] = useState(false);
  const [accessCodeResult, setAccessCodeResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const { companyLinks, selectedCompanyId, setSelectedCompanyId, createAndLinkCompany, setPrimaryCompany } = 
    useContactCompanies(selectedContact?.id || null);

  const filteredContacts = searchQuery ? searchContacts(searchQuery, contacts) : contacts;

  const handleUpdateContactName = async () => {
    if (!selectedContact || !editName.trim()) return;
    try {
      const { error } = await supabase.from('contacts').update({ name: editName.trim() }).eq('id', selectedContact.id);
      if (error) throw error;
      setIsEditingName(false);
      refetch();
      setSelectedContact({ ...selectedContact, name: editName.trim() });
    } catch (e) {
      console.error('Error updating name:', e);
    }
  };

  const handleUpdateSegment = async (newSegment: string) => {
    if (!selectedContact) return;
    try {
      const { error } = await supabase.from('contacts').update({ segment: newSegment }).eq('id', selectedContact.id);
      if (error) throw error;
      setIsEditingSegment(false);
      refetch();
      setSelectedContact({ ...selectedContact, segment: newSegment });
    } catch (e) {
      console.error('Error updating segment:', e);
    }
  };

  const handleCreateAndLinkCompany = async () => {
    if (!selectedContact || !newCompanyName.trim()) return;
    try {
      await createAndLinkCompany(selectedContact.id, newCompanyName.trim());
      setNewCompanyName('');
    } catch (e) {
      console.error('Error creating/linking company:', e);
    }
  };

  const handleSetPrimaryCompany = async (companyId: string) => {
    if (!selectedContact) return;
    try {
      await setPrimaryCompany(selectedContact.id, companyId);
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
      const payload: MessageData = { phone: selectedContact.phone_number, message: messageForm.message };
      if (messageForm.documentUrl) {
        payload.documentUrl = messageForm.documentUrl;
        payload.documentName = messageForm.documentName || 'documento.pdf';
      }
      const res = await fetch('/api/send-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data.success) {
        setSendResult({ success: true });
        setMessageForm({ message: '', documentUrl: '', documentName: '' });
        setSelectedContact(null);
        refetch();
      } else {
        setSendResult({ error: data.error || 'Error al enviar' });
      }
    } catch (err) {
      setSendResult({ error: 'Error de conexión' });
    } finally {
      setSending(false);
    }
  };

  const handleSendAccessCode = async () => {
    if (!selectedContact) return;
    setSendingAccessCode(true);
    setAccessCodeResult(null);
    try {
      const res = await fetch('/api/access-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone_number: selectedContact.phone_number }) });
      const data = await res.json();
      if (res.ok && data.success) setAccessCodeResult({ success: true });
      else setAccessCodeResult({ error: data.error || 'Error al enviar código' });
    } catch (e) {
      setAccessCodeResult({ error: 'Error de conexión' });
    } finally {
      setSendingAccessCode(false);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <p className="text-sm text-slate-500">Gestiona tus clientes y contactos</p>
      </div>
      <div className="flex-1 min-h-0 flex gap-6">
        <div className="w-80 shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar contacto..." />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">Sin contactos</div>
            ) : (
              <div className="space-y-1">
                {filteredContacts.map((contact) => (
                  <ContactCard key={contact.id} contact={contact} isSelected={selectedContact?.id === contact.id} onClick={() => setSelectedContact(contact)} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 overflow-y-auto">
          {selectedContact ? (
            <div className="p-6 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Contacto</h3>
                  <button type="button" onClick={() => { setEditName(selectedContact.name || ''); setIsEditingName(true); }} className="text-xs text-whatsapp-green hover:underline">Editar nombre</button>
                </div>
                {isEditingName ? (
                  <div className="mt-3 flex gap-2">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none" placeholder="Nombre del contacto" autoFocus />
                    <button type="button" onClick={handleUpdateContactName} className="rounded-xl bg-whatsapp-green px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-whatsapp-greenHover">Guardar</button>
                    <button type="button" onClick={() => setIsEditingName(false)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">✕</button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="font-medium text-slate-900">{selectedContact.name || 'Sin nombre'}</p>
                    <p className="text-sm text-slate-600">{selectedContact.phone_number}</p>
                    {isEditingSegment ? (
                      <div className="mt-3 flex gap-2">
                        <select value={selectedContact.segment || ''} onChange={(e) => handleUpdateSegment(e.target.value)} className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none">
                          <option value="">Sin clasificar</option>
                          <option value="cliente">Cliente</option>
                          <option value="prospect">Prospecto</option>
                        </select>
                        <button type="button" onClick={() => setIsEditingSegment(false)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">✕</button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full ${selectedContact.segment === 'cliente' ? 'bg-green-100 text-green-700' : selectedContact.segment === 'prospect' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {selectedContact.segment === 'cliente' ? '✅ Cliente' : selectedContact.segment === 'prospect' ? '🆕 Prospecto' : '❓ Sin clasificar'}
                        </span>
                        <button type="button" onClick={() => setIsEditingSegment(true)} className="text-xs text-slate-500 hover:text-slate-700">Cambiar</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">🏢 Empresas</h3>
                {companyLinks.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay empresas vinculadas</p>
                ) : (
                  <div className="space-y-2">
                    {companyLinks.map((link) => (
                      <div key={link.company_id} className={`p-3 rounded-xl border cursor-pointer transition ${selectedCompanyId === link.company_id ? 'border-whatsapp-green bg-green-50' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => setSelectedCompanyId(link.company_id)}>
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900">{link.companies?.legal_name}</p>
                          {link.is_primary && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Principal</span>}
                        </div>
                        {!link.is_primary && <button type="button" onClick={(e) => { e.stopPropagation(); handleSetPrimaryCompany(link.company_id); }} className="text-xs text-slate-500 hover:text-slate-700 mt-1">Definir como principal</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">🔐 Acceso Portal</h3>
                    <p className="text-xs text-slate-500 mt-1">Envía un código para ver documentos</p>
                  </div>
                  <button type="button" onClick={handleSendAccessCode} disabled={sendingAccessCode} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                    {sendingAccessCode ? 'Enviando...' : '📤 Enviar Código'}
                  </button>
                </div>
                {accessCodeResult && <div className={`mt-3 text-sm ${accessCodeResult.success ? 'text-green-700' : 'text-red-700'}`}>{accessCodeResult.success ? '✅ Código enviado correctamente' : `❌ ${accessCodeResult.error}`}</div>}
              </div>

              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <p className="text-sm text-slate-500">Enviando a:</p>
                  <p className="font-medium text-slate-900">{selectedContact.name || `Cliente ${selectedContact.phone_number.slice(-4)}`}</p>
                  <p className="text-sm text-slate-600">{selectedContact.phone_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mensaje</label>
                  <textarea value={messageForm.message} onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })} rows={4} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none" placeholder="Escribe tu mensaje..." required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">URL de documento (opcional)</label>
                    <input type="text" value={messageForm.documentUrl} onChange={(e) => setMessageForm({ ...messageForm, documentUrl: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del archivo (opcional)</label>
                    <input type="text" value={messageForm.documentName} onChange={(e) => setMessageForm({ ...messageForm, documentName: e.target.value })} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-whatsapp-green focus:outline-none" placeholder="documento.pdf" />
                  </div>
                </div>
                {sendResult && <div className={`rounded-2xl p-4 text-sm ${sendResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{sendResult.success ? '✓ Mensaje enviado' : `✗ ${sendResult.error}`}</div>}
                <div className="flex gap-3">
                  <button type="submit" disabled={sending || !messageForm.message} className="flex-1 rounded-3xl bg-whatsapp-green px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-whatsapp-greenHover disabled:opacity-60">{sending ? 'Enviando...' : 'Enviar mensaje'}</button>
                  <button type="button" onClick={() => setSelectedContact(null)} className="px-4 py-3 rounded-3xl border border-slate-300 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancelar</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center"><p className="text-slate-500 text-sm mb-4">Selecciona un cliente de la lista para gestionar</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}