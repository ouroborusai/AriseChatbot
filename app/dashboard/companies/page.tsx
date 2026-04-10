'use client';

import React, { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCompanies, useCompanyContacts, useCompanyDocuments } from '@/lib/hooks/useCompanies';
import { SearchInput } from '@/app/components/SearchInput';
import { Modal } from '@/app/components/Modal';

type DocTab = 'iva' | 'sueldos' | 'libros' | 'otros';

const TAB_CONFIG = {
  iva: { label: '🧾 IVA', icon: '🧾' },
  sueldos: { label: '💰 Sueldos', icon: '💰' },
  libros: { label: '📒 Libro Remuneraciones', icon: '📒' },
  otros: { label: '📁 Otros', icon: '📁' },
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getDocTypeFromTitle(title: string): DocTab {
  const t = title.toLowerCase();
  if (t.includes('iva')) return 'iva';
  if (t.includes('sueldo') || t.includes('liquidación') || t.includes('salario')) return 'sueldos';
  if (t.includes('libro') || t.includes('remuneracion')) return 'libros';
  return 'otros';
}

function parseYearFromTitle(title: string): number | null {
  const match = title.match(/(20\d{2})/);
  return match ? parseInt(match[1], 10) : null;
}

function getMonthFromTitle(title: string): number | null {
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const lower = title.toLowerCase();
  for (let i = 0; i < months.length; i++) {
    if (lower.includes(months[i])) return i;
  }
  return null;
}

function formatDocTitle(docType: string, year: number, month: number): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  if (docType === 'iva') return `IVA ${months[month]} ${year}`;
  if (docType === 'sueldos') return `Liquidación ${months[month]} ${year}`;
  return `${docType} ${months[month]} ${year}`;
}

interface CompanyDocumentsTabProps {
  documents: any[];
  activeTab: DocTab;
  year: number;
  onUpload: (title: string, file: File) => Promise<void>;
  onDelete: (docId: string) => Promise<void>;
  uploading: boolean;
}

function CompanyDocumentsTab({ documents, activeTab, year, onUpload, onDelete, uploading }: CompanyDocumentsTabProps) {
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const docType = getDocTypeFromTitle(doc.title || '');
      if (docType !== activeTab) return false;
      const docYear = parseYearFromTitle(doc.title || '');
      return docYear === year;
    });
  }, [documents, activeTab, year]);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingLocal, setUploadingLocal] = useState(false);

  const handleSubmit = async () => {
    if (!uploadFile) return;
    setUploadingLocal(true);
    const title = formatDocTitle(activeTab === 'iva' ? 'IVA' : activeTab === 'sueldos' ? 'Liquidación' : activeTab, year, selectedMonth);
    await onUpload(title, uploadFile);
    setUploadFile(null);
    setUploadingLocal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-green-500"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <div className="flex-1" />
        <label className="cursor-pointer rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700 hover:bg-green-100 border border-green-200">
          📤 Subir archivo
          <input type="file" accept=".pdf,.xls,.xlsx,.doc,.docx" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
        </label>
      </div>

      {uploadFile && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
          <span className="text-sm">📎 {uploadFile.name}</span>
          <button onClick={() => setUploadFile(null)} className="text-red-600 text-xs">✕</button>
          <button onClick={handleSubmit} disabled={uploading || uploadingLocal} className="ml-auto text-sm bg-green-600 text-white px-3 py-1 rounded-lg">
            {uploading || uploadingLocal ? 'Subiendo...' : 'Confirmar'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {MONTHS.map((month, index) => {
          const doc = filteredDocs.find(d => getMonthFromTitle(d.title || '') === index);
          return (
            <div key={index} className={`p-3 rounded-xl border ${doc ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{month}</span>
                {doc ? (
                  <span className="text-green-600 text-xs">✓</span>
                ) : (
                  <span className="text-slate-400 text-xs">-</span>
                )}
              </div>
              {doc && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:underline block truncate">
                    {doc.file_name}
                  </a>
                  <button onClick={() => onDelete(doc.id)} className="text-xs text-red-600 mt-1 hover:underline">Eliminar</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          No hay documentos para {year}
        </div>
      )}
    </div>
  );
}

export default function CompaniesPage() {
  const supabase = createClient();
  const { companies, loading, createCompany, deleteCompany, searchCompanies } = useCompanies();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyRut, setNewCompanyRut] = useState('');
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<DocTab>('iva');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [uploading, setUploading] = useState(false);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || null;
  const { contacts } = useCompanyContacts(selectedCompanyId);
  const { documents, refetch: refetchDocs, deleteDocument } = useCompanyDocuments(selectedCompanyId);

  const filteredCompanies = searchQuery ? searchCompanies(searchQuery) : companies;
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current - 1, current - 2];
  }, []);

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
    try { await deleteCompany(selectedCompanyId); setSelectedCompanyId(null); } catch (e) { console.error('Error:', e); }
  };

  const handleUploadDocument = async (title: string, file: File) => {
    if (!selectedCompanyId) return;
    setUploading(true);
    try {
      const fileName = `${selectedCompanyId}/${selectedYear}/${title}_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('client-documents').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('client-documents').getPublicUrl(fileName);
      await supabase.from('client_documents').insert({
        contact_id: contacts[0]?.contact_id || null,
        company_id: selectedCompanyId,
        title,
        file_name: file.name,
        file_url: publicUrl,
        storage_bucket: 'client-documents',
        storage_path: fileName,
        file_type: file.type,
      });
      refetchDocs();
    } catch (e) { console.error('Error:', e); }
    setUploading(false);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try { await deleteDocument(docId); refetchDocs(); } catch (e) { console.error('Error:', e); }
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    {(Object.keys(TAB_CONFIG) as DocTab[]).map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                        {TAB_CONFIG[tab].label}
                      </button>
                    ))}
                    <div className="flex-1" />
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <CompanyDocumentsTab documents={documents} activeTab={activeTab} year={selectedYear} onUpload={handleUploadDocument} onDelete={handleDeleteDocument} uploading={uploading} />
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
            <input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Ej: MTZ Consultores SpA" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RUT (opcional)</label>
            <input value={newCompanyRut} onChange={(e) => setNewCompanyRut(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Ej: 76.123.456-7" />
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