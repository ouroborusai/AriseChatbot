'use client';

import React, { useState, useMemo } from 'react';
import { useCompanies, useCompanyContacts, useClientDocuments, useAllContacts } from '@/lib/hooks/useCompanies';
import { SearchInput } from '@/app/components/SearchInput';
import { Modal } from '@/app/components/Modal';

type DocTab = 'iva' | 'sueldos' | 'carpeta' | 'rut' | 'libros' | 'otros';

const TAB_CONFIG = {
  iva: { label: '🧾 IVA', icon: '🧾' },
  sueldos: { label: '💰 Sueldos', icon: '💰' },
  carpeta: { label: '📁 Carpeta Tributaria', icon: '📁' },
  rut: { label: '🆔 RUT Electrónico', icon: '🆔' },
  libros: { label: '📒 Libro Remuneraciones', icon: '📒' },
  otros: { label: '📄 Otros', icon: '📄' },
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getDocTypeFromTitle(title: string): DocTab {
  const t = title.toLowerCase();
  if (t.includes('iva')) return 'iva';
  if (t.includes('sueldo') || t.includes('liquidación') || t.includes('salario')) return 'sueldos';
  if (t.includes('carpeta')) return 'carpeta';
  if (t.includes('rut')) return 'rut';
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

interface MonthRowProps {
  month: string;
  index: number;
  doc: any;
  year: number;
  activeTab: DocTab;
  onUpload: (title: string, file: File) => Promise<void>;
  onDelete: (docId: string) => Promise<void>;
  uploading: boolean;
}

function MonthRow({ month, index, doc, year, activeTab, onUpload, onDelete, uploading }: MonthRowProps) {
  const [showModal, setShowModal] = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [uploadingLocal, setUploadingLocal] = useState(false);

  const handleUpload = async () => {
    if (!localFile) return;
    setUploadingLocal(true);
    const title = formatDocTitle(activeTab === 'iva' ? 'IVA' : activeTab === 'sueldos' ? 'Liquidación' : activeTab, year, index);
    await onUpload(title, localFile);
    setLocalFile(null);
    setShowModal(false);
    setUploadingLocal(false);
  };

  return (
    <>
      <tr className={`border-b border-slate-100 hover:bg-slate-50 transition ${doc ? 'bg-green-50/30' : ''}`}>
        <td className="py-2 px-3 text-sm font-medium text-slate-700">{month}</td>
        <td className="py-2 px-3">
          {doc ? (
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:underline truncate block max-w-[200px]">
              {doc.file_name}
            </a>
          ) : (
            <span className="text-xs text-slate-400 italic">No disponible</span>
          )}
        </td>
        <td className="py-2 px-3 text-right">
          {doc ? (
            <div className="flex items-center justify-end gap-2">
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase font-bold hover:bg-green-200">
                Ver
              </a>
              <button onClick={() => onDelete(doc.id)} className="text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ) : (
            <label className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded cursor-pointer hover:bg-slate-200 uppercase font-bold transition">
              Subir
              <input type="file" accept=".pdf,.xls,.xlsx,.doc,.docx" className="hidden" onChange={(e) => { setLocalFile(e.target.files?.[0] || null); setShowModal(true); }} />
            </label>
          )}
        </td>
      </tr>

      {showModal && localFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white p-4 rounded-xl max-w-sm w-full mx-4 shadow-2xl border border-slate-200">
            <p className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span className="text-lg">📤</span> Subir {month} {year}
            </p>
            <p className="text-xs text-slate-500 truncate mb-4 bg-slate-50 p-2 rounded border border-slate-100">{localFile.name}</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowModal(false); setLocalFile(null); }} className="flex-1 text-xs font-semibold text-slate-600 py-2 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={handleUpload} disabled={uploading || uploadingLocal} className="flex-1 text-xs font-semibold bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 shadow-sm disabled:opacity-50">
                {uploading || uploadingLocal ? 'Procesando...' : 'Subir ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const NON_MONTHLY_TABS: DocTab[] = ['carpeta', 'rut', 'libros', 'otros'];

function CompanyDocumentsTab({ documents, activeTab, year, onUpload, onDelete, uploading }: CompanyDocumentsTabProps) {
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const docType = getDocTypeFromTitle(doc.title || '');
      if (docType !== activeTab) return false;
      if (NON_MONTHLY_TABS.includes(activeTab)) return true;
      const docYear = parseYearFromTitle(doc.title || '');
      return docYear === year;
    });
  }, [documents, activeTab, year]);

  if (NON_MONTHLY_TABS.includes(activeTab)) {
    return (
      <div className="space-y-2">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No hay documentos
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50">
              <div className="flex-1 min-w-0">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:underline truncate block">
                  {doc.title || doc.file_name}
                </a>
                <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString('es-CL')}</p>
              </div>
              <div className="shrink-0 flex items-center gap-1">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200">
                  Ver
                </a>
                <button onClick={() => onDelete(doc.id)} className="text-xs text-red-600 hover:text-red-800 px-1">✕</button>
              </div>
            </div>
          ))
        )}
        <UploadSingleButton onUpload={onUpload} uploading={uploading} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-slate-50 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">
            <th className="py-2 px-3">Período</th>
            <th className="py-2 px-3">Archivo</th>
            <th className="py-2 px-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {MONTHS.map((month, index) => {
            const doc = filteredDocs.find(d => getMonthFromTitle(d.title || '') === index);
            return (
              <MonthRow key={index} month={month} index={index} doc={doc} year={year} activeTab={activeTab} onUpload={onUpload} onDelete={onDelete} uploading={uploading} />
            );
          })}
        </tbody>
      </table>
      {filteredDocs.length === 0 && (
        <div className="text-center py-4 text-slate-400 text-xs italic bg-slate-50/30">
          No se encontraron documentos cargados para este año
        </div>
      )}
    </div>
  );
}

function UploadSingleButton({ onUpload, uploading }: { onUpload: (title: string, file: File) => Promise<void>; uploading: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [uploadingLocal, setUploadingLocal] = useState(false);

  const handleUpload = async () => {
    if (!localFile) return;
    setUploadingLocal(true);
    await onUpload(localFile.name.replace(/\.[^/.]+$/, ''), localFile);
    setLocalFile(null);
    setShowModal(false);
    setUploadingLocal(false);
  };

  return (
    <>
      <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
        📤 Subir documento
        <input type="file" accept=".pdf,.xls,.xlsx,.doc,.docx" className="hidden" onChange={(e) => { setLocalFile(e.target.files?.[0] || null); setShowModal(true); }} />
      </label>
      {showModal && localFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl max-w-sm w-full mx-4">
            <p className="text-sm font-medium mb-2">Subir documento</p>
            <p className="text-xs text-slate-500 truncate mb-3">{localFile.name}</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowModal(false); setLocalFile(null); }} className="flex-1 text-xs border border-slate-200 px-3 py-2 rounded-lg">Cancelar</button>
              <button onClick={handleUpload} disabled={uploading || uploadingLocal} className="flex-1 text-xs bg-green-600 text-white px-3 py-2 rounded-lg">
                {uploading || uploadingLocal ? 'Subiendo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
  const { contacts: linkedContacts, linkContact, unlinkContact } = useCompanyContacts(selectedCompanyId);
  const { documents, refetch: refetchDocs, deleteDocument } = useClientDocuments(selectedCompanyId);
  const { contacts: allContacts } = useAllContacts();

  const [contactSearch, setContactSearch] = useState('');
  const [isLinkingContact, setIsLinkingContact] = useState(false);

  const filteredAllContacts = allContacts.filter(c => 
    (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) || 
    c.phone_number.includes(contactSearch)
  ).slice(0, 5);

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
      let bucketName = 'client-documents';
      
      console.log('[Upload] Verificando bucket...');
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucketName);
      
      if (bucketError || !bucketData) {
        console.log('[Upload] Bucket no existe, intentando crear...');
        const { error: createErr } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 50000000,
        });
        if (createErr) {
          console.error('[Upload] Error creando bucket:', createErr);
          alert('Error: Storage deshabilitado. '+createErr.message);
          setUploading(false);
          return;
        }
      }
      
      const cleanName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${selectedCompanyId}/${selectedYear}/${title}_${Date.now()}_${cleanName}`;
      console.log('[Upload] Subiendo:', fileName);
      
      const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
      
      if (uploadError) {
        console.error('[Upload] Error:', uploadError);
        alert('Error uploading: ' + uploadError.message);
        setUploading(false);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      await supabase.from('client_documents').insert({
        contact_id: contacts[0]?.contact_id || null,
        company_id: selectedCompanyId,
        title,
        file_name: file.name,
        file_url: publicUrl,
        storage_bucket: bucketName,
        storage_path: fileName,
        file_type: file.type,
      });
      refetchDocs();
      alert('Documento subido exitosamente');
    } catch (e: any) { 
      console.error('Error:', e); 
      alert('Error: ' + (e?.message || e)); 
    }
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
                {/* Header Compacto con info y contactos */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[11px] font-bold uppercase tracking-tight text-slate-500">Datos Empresa</h3>
                      <button type="button" onClick={handleDeleteCompany} className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase transition">Eliminar</button>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-900 leading-tight">{selectedCompany.legal_name}</p>
                      <div className="mt-1 flex gap-3 text-xs text-slate-500">
                        <span>RUT: <b className="text-slate-700">{selectedCompany.rut || 'N/A'}</b></span>
                        <span>Alta: <b className="text-slate-700">{selectedCompany.created_at ? new Date(selectedCompany.created_at).toLocaleDateString() : '-'}</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[11px] font-bold uppercase tracking-tight text-slate-500">Contactos ({linkedContacts.length})</h3>
                      <button type="button" onClick={() => setIsLinkingContact(!isLinkingContact)} className="text-[10px] text-whatsapp-green hover:text-green-700 font-bold uppercase transition">
                        {isLinkingContact ? '✕ Cerrar' : '+ Vincular'}
                      </button>
                    </div>

                    {isLinkingContact ? (
                      <div className="absolute inset-0 bg-white p-2 z-10 flex flex-col animate-in fade-in duration-200">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={contactSearch} 
                            onChange={(e) => setContactSearch(e.target.value)}
                            placeholder="Buscar por nombre/cel..."
                            className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs focus:ring-1 focus:ring-whatsapp-green outline-none"
                            autoFocus
                          />
                          <button onClick={() => setIsLinkingContact(false)} className="text-slate-400 text-xs">✕</button>
                        </div>
                        <div className="mt-1 overflow-y-auto flex-1 bg-slate-50 rounded border border-slate-100">
                          {filteredAllContacts.map(c => (
                            <button key={c.id} onClick={async () => { if (selectedCompanyId) { await linkContact(c.id, selectedCompanyId); setIsLinkingContact(false); setContactSearch(''); } }}
                              className="w-full text-left px-2 py-1 hover:bg-green-100 text-[11px] border-b border-white last:border-0 truncate">
                              <b>{c.name || 'S/N'}</b> ({c.phone_number})
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : linkedContacts.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Sin contactos vinculados.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {linkedContacts.map((link) => (
                          <div key={link.contact_id} className={`flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg border text-[11px] ${link.is_primary ? 'border-green-200 bg-green-50 text-green-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                            <span className="font-bold truncate max-w-[80px]">{link.contacts?.name?.split(' ')[0] || 'Cliente'}</span>
                            <button onClick={() => unlinkContact(link.contact_id, selectedCompanyId!)} className="text-slate-400 hover:text-red-500 transition">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs de Documentos Rediseñados */}
                <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                    {(Object.keys(TAB_CONFIG) as DocTab[]).map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-tight transition-all flex items-center gap-1.5 ${activeTab === tab ? 'bg-white text-green-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                        <span>{TAB_CONFIG[tab].icon}</span>
                        <span className="hidden lg:inline">{TAB_CONFIG[tab].label.split(' ')[1] || TAB_CONFIG[tab].label}</span>
                      </button>
                    ))}
                    <div className="flex-1" />
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold outline-none ring-offset-1 focus:ring-1 focus:ring-whatsapp-green">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="mt-2">
                    <CompanyDocumentsTab documents={documents} activeTab={activeTab} year={selectedYear} onUpload={handleUploadDocument} onDelete={handleDeleteDocument} uploading={uploading} />
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