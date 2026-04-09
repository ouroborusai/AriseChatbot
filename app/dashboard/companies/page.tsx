'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type Company = {
  id: string;
  legal_name: string;
  rut: string | null;
  segment: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ContactCompany = {
  contact_id: string;
  company_id: string;
  role: string | null;
  is_primary: boolean;
  contacts: { phone_number: string; name: string | null } | null;
};

type CompanyDocument = {
  id: string;
  contact_id: string;
  company_id: string;
  title: string;
  description: string | null;
  file_name: string | null;
  file_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  file_type: string | null;
  created_at: string;
  contacts?: { phone_number: string; name: string | null };
};

export default function CompaniesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyContacts, setCompanyContacts] = useState<ContactCompany[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyRut, setNewCompanyRut] = useState('');
  const [saving, setSaving] = useState(false);

  // Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('legal_name', { ascending: true });

    if (error) {
      console.error('Error fetching companies:', error);
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchContactsForCompany = async (companyId: string) => {
    const { data, error } = await supabase
      .from('contact_companies')
      .select('contact_id, company_id, role, is_primary, contacts(phone_number, name)')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching company contacts:', error);
      setCompanyContacts([]);
    } else {
      const mapped = (data || []).map((item: any) => ({
        contact_id: item.contact_id,
        company_id: item.company_id,
        role: item.role,
        is_primary: item.is_primary,
        contacts: Array.isArray(item.contacts) ? item.contacts[0] : item.contacts,
      }));
      setCompanyContacts(mapped);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchContactsForCompany(selectedCompany.id);
      fetchDocumentsForCompany(selectedCompany.id);
    }
  }, [selectedCompany?.id]);

  const fetchDocumentsForCompany = async (companyId: string) => {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*, contacts:contacts(phone_number, name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } else {
      const mapped = (data || []).map((item: any) => ({
        ...item,
        contacts: Array.isArray(item.contacts) ? item.contacts[0] : item.contacts,
      }));
      setDocuments(mapped);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadFile(files[0]);
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

  const handleUploadDocument = async () => {
    if (!selectedCompany || !uploadFile || !docTitle.trim()) return;
    setUploading(true);

    try {
      const fileName = `${selectedCompany.id}/${Date.now()}_${uploadFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, uploadFile);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const { error: docError } = await supabase.from('client_documents').insert({
        contact_id: companyContacts[0]?.contact_id || null,
        company_id: selectedCompany.id,
        title: docTitle.trim(),
        file_name: uploadFile.name,
        file_url: publicUrl,
        storage_bucket: 'documents',
        storage_path: fileName,
        file_type: uploadFile.type,
      });

      if (docError) {
        console.error('Error saving document:', docError);
      } else {
        setDocTitle('');
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocumentsForCompany(selectedCompany.id);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    
    const { error } = await supabase.from('client_documents').delete().eq('id', docId);
    if (!error && selectedCompany) {
      fetchDocumentsForCompany(selectedCompany.id);
    }
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('companies').insert({
        legal_name: newCompanyName.trim(),
        rut: newCompanyRut.trim() || null,
      });

      if (error) {
        console.error('Error creating company:', error);
      } else {
        setShowCreateModal(false);
        setNewCompanyName('');
        setNewCompanyRut('');
        fetchCompanies();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta empresa?')) return;
    
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      console.error('Error deleting company:', error);
    } else {
      if (selectedCompany?.id === companyId) {
        setSelectedCompany(null);
      }
      fetchCompanies();
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const query = searchQuery.toLowerCase();
    return companies.filter(
      (c) =>
        c.legal_name.toLowerCase().includes(query) ||
        (c.rut && c.rut.toLowerCase().includes(query))
    );
  }, [companies, searchQuery]);

  const getContactsCount = async (companyId: string) => {
    const { count } = await supabase
      .from('contact_companies')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);
    return count || 0;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-3 border-solid border-green-500 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col w-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Empresas</h1>
          <p className="text-sm text-slate-500 mt-1">
            {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'} registradas
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition"
        >
          + Nueva Empresa
        </button>
      </div>

      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="flex h-full gap-4">
          {/* Lista de empresas */}
          <div className="w-96 shrink-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {/* Buscador */}
            <div className="p-4 border-b border-slate-100">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar empresa..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="text-center py-8 text-slate-500 text-sm">Cargando...</div>
              ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {searchQuery ? 'No se encontraron empresas' : 'No hay empresas registradas'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCompanies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => handleSelectCompany(company)}
                      className={`w-full text-left p-3 rounded-xl transition ${
                        selectedCompany?.id === company.id
                          ? 'bg-green-50 ring-1 ring-green-200'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-semibold text-slate-900 truncate">
                        {company.legal_name}
                      </p>
                      {company.rut && (
                        <p className="text-xs text-slate-500 truncate">RUT: {company.rut}</p>
                      )}
                      {company.segment && (
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                          company.segment === 'pyme' ? 'bg-blue-100 text-blue-700' :
                          company.segment === 'gran_empresa' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {company.segment}
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
            {selectedCompany ? (
              <div className="p-6 space-y-6">
                {/* Info de la empresa */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Información de la Empresa</h3>
                    <button
                      type="button"
                      onClick={() => handleDeleteCompany(selectedCompany.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Razón Social</p>
                      <p className="font-medium text-slate-900">{selectedCompany.legal_name}</p>
                    </div>
                    {selectedCompany.rut && (
                      <div>
                        <p className="text-xs text-slate-500">RUT</p>
                        <p className="font-medium text-slate-900">{selectedCompany.rut}</p>
                      </div>
                    )}
                    {selectedCompany.segment && (
                      <div>
                        <p className="text-xs text-slate-500">Segmento</p>
                        <p className="font-medium text-slate-900">{selectedCompany.segment}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-500">Fecha de creación</p>
                      <p className="font-medium text-slate-900">
                        {new Date(selectedCompany.created_at).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contactos vinculados */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    👥 Contactos Vinculados ({companyContacts.length})
                  </h3>
                  
                  {companyContacts.length === 0 ? (
                    <p className="text-sm text-slate-500">No hay contactos vinculados a esta empresa.</p>
                  ) : (
                    <div className="space-y-2">
                      {companyContacts.map((link) => (
                        <div
                          key={link.contact_id}
                          className={`p-3 rounded-xl border ${
                            link.is_primary
                              ? 'border-green-200 bg-green-50'
                              : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900">
                              {link.contacts?.name || `Cliente ${link.contacts?.phone_number?.slice(-4)}`}
                            </p>
                            {link.is_primary && (
                              <span className="text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5">
                                Principal
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{link.contacts?.phone_number}</p>
                          {link.role && (
                            <p className="text-xs text-slate-400 mt-1">Rol: {link.role}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documentos de la empresa */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      📁 Documentos ({documents.length})
                    </h3>
                  </div>

                  {/* Upload form */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-xl space-y-3">
                    <input
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Título del documento (ej: IVA Marzo 2026)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                    />
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition ${
                        isDragging || uploadFile
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-300 hover:border-green-400'
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
                        <div>
                          <p className="text-sm font-medium text-slate-900">📎 {uploadFile.name}</p>
                          <p className="text-xs text-slate-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="text-xs text-red-600 hover:underline mt-1"
                          >
                            Quitar
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Arrastra archivo o haz clic</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleUploadDocument}
                      disabled={!selectedCompany || !uploadFile || !docTitle.trim() || uploading}
                      className="w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {uploading ? 'Subiendo...' : '📤 Subir Documento'}
                    </button>
                  </div>

                  {/* Lista de documentos */}
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {documents.length === 0 ? (
                      <p className="text-sm text-slate-500">No hay documentos subidos.</p>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                            <p className="text-xs text-slate-500 truncate">{doc.file_name}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(doc.created_at).toLocaleDateString('es-CL')}
                            </p>
                            {doc.file_url && (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:underline"
                              >
                                Ver documento
                              </a>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-xs text-red-600 hover:text-red-800 shrink-0"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl mb-4">
                    🏢
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Selecciona una empresa</p>
                  <p className="text-slate-400 text-xs mt-1">para ver sus detalles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Nueva Empresa</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Razón Social *
                </label>
                <input
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  placeholder="Ej: MTZ Consultores SpA"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  RUT (opcional)
                </label>
                <input
                  value={newCompanyRut}
                  onChange={(e) => setNewCompanyRut(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  placeholder="Ej: 76.123.456-7"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateCompany}
                disabled={!newCompanyName.trim() || saving}
                className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
