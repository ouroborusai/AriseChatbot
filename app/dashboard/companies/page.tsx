'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCompanies, useCompanyContacts, useCompanyDocuments } from '@/lib/hooks/useCompanies';
import { SearchInput } from '@/app/components/SearchInput';
import { Modal } from '@/app/components/Modal';

export default function CompaniesPage() {
  const supabase = createClient();
  const { companies, loading, refetch, createCompany, deleteCompany, searchCompanies } = useCompanies();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyRut, setNewCompanyRut] = useState('');
  const [saving, setSaving] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || null;
  const { contacts, refetch: refetchContacts } = useCompanyContacts(selectedCompanyId);
  const { documents, refetch: refetchDocs, deleteDocument } = useCompanyDocuments(selectedCompanyId);

  const filteredCompanies = searchQuery ? searchCompanies(searchQuery) : companies;

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    setSaving(true);
    try {
      await createCompany(newCompanyName.trim(), newCompanyRut.trim() || undefined);
      setShowCreateModal(false);
      setNewCompanyName('');
      setNewCompanyRut('');
    } catch (e) { console.error('Error:', e); }
    setSaving(false);
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompanyId || !confirm('¿Eliminar esta empresa?')) return;
    try {
      await deleteCompany(selectedCompanyId);
      setSelectedCompanyId(null);
    } catch (e) { console.error('Error:', e); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) setUploadFile(files[0]);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) setUploadFile(e.dataTransfer.files[0]); }, []);

  const handleUploadDocument = async () => {
    if (!selectedCompanyId || !uploadFile || !docTitle.trim()) return;
    setUploading(true);
    try {
      const fileName = `${selectedCompanyId}/${Date.now()}_${uploadFile.name}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, uploadFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
      await supabase.from('client_documents').insert({
        contact_id: contacts[0]?.contact_id || null,
        company_id: selectedCompanyId,
        title: docTitle.trim(),
        file_name: uploadFile.name,
        file_url: publicUrl,
        storage_bucket: 'documents',
        storage_path: fileName,
        file_type: uploadFile.type,
      });
      setDocTitle('');
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      refetchDocs();
    } catch (e) { console.error('Error:', e); }
    setUploading(false);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try { await deleteDocument(docId); } catch (e) { console.error('Error:', e); }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="flex h-full flex-col w-full">
      <div className="mb-4 flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Empresas</h1>
          <p className="text-sm text-slate-500 mt-1">{companies.length} {companies.length === 1 ? 'empresa' : 'empresas'} registradas</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700">+ Nueva Empresa</button>
      </div>

      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="flex h-full gap-4">
          <div className="w-96 shrink-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="p-4 border-b border-slate-100">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar empresa..." />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredCompanies.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">{searchQuery ? 'No se encontraron' : 'No hay empresas'}</div>
              ) : (
                <div className="space-y-1">
                  {filteredCompanies.map((company) => (
                    <button key={company.id} type="button" onClick={() => setSelectedCompanyId(company.id)}
                      className={`w-full text-left p-3 rounded-xl transition ${selectedCompanyId === company.id ? 'bg-green-50 ring-1 ring-green-200' : 'hover:bg-slate-50'}`}>
                      <p className="font-semibold text-slate-900 truncate">{company.legal_name}</p>
                      {company.rut && <p className="text-xs text-slate-500 truncate">RUT: {company.rut}</p>}
                      {company.segment && <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${company.segment === 'pyme' ? 'bg-blue-100 text-blue-700' : company.segment === 'gran_empresa' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>{company.segment}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 overflow-y-auto">
            {selectedCompany ? (
              <div className="p-6 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Información de la Empresa</h3>
                    <button type="button" onClick={handleDeleteCompany} className="text-xs text-red-600 hover:text-red-800">Eliminar</button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div><p className="text-xs text-slate-500">Razón Social</p><p className="font-medium text-slate-900">{selectedCompany.legal_name}</p></div>
                    {selectedCompany.rut && <div><p className="text-xs text-slate-500">RUT</p><p className="font-medium text-slate-900">{selectedCompany.rut}</p></div>}
                    {selectedCompany.segment && <div><p className="text-xs text-slate-500">Segmento</p><p className="font-medium text-slate-900">{selectedCompany.segment}</p></div>}
                    <div><p className="text-xs text-slate-500">Fecha de creación</p><p className="font-medium text-slate-900">{selectedCompany.created_at ? new Date(selectedCompany.created_at).toLocaleDateString('es-CL') : '-'}</p></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">👥 Contactos Vinculados ({contacts.length})</h3>
                  {contacts.length === 0 ? (
                    <p className="text-sm text-slate-500">No hay contactos vinculados.</p>
                  ) : (
                    <div className="space-y-2">
                      {contacts.map((link) => (
                        <div key={link.contact_id} className={`p-3 rounded-xl border ${link.is_primary ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900">{link.contacts?.name || `Cliente ${link.contacts?.phone_number?.slice(-4)}`}</p>
                            {link.is_primary && <span className="text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5">Principal</span>}
                          </div>
                          <p className="text-xs text-slate-500">{link.contacts?.phone_number}</p>
                          {link.role && <p className="text-xs text-slate-400 mt-1">Rol: {link.role}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">📁 Documentos ({documents.length})</h3>
                  <div className="mb-4 p-3 bg-slate-50 rounded-xl space-y-3">
                    <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Título del documento (ej: IVA Marzo 2026)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none" />
                    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition ${isDragging || uploadFile ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-green-400'}`}>
                      <input ref={fileInputRef} type="file" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" className="hidden" />
                      {uploadFile ? (
                        <div>
                          <p className="text-sm font-medium text-slate-900">📎 {uploadFile.name}</p>
                          <p className="text-xs text-slate-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-xs text-red-600 hover:underline mt-1">Quitar</button>
                        </div>
                      ) : <p className="text-sm text-slate-500">Arrastra archivo o haz clic</p>}
                    </div>
                    <button type="button" onClick={handleUploadDocument} disabled={!uploadFile || !docTitle.trim() || uploading} className="w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                      {uploading ? 'Subiendo...' : '📤 Subir Documento'}
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {documents.length === 0 ? <p className="text-sm text-slate-500">No hay documentos.</p> : documents.map((doc) => (
                      <div key={doc.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                          <p className="text-xs text-slate-500 truncate">{doc.file_name}</p>
                          <p className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString('es-CL')}</p>
                          {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">Ver documento</a>}
                        </div>
                        <button type="button" onClick={() => handleDeleteDocument(doc.id)} className="text-xs text-red-600 hover:text-red-800 shrink-0">Eliminar</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl mb-4">🏢</div>
                  <p className="text-slate-500 text-sm font-medium">Selecciona una empresa</p>
                  <p className="text-slate-400 text-xs mt-1">para ver sus detalles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nueva Empresa">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social *</label>
            <input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none" placeholder="Ej: MTZ Consultores SpA" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RUT (opcional)</label>
            <input value={newCompanyRut} onChange={(e) => setNewCompanyRut(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none" placeholder="Ej: 76.123.456-7" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button type="button" onClick={handleCreateCompany} disabled={!newCompanyName.trim() || saving} className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}