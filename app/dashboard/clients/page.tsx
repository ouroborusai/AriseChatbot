'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useContacts, useContactCompanies, useAllCompanies } from '@/lib/hooks/useContacts';
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
  const [existingCompanySearch, setExistingCompanySearch] = useState('');
  const [isLinkingExisting, setIsLinkingExisting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isEditingSegment, setIsEditingSegment] = useState(false);
  const [sendingAccessCode, setSendingAccessCode] = useState(false);
  const [accessCodeResult, setAccessCodeResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const { companies: allCompanies } = useAllCompanies();
  const { companyLinks, selectedCompanyId, setSelectedCompanyId, createAndLinkCompany, setPrimaryCompany, linkExistingCompany } = 
    useContactCompanies(selectedContact?.id || null);

  const filteredAllCompanies = allCompanies.filter(c => 
    c.legal_name.toLowerCase().includes(existingCompanySearch.toLowerCase()) || 
    c.rut?.toLowerCase().includes(existingCompanySearch.toLowerCase())
  ).slice(0, 5); // Mostrar solo top 5 para no saturar 

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

  const getActivityStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Inactivo', color: 'bg-slate-300' };
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 1) return { label: '🔥 Caliente', color: 'bg-orange-500' };
    if (days < 7) return { label: '⚡ Tibio', color: 'bg-yellow-500' };
    return { label: '❄️ Frío', color: 'bg-blue-400' };
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

  const handleLinkExisting = async (companyId: string) => {
    if (!selectedContact) return;
    try {
      await linkExistingCompany(selectedContact.id, companyId);
      setIsLinkingExisting(false);
      setExistingCompanySearch('');
    } catch (e) {
      console.error('Error linking existing company:', e);
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
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-slate-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-8">
      {/* Header Sólido */}
      <div className={`mb-6 ${selectedContact ? 'hidden md:block' : 'block'}`}>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 uppercase tracking-tighter">Clientes</h1>
          <span className="bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Base de Datos</span>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestión de Contactos Operativos</p>
      </div>

      <div className="flex-1 min-h-0 flex gap-0 md:gap-6 relative overflow-hidden">
        
        {/* LISTA DE CONTACTOS */}
        <div className={`w-full md:w-[350px] shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <SearchInput 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Buscar contacto..." 
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <p className="text-[10px] font-bold uppercase tracking-widest">Sin resultados</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <ContactCard 
                  key={contact.id} 
                  contact={contact} 
                  isSelected={selectedContact?.id === contact.id} 
                  onClick={() => setSelectedContact(contact)} 
                />
              ))
            )}
          </div>
        </div>

        {/* PANEL DE DETALLE */}
        <div className={`flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 overflow-y-auto shadow-sm ${!selectedContact ? 'hidden md:block' : 'block'}`}>
          {selectedContact ? (
            <div className="p-5 md:p-8 space-y-6">
              
              {/* Navegación Móvil */}
              <div className="md:hidden flex items-center justify-between mb-6">
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="h-12 w-12 flex items-center justify-center bg-slate-100 rounded-xl active:bg-slate-200"
                >
                  <span className="text-xl">⬅️</span>
                </button>
                <div className="text-right">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Perfil de Cliente</p>
                   <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{selectedContact.name || 'S/N'}</p>
                </div>
              </div>

              {/* CARD DE PERFIL SÓLIDO */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-slate-800 text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                      {selectedContact.name ? selectedContact.name[0].toUpperCase() : 'C'}
                    </div>
                    <div>
                       {isEditingName ? (
                         <div className="flex gap-2">
                           <input 
                             value={editName} 
                             onChange={(e) => setEditName(e.target.value)} 
                             className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold focus:outline-none" 
                             autoFocus 
                           />
                           <button onClick={handleUpdateContactName} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase">Ok</button>
                         </div>
                       ) : (
                         <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">{selectedContact.name || 'Sin nombre'}</h2>
                            <p className="text-xs font-mono font-bold text-slate-400">+{selectedContact.phone_number}</p>
                         </div>
                       )}
                       <button onClick={() => { setEditName(selectedContact.name || ''); setIsEditingName(!isEditingName); }} className="text-[10px] font-bold uppercase text-indigo-500 mt-2 hover:underline tracking-widest">
                         {isEditingName ? 'Cancelar' : 'Editar nombre'}
                       </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-full w-fit">
                    <span className={`h-2 w-2 rounded-full ${getActivityStatus(selectedContact.updated_at).color}`}></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{getActivityStatus(selectedContact.updated_at).label}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Clasificación</p>
                   <div className="flex flex-wrap gap-2">
                      {['cliente', 'prospecto', 'vip', 'moroso'].map((seg) => (
                        <button
                          key={seg}
                          onClick={() => handleUpdateSegment(seg)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            selectedContact.segment === seg 
                            ? 'bg-slate-800 text-white' 
                            : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {seg}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              {/* GRID DE ACCIONES */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* PORTAL DE ACCESO */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 md:p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-2">Portal de Acceso</h3>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase">
                      Generar enlace de visualización para el cliente.
                    </p>
                  </div>
                  
                  <div className="mt-6">
                    <button 
                      onClick={handleSendAccessCode} 
                      disabled={sendingAccessCode} 
                      className="w-full h-12 rounded-xl bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 disabled:opacity-50"
                    >
                      {sendingAccessCode ? 'Enviando...' : '📤 Enviar Código de Acceso'}
                    </button>
                  </div>
                </div>

                {/* EMPRESAS */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 flex flex-col min-h-[250px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">🏢 Entidades</h3>
                    <button 
                      onClick={() => setIsLinkingExisting(!isLinkingExisting)} 
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${isLinkingExisting ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      {isLinkingExisting ? 'Cerrar' : '+ Vincular'}
                    </button>
                  </div>

                  {isLinkingExisting && (
                    <div className="mb-4">
                      <input 
                        type="text" 
                        value={existingCompanySearch} 
                        onChange={(e) => setExistingCompanySearch(e.target.value)}
                        placeholder="Buscar RUT/Nombre..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold focus:border-indigo-500 focus:outline-none mb-2"
                      />
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {filteredAllCompanies.map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => handleLinkExisting(c.id)}
                            className="w-full text-left p-2 hover:bg-slate-50 rounded text-xs border border-transparent hover:border-slate-100 transition"
                          >
                             <p className="font-bold text-slate-800 uppercase">{c.legal_name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    {companyLinks.length === 0 ? (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl py-8">
                         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sin empresas</p>
                      </div>
                    ) : (
                      companyLinks.map((link) => (
                        <div 
                          key={link.company_id} 
                          className={`p-3 rounded-xl border transition-colors ${selectedCompanyId === link.company_id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50/50'}`} 
                          onClick={() => setSelectedCompanyId(link.company_id)}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900 uppercase tracking-tighter">{link.companies?.legal_name}</p>
                            {link.is_primary && <span className="text-[8px] font-bold bg-slate-800 text-white px-2 py-0.5 rounded uppercase">Master</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* TERMINAL DE MENSAJERÍA */}
              <form onSubmit={handleSendMessage} className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                   <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Mensajería Directa</h3>
                </div>

                <div className="space-y-4">
                  <textarea 
                    value={messageForm.message} 
                    onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })} 
                    rows={4} 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors placeholder:text-slate-300" 
                    placeholder="Escribe el mensaje..." 
                    required 
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      value={messageForm.documentUrl} 
                      onChange={(e) => setMessageForm({ ...messageForm, documentUrl: e.target.value })} 
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-mono focus:outline-none" 
                      placeholder="Url del documento..." 
                    />
                    <input 
                      type="text" 
                      value={messageForm.documentName} 
                      onChange={(e) => setMessageForm({ ...messageForm, documentName: e.target.value })} 
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold focus:outline-none" 
                      placeholder="Nombre del archivo..." 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={sending || !messageForm.message} 
                    className="w-full h-14 rounded-xl bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest active:bg-slate-900 transition-colors disabled:opacity-40"
                  >
                    {sending ? 'Procesando...' : '🚀 Enviar Mensaje'}
                  </button>
                  
                  {selectedContact && (
                    <button 
                      type="button" 
                      onClick={() => setSelectedContact(null)} 
                      className="w-full h-12 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest md:hidden"
                    >
                      Regresar
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
              <div className="text-4xl grayscale opacity-20">👥</div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Selecciona un contacto para gestionar</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}