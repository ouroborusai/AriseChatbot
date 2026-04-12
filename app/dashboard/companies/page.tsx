'use client';

import React, { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  const monthsList = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const lower = title.toLowerCase();
  for (let i = 0; i < monthsList.length; i++) {
    if (lower.includes(monthsList[i])) return i;
  }
  return null;
}

function calculateCompliance(docs: any[]): 'green' | 'yellow' | 'red' {
  const currentMonth = new Date().getMonth(); // 0-11
  const currentYear = new Date().getFullYear();
  
  const ivaDocs = docs.filter(d => getDocTypeFromTitle(d.title || '') === 'iva');
  if (ivaDocs.length === 0) return 'red';
  
  const hasCurrentMonth = ivaDocs.some(d => {
    const dYear = parseYearFromTitle(d.title || '');
    const dMonth = getMonthFromTitle(d.title || '');
    return dYear === currentYear && dMonth === currentMonth;
  });

  return hasCurrentMonth ? 'green' : 'yellow';
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
        contact_id: linkedContacts[0]?.contact_id || null,
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
    <div className="flex h-full flex-col w-full p-4 md:p-8 animate-in fade-in duration-700">
      
      {/* Header Responsivo Industrial */}
      <div className={`mb-6 md:mb-10 flex items-center justify-between ${selectedCompanyId ? 'hidden md:flex' : 'flex'}`}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">Empresas</h1>
            <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-widest shadow-lg shadow-emerald-200">
              {companies.length} Entidades
            </span>
          </div>
          <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Gestión de Personas Jurídicas</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="h-12 md:h-14 px-5 md:px-8 rounded-2xl bg-slate-900 text-white text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          + Nueva Entidad
        </button>
      </div>

      <div className="flex-1 min-h-0 flex gap-0 md:gap-8 relative overflow-hidden">
        
        {/* LISTADO DE EMPRESAS: Lógica de Panel Único */}
        <div className={`w-full md:w-[400px] shrink-0 flex flex-col bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm transition-all duration-500 ${selectedCompanyId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
            <SearchInput 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Filtrar por nombre o RUT..." 
            />
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-3 space-y-2">
            {filteredCompanies.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                 <span className="text-4xl mb-4">🏢</span>
                 <p className="text-[10px] font-black uppercase tracking-widest">Sin Entidades Registradas</p>
               </div>
            ) : (
              filteredCompanies.map((company) => {
                const status = calculateCompliance(documents.filter(d => d.company_id === company.id));
                return (
                  <button 
                    key={company.id} 
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={`w-full text-left p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] transition-all group relative overflow-hidden ${selectedCompanyId === company.id ? 'bg-slate-900 text-white shadow-2xl scale-[0.98]' : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                       <p className={`text-xs font-black uppercase tracking-tighter truncate max-w-[80%] ${selectedCompanyId === company.id ? 'text-white' : 'text-slate-900'}`}>
                         {company.legal_name}
                       </p>
                       <span className={`h-2 w-2 rounded-full ${status === 'green' ? 'bg-emerald-500' : status === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'} shadow-[0_0_8px] shadow-current`} />
                    </div>
                    <p className={`text-[10px] font-mono font-bold tracking-widest ${selectedCompanyId === company.id ? 'text-slate-400' : 'text-slate-400'}`}>
                      {company.rut || 'RUT NO DEFINIDO'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL DE DETALLE: Lógica de Panel Único */}
        <div className={`flex-1 min-w-0 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 overflow-y-auto custom-scrollbar shadow-sm transition-all duration-500 ${!selectedCompanyId ? 'hidden md:block' : 'block'}`}>
          {selectedCompany ? (
            <div className="p-6 md:p-10 space-y-8 animate-in slide-in-from-right-4 duration-500">
              
              {/* Navegación Móvil */}
              <div className="md:hidden flex items-center justify-between mb-8">
                <button 
                  onClick={() => setSelectedCompanyId(null)}
                  className="h-12 w-12 flex items-center justify-center bg-slate-100 text-slate-900 rounded-2xl active:scale-90 transition-transform"
                >
                  <span className="text-xl">⬅️</span>
                </button>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dashboard Entidad</p>
                   <p className="text-xs font-black text-indigo-600 truncate max-w-[180px]">{selectedCompany.legal_name}</p>
                </div>
              </div>

              {/* GRID DE INFORMACIÓN DE EMPRESA */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* CARD DE IDENTIDAD */}
                <div className="rounded-[2rem] border border-slate-100 bg-slate-50/30 p-6 md:p-8 relative overflow-hidden shadow-sm shadow-slate-100/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Certificación de Datos</h3>
                    <button onClick={handleDeleteCompany} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Eliminar registro</button>
                  </div>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="h-20 w-20 rounded-[1.8rem] bg-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-2xl">
                       {selectedCompany.legal_name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                       <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase truncate leading-tight mb-1">{selectedCompany.legal_name}</h2>
                       <div className="flex flex-wrap items-center gap-3">
                         <span className="text-xs font-mono font-bold text-slate-500">{selectedCompany.rut || 'RUT PENDIENTE'}</span>
                         <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                         <span className="text-[10px] font-black text-slate-400 uppercase">Alta: {new Date(selectedCompany.created_at).toLocaleDateString()}</span>
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100">
                     <span className="text-2xl">🛡️</span>
                     <div>
                       <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight">Estado de Cumplimiento</p>
                       <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                          {calculateCompliance(documents) === 'green' ? 'Entidad regularizada con flujos mensuales al día.' : 'Se requieren actualizaciones de documentos pendientes.'}
                       </p>
                     </div>
                  </div>
                </div>

                {/* CARD DE CONTACTOS ASOCIADOS */}
                <div className="rounded-[2rem] border border-slate-100 bg-white p-6 md:p-8 flex flex-col shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Puntos de Contacto ({linkedContacts.length})</h3>
                    <button 
                      onClick={() => setIsLinkingContact(!isLinkingContact)} 
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all ${isLinkingContact ? 'bg-red-50 text-red-500 border-red-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}
                    >
                      {isLinkingContact ? 'Cerrar' : '+ Vincular'}
                    </button>
                  </div>

                  <div className="flex-1 relative">
                    {isLinkingContact && (
                      <div className="absolute inset-0 bg-white z-10 space-y-3 animate-in fade-in duration-300">
                        <input 
                          type="text" 
                          value={contactSearch} 
                          onChange={(e) => setContactSearch(e.target.value)}
                          placeholder="Buscar por nombre o celular..."
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold focus:border-indigo-600 focus:outline-none shadow-sm"
                          autoFocus
                        />
                        <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1">
                          {filteredAllContacts.map(c => (
                            <button key={c.id} onClick={async () => { if (selectedCompanyId) { await linkContact(c.id, selectedCompanyId); setIsLinkingContact(false); setContactSearch(''); } }}
                              className="w-full text-left p-3 hover:bg-slate-50 rounded-xl text-[11px] font-black uppercase tracking-tighter border border-transparent hover:border-slate-100 transition truncate">
                              {c.name || 'S/N'} <span className="text-slate-400 font-mono ml-2">+{c.phone_number}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                       {linkedContacts.length === 0 ? (
                         <div className="w-full py-10 flex flex-col items-center border-2 border-dashed border-slate-50 rounded-[1.5rem] text-slate-300">
                            <span className="text-2xl mb-2">👤</span>
                            <p className="text-[10px] font-black uppercase tracking-widest">Sin representantes vinculados</p>
                         </div>
                       ) : (
                         linkedContacts.map((link) => (
                           <div key={link.contact_id} className={`flex items-center gap-3 pl-4 pr-2 py-2.5 rounded-2xl border transition-all ${link.is_primary ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900' : 'border-slate-100 bg-slate-50/50 text-slate-600'}`}>
                             <span className="text-[11px] font-black uppercase tracking-tighter truncate max-w-[120px]">{link.contacts?.name || 'Representante'}</span>
                             <button onClick={() => unlinkContact(link.contact_id, selectedCompanyId!)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-sm text-[10px] hover:text-red-500 transition">✕</button>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                </div>

                {/* ACCIONES DE CENTRALIZACIÓN EXPRESO */}
                <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button className="h-16 rounded-[1.5rem] bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
                    📊 <span className="pt-0.5">Enviar Resumen Financiero</span>
                  </button>
                  <button className="h-16 rounded-[1.5rem] bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all">
                    📩 <span className="pt-0.5">Solicitar Pendientes</span>
                  </button>
                   <button className="h-16 rounded-[1.5rem] bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all">
                    📝 <span className="pt-0.5">Notas de Auditoría</span>
                  </button>
                </div>
              </div>

              {/* TERMINAL DE DOCUMENTACIÓN ASOCIADA */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-xl shadow-indigo-100 italic font-black">D</div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Terminal de Documentación</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repositorio SSOT de Auditoría</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-2xl">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Ciclo</span>
                     <select 
                       value={selectedYear} 
                       onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                       className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                     >
                       {years.map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-slate-50/50 border border-slate-100 rounded-[2rem]">
                  {(Object.keys(TAB_CONFIG) as DocTab[]).map((tab) => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 min-w-[100px] h-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200 scale-105 z-10' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <span className="text-base">{TAB_CONFIG[tab].icon}</span>
                      <span>{TAB_CONFIG[tab].label.split(' ')[1] || TAB_CONFIG[tab].label}</span>
                    </button>
                  ))}
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <CompanyDocumentsTab 
                    documents={documents} 
                    activeTab={activeTab} 
                    year={selectedYear} 
                    onUpload={handleUploadDocument} 
                    onDelete={handleDeleteDocument} 
                    uploading={uploading} 
                  />
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-6">
              <div className="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center text-6xl grayscale opacity-30 shadow-inner">🏢</div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Selección de Entidad Inteligente</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 max-w-sm leading-loose">
                  Despliega el panel izquierdo para auditar documentos, gestionar contactos o emitir reportes financieros.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="REGISTRO DE NUEVA ENTIDAD">
        <div className="space-y-6 p-2">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Razón Social Jurídica</label>
              <input 
                value={newCompanyName} 
                onChange={(e) => setNewCompanyName(e.target.value)} 
                className="w-full h-14 rounded-2xl border-2 border-slate-200 bg-white px-6 text-sm font-black uppercase focus:border-indigo-600 focus:outline-none transition-all" 
                placeholder="Ej: INVERSIONES ROJAS SPA" 
                autoFocus 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Identificación Fiscal (RUT)</label>
              <input 
                value={newCompanyRut} 
                onChange={(e) => setNewCompanyRut(e.target.value)} 
                className="w-full h-14 rounded-2xl border-2 border-slate-200 bg-white px-6 text-sm font-mono focus:border-indigo-600 focus:outline-none transition-all" 
                placeholder="76.000.000-K" 
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setShowCreateModal(false)} 
              className="flex-1 h-14 rounded-[1.5rem] border-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all font-mono"
            >
              Cerrar
            </button>
            <button 
              type="button" 
              onClick={handleCreateCompany} 
              disabled={!newCompanyName.trim() || saving} 
              className="flex-1 h-14 rounded-[1.5rem] bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-40"
            >
              {saving ? 'Codificando Entidad...' : 'Confirmar Registro'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}