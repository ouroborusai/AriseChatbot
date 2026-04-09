'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ClientDocument = {
  id: string;
  contact_id: string;
  company_id: string | null;
  title: string;
  description: string | null;
  file_name: string | null;
  file_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  file_type: string | null;
  created_at: string;
  contacts?: { phone_number: string; name: string | null };
  companies?: { id: string; legal_name: string } | null;
};

type Contact = {
  id: string;
  phone_number: string;
  name: string | null;
};

type Company = {
  id: string;
  legal_name: string;
};

export default function DocumentsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterContact, setFilterContact] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    
    const [docsRes, contactsRes, companiesRes] = await Promise.all([
      supabase
        .from('client_documents')
        .select('*, contacts:contacts(phone_number, name), companies:companies(id, legal_name)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('contacts').select('id, phone_number, name').order('name'),
      supabase.from('companies').select('id, legal_name').order('legal_name'),
    ]);

    if (docsRes.error) console.error('Error fetching docs:', docsRes.error);
    else setDocuments((docsRes.data || []) as ClientDocument[]);

    if (contactsRes.error) console.error('Error fetching contacts:', contactsRes.error);
    else setContacts(contactsRes.data || []);

    if (companiesRes.error) console.error('Error fetching companies:', companiesRes.error);
    else setCompanies(companiesRes.data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    
    const { error } = await supabase.from('client_documents').delete().eq('id', docId);
    if (error) {
      console.error('Error deleting document:', error);
    } else {
      setDocuments(prev => prev.filter(d => d.id !== docId));
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (filterContact && doc.contact_id !== filterContact) return false;
      if (filterCompany && doc.company_id !== filterCompany) return false;
      if (filterType) {
        const docType = doc.title?.toLowerCase() || '';
        if (!docType.includes(filterType.toLowerCase())) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = doc.title?.toLowerCase().includes(query);
        const matchesFile = doc.file_name?.toLowerCase().includes(query);
        const matchesContact = doc.contacts?.name?.toLowerCase().includes(query);
        const matchesCompany = doc.companies?.legal_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesFile && !matchesContact && !matchesCompany) return false;
      }
      return true;
    });
  }, [documents, filterContact, filterCompany, filterType, searchQuery]);

  const documentTypes = useMemo(() => {
    const types = new Set<string>();
    documents.forEach((d) => {
      if (d.title) types.add(d.title);
    });
    return Array.from(types).slice(0, 20);
  }, [documents]);

  const getFileIcon = (fileName: string | null, fileType: string | null) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️';
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return '📊';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-3 border-solid border-green-500 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col w-full">
      {/* Header */}
      <div className="mb-4 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Documentos</h1>
            <p className="text-sm text-slate-500 mt-1">
              {filteredDocuments.length} de {documents.length} documentos
            </p>
          </div>
          <button
            onClick={fetchData}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            🔄 Recargar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 px-6">
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-slate-500 mb-1">Buscar</label>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Título, archivo, cliente..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
          
          <div className="w-[180px]">
            <label className="block text-xs text-slate-500 mb-1">Cliente</label>
            <select
              value={filterContact}
              onChange={(e) => setFilterContact(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="">Todos</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.phone_number}
                </option>
              ))}
            </select>
          </div>

          <div className="w-[180px]">
            <label className="block text-xs text-slate-500 mb-1">Empresa</label>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="">Todas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legal_name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-[180px]">
            <label className="block text-xs text-slate-500 mb-1">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="">Todos</option>
              {documentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {(filterContact || filterCompany || filterType || searchQuery) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterContact('');
                  setFilterCompany('');
                  setFilterType('');
                  setSearchQuery('');
                }}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="flex-1 min-h-0 px-6 pb-6 overflow-y-auto">
        {filteredDocuments.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300">
            <div className="text-center">
              <div className="text-4xl mb-3">📁</div>
              <p className="text-slate-500 font-medium">
                {searchQuery || filterContact || filterCompany || filterType
                  ? 'No se encontraron documentos con esos filtros'
                  : 'No hay documentos subidos'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="group relative rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                    {getFileIcon(doc.file_name, doc.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{doc.title}</p>
                    {doc.file_name && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {doc.file_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">
                        {new Date(doc.created_at).toLocaleDateString('es-CL')}
                      </span>
                      {doc.companies && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                          {doc.companies.legal_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cliente info */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Cliente:{' '}
                    <span className="font-medium text-slate-700">
                      {doc.contacts?.name || doc.contacts?.phone_number || 'Sin asignar'}
                    </span>
                  </p>
                </div>

                {/* Acciones */}
                <div className="mt-3 flex gap-2">
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-xl bg-green-50 px-3 py-2 text-center text-sm font-medium text-green-700 hover:bg-green-100"
                    >
                      Ver documento
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
