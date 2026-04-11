'use client';

import { useMemo } from 'react';
import { useDocuments, useDocumentFilters, useContactsList, useCompaniesList } from '@/lib/hooks/useDocuments';
import { SearchInput } from '@/app/components/SearchInput';

function getFileIcon(fileName: string | null, fileType: string | null) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📄';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️';
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return '📊';
  if (['doc', 'docx'].includes(ext || '')) return '📝';
  return '📁';
}

export default function DocumentsPage() {
  const { documents, loading, refetch, deleteDocument, filterDocuments } = useDocuments();
  const contacts = useContactsList();
  const companies = useCompaniesList();
  const { 
    filters, contactFilter, setContactFilter, 
    companyFilter, setCompanyFilter, 
    typeFilter, setTypeFilter, 
    searchQuery, setSearchQuery, 
    clearFilters, hasFilters 
  } = useDocumentFilters();

  const filteredDocuments = useMemo(() => 
    filterDocuments(documents, filters), 
    [documents, filters, filterDocuments]
  );

  const documentTypes = useMemo(() => 
    Array.from(new Set(documents.map(d => d.title).filter(Boolean))).slice(0, 20), 
    [documents]
  );

  const handleDelete = async (docId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try { await deleteDocument(docId); } catch (e) { console.error('Error:', e); }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="flex h-full flex-col w-full">
      <div className="mb-4 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Documentos</h1>
            <p className="text-sm text-slate-500 mt-1">{filteredDocuments.length} de {documents.length} documentos</p>
          </div>
          <button onClick={refetch} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">🔄 Recargar</button>
        </div>
      </div>

      <div className="mb-4 px-6">
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-slate-500 mb-1">Buscar</label>
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Título, archivo, cliente..." />
          </div>
          <div className="w-[180px]">
            <label className="block text-xs text-slate-500 mb-1">Cliente</label>
            <select value={contactFilter} onChange={(e) => setContactFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-green-500 focus:outline-none">
              <option value="">Todos</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name || c.phone_number}</option>)}
            </select>
          </div>
          <div className="w-[180px]">
            <label className="block text-xs text-slate-500 mb-1">Empresa</label>
            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-green-500 focus:outline-none">
              <option value="">Todas</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
            </select>
          </div>
          <div className="w-[180px]">
            <label className="block text-xs text-slate-500 mb-1">Tipo</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-green-500 focus:outline-none">
              <option value="">Todos</option>
              {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {hasFilters && (
            <div className="flex items-end">
              <button onClick={clearFilters} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100">Limpiar filtros</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 px-6 pb-6 overflow-y-auto">
        {filteredDocuments.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300">
            <div className="text-center">
              <div className="text-4xl mb-3">📁</div>
              <p className="text-slate-500 font-medium">{hasFilters ? 'No se encontraron documentos' : 'No hay documentos subidos'}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="group relative rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">{getFileIcon(doc.file_name ?? null, doc.file_type ?? null)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{doc.title}</p>
                    {doc.file_name && <p className="text-xs text-slate-500 truncate mt-0.5">{doc.file_name}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString('es-CL')}</span>
                      {doc.companies && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full truncate max-w-[120px]">{doc.companies.legal_name}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Cliente: <span className="font-medium text-slate-700">{doc.contacts?.name || doc.contacts?.phone_number || 'Sin asignar'}</span></p>
                </div>
                <div className="mt-3 flex gap-2">
                  {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-xl bg-green-50 px-3 py-2 text-center text-sm font-medium text-green-700 hover:bg-green-100">Ver documento</a>}
                  <button onClick={() => handleDelete(doc.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}