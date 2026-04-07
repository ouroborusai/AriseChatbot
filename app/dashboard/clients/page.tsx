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

type ClientDocument = {
  id: string;
  contact_id: string;
  company_id?: string | null;
  title: string;
  file_name?: string | null;
  file_url?: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  created_at: string;
};

type MessageData = {
  phone: string;
  message: string;
  documentUrl?: string;
  documentName?: string;
};

const DOC_TYPES = [
  { value: 'iva', label: '🧾 IVA (Impuesto al Valor Agregado)', periodFormat: 'YYYY-MM (ej: 2026-03)' },
  { value: 'renta', label: '📊 Renta (Declaración anual)', periodFormat: 'YYYY (ej: 2025)' },
  { value: 'balance', label: '📈 Balance (Estados financieros)', periodFormat: 'YYYY (ej: 2025)' },
  { value: 'liquidacion', label: '💰 Liquidación de sueldo', periodFormat: 'YYYY-MM Nombre (ej: 2026-03 Juan Perez)' },
  { value: 'contrato', label: '📄 Contrato', periodFormat: 'Descripción libre' },
  { value: 'otro', label: '📁 Otro documento', periodFormat: 'Descripción libre' },
];

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

  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [docForm, setDocForm] = useState({
    title: '',
    storagePath: '',
    fileName: '',
  });
  const [savingDoc, setSavingDoc] = useState(false);
  const [docResult, setDocResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isEditingSegment, setIsEditingSegment] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    docType: '',
    period: '',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setDocuments([]);
      return;
    }
    const load = async () => {
      await fetchCompaniesForContact(selectedContact.id);
      await fetchDocumentsForContact(selectedContact.id, null);
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

  const fetchDocumentsForContact = async (contactId: string, companyId: string | null) => {
    let q = supabase
      .from('client_documents')
      .select('id, contact_id, company_id, title, file_name, file_url, storage_bucket, storage_path, created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (companyId) q = q.eq('company_id', companyId);
    const { data, error } = await q;
    if (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
      return;
    }
    setDocuments((data || []) as ClientDocument[]);
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
      await fetchDocumentsForContact(selectedContact.id, companyId);
    } catch (e) {
      console.error('Error setting primary company:', e);
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !docForm.title.trim()) return;
    setSavingDoc(true);
    setDocResult(null);
    try {
      const payload = {
        contact_id: selectedContact.id,
        company_id: selectedCompanyId || null,
        title: docForm.title.trim(),
        storage_bucket: 'client-documents',
        storage_path: docForm.storagePath.trim() || null,
        file_name: docForm.fileName.trim() || null,
      };

      if (!payload.storage_path) {
        setDocResult({ error: 'storage_path es requerido (ruta dentro del bucket).' });
        return;
      }

      const { error } = await supabase.from('client_documents').insert(payload);
      if (error) throw error;

      setDocForm({ title: '', storagePath: '', fileName: '' });
      setDocResult({ success: true });
      await fetchDocumentsForContact(selectedContact.id, selectedCompanyId || null);
    } catch (e: any) {
      setDocResult({ error: e?.message || 'Error guardando documento' });
    } finally {
      setSavingDoc(false);
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

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !uploadFile || !uploadForm.docType) return;
    
    setUploading(true);
    setUploadResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('contact_id', selectedContact.id);
      if (selectedCompanyId) {
        formData.append('company_id', selectedCompanyId);
      }
      formData.append('doc_type', uploadForm.docType);
      formData.append('period', uploadForm.period.trim());
      
      const res = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setUploadResult({ success: true });
        setUploadFile(null);
        setUploadForm({ docType: '', period: '' });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await fetchDocumentsForContact(selectedContact.id, selectedCompanyId || null);
      } else {
        setUploadResult({ error: data.error || 'Error al subir archivo' });
      }
    } catch (err) {
      setUploadResult({ error: 'Error de conexión' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedContact || !confirm('¿Eliminar este documento?')) return;
    
    try {
      const res = await fetch(`/upload?id=${docId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDocumentsForContact(selectedContact.id, selectedCompanyId || null);
      }
    } catch (e) {
      console.error('Error deleting document:', e);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setUploadFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadFile(files[0]);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-700">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-whatsapp-green border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium">Cargando clientes...</p>
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

              {/* Subir documento con drag & drop */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">📤 Subir documento</h3>
                
                <form onSubmit={handleUploadDocument} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de documento</label>
                    <select
                      value={uploadForm.docType}
                      onChange={(e) => setUploadForm({ ...uploadForm, docType: e.target.value, period: '' })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none"
                      required
                    >
                      <option value="">Seleccionar tipo...</option>
                      {DOC_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {uploadForm.docType && (
                      <p className="text-xs text-slate-500 mt-1">
                        Formato: {DOC_TYPES.find(t => t.value === uploadForm.docType)?.periodFormat}
                      </p>
                    )}
                  </div>

                  {uploadForm.docType && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Período / Descripción</label>
                      <input
                        value={uploadForm.period}
                        onChange={(e) => setUploadForm({ ...uploadForm, period: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none"
                        placeholder={
                          uploadForm.docType === 'liquidacion' ? '2026-03 Juan Perez' :
                          uploadForm.docType === 'iva' ? '2026-03' :
                          uploadForm.docType === 'renta' || uploadForm.docType === 'balance' ? '2025' :
                          'Descripción del documento'
                        }
                        required
                      />
                    </div>
                  )}

                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
                      isDragging 
                        ? 'border-whatsapp-green bg-green-50' 
                        : uploadFile
                          ? 'border-whatsapp-green bg-green-50'
                          : 'border-slate-300 hover:border-whatsapp-green'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    
                    {uploadFile ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-900">📎 {uploadFile.name}</p>
                        <p className="text-xs text-slate-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Quitar archivo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600">Arrastra un archivo aquí o haz clic para seleccionar</p>
                        <p className="text-xs text-slate-400">PDF, Excel, Word, imágenes (máx 50MB)</p>
                      </div>
                    )}
                  </div>

                  {uploadResult && (
                    <div
                      className={`rounded-xl px-3 py-2 text-sm ${
                        uploadResult.success
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {uploadResult.success ? '✓ Documento subido correctamente' : `✗ ${uploadResult.error}`}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading || !uploadFile || !uploadForm.docType || !uploadForm.period}
                    className="w-full rounded-xl bg-whatsapp-green px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-whatsapp-greenHover disabled:opacity-60"
                  >
                    {uploading ? 'Subiendo...' : 'Subir documento'}
                  </button>
                </form>
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

              {/* Documentos subidos */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">📁 Documentos subidos</h3>
                  <span className="text-xs text-slate-500">{documents.length} archivo(s)</span>
                </div>

                <div className="mt-4 max-h-[250px] overflow-y-auto space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-sm text-slate-500">No hay documentos subidos para este cliente/empresa.</p>
                  ) : (
                    documents.map((d) => (
                      <div key={d.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{d.title}</p>
                          <p className="text-xs text-slate-500 truncate">{d.file_name}</p>
                          {d.file_url && (
                            <a 
                              href={d.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-whatsapp-green hover:underline"
                            >
                              Ver documento
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(d.id)}
                          className="text-xs text-red-600 hover:text-red-800 shrink-0"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))
                  )}
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
