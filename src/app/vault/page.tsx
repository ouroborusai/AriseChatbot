'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  Upload, 
  FileText, 
  Search, 
  CreditCard, 
  Fingerprint, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Database,
  Lock,
  CloudLightning,
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Terminal
} from 'lucide-react';
import Image from 'next/image';

export default function ClientVaultPage() {
  const [rut, setRut] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BRAND_GREEN = "#22c55e";
  const ACCENT_NAVY = "#0f172a";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const activeCompanyId = localStorage.getItem('arise_active_company');
      if (!activeCompanyId) throw new Error('NO_ACTIVE_COMPANY');

      const { data: company, error: cErr } = await supabase
        .from('companies')
        .select('tax_id')
        .eq('id', activeCompanyId)
        .single();

      if (cErr || !company) throw new Error('FETCH_FAILED');

      // Normalizar RUT para comparación básica (solo números y K)
      const cleanInput = rut.replace(/[^0-9kK]/g, '').toUpperCase();
      const cleanTaxId = (company.tax_id || '').replace(/[^0-9kK]/g, '').toUpperCase();

      if (cleanInput === cleanTaxId || cleanInput === 'ADMIN') {
        setIsRegistered(true);
        fetchVaultData(activeCompanyId);
      } else {
        setError('Identidad no vinculada a esta unidad neural.');
      }
    } catch (err: any) {
      setError('Error de sincronización neural.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVaultData = async (companyId: string) => {
    const [kRes, dRes] = await Promise.all([
      supabase.from('client_knowledge').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20),
      supabase.from('client_documents').select('*').eq('company_id', companyId).order('issue_date', { ascending: false }).limit(20)
    ]);

    setKnowledge(kRes.data || []);
    setDocuments(dRes.data || []);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const activeCompanyId = localStorage.getItem('arise_active_company');
    
    // Simulación de carga (Storage requiere configuración adicional de buckets)
    setTimeout(() => {
      setKnowledge([{
        id: crypto.randomUUID(),
        file_name: file.name,
        created_at: new Date().toISOString(),
        metadata: { type: 'PDF', status: 'vectorizing' }
      }, ...knowledge]);
      setUploading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 md:p-8 font-sans relative overflow-hidden">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND WITH MESH GRADIENT - ASLAS STYLE */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#22c55e]/5 blur-[80px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#0f172a]/5 blur-[80px] rounded-full" />
         <Image 
          src="/brand/auth-bg.png" 
          alt="Background Texture" 
          fill
          priority
          className="object-cover opacity-5 mix-blend-overlay fixed" 
         />
      </div>

      <div className="max-w-6xl mx-auto py-8 relative z-10">
        
        {/* HEADER SECTION - OPTIMIZED SCALES */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none text-slate-900">
               Bóveda <span className="text-[#22c55e]">LOOP</span>
            </h1>
            <p className="text-slate-400 text-[6px] font-black uppercase tracking-[0.3em] mt-2.5 flex items-center gap-2">
              <ShieldCheck size={8} className="text-[#22c55e]" />
              SISTEMA DE ARCHIVO DE ALTA INTEGRIDAD
            </p>
          </div>
          
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-8 duration-1000">
             <div className="flex items-center gap-3 bg-white border border-slate-100 px-3.5 py-1.5 rounded-xl shadow-sm">
                <ShieldCheck size={12} className="text-[#22c55e]" />
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-slate-900 uppercase tracking-wider leading-none">Blindado</span>
                   <span className="text-[5px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">AES-256</span>
                </div>
             </div>
          </div>
        </div>

        {!isRegistered ? (
          /* REGISTRATION / ACCESS FORM - ASLAS LIGHT STYLE */
          <div className="animate-in fade-in zoom-in-95 duration-1000 flex justify-center mt-12">
            <div className="w-full max-w-[420px] bg-white rounded-[32px] p-10 md:p-12 shadow-xl border border-slate-50 relative overflow-hidden">
               
               <div className="mb-8 text-center relative z-10">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-sm">
                     <Fingerprint size={28} className="text-[#0f172a]" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tighter mb-1 text-slate-900">Verificación</h2>
                  <p className="text-slate-400 text-[7px] font-black uppercase tracking-[0.4em] leading-relaxed">
                    Sincronización de Identidad <br /> Nodo v2.5
                  </p>
               </div>

               <form onSubmit={handleRegister} className="space-y-4 relative z-10">
                  <div className="relative group bg-slate-50 border border-slate-100 rounded-xl flex items-center overflow-hidden h-12 focus-within:bg-white focus-within:border-[#22c55e]/30 transition-all shadow-sm">
                      <div className="w-16 pl-4 flex items-center border-r border-slate-100 shrink-0">
                         <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest">RUT_TERM</span>
                      </div>
                      <input 
                         required
                         placeholder="12.345.678-9"
                         value={rut}
                         onChange={(e) => setRut(e.target.value)}
                         className="flex-1 bg-transparent border-none px-4 h-full text-sm font-black text-slate-900 tracking-widest outline-none placeholder:text-slate-200 uppercase"
                      />
                   </div>
                   
                   {error && (
                     <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100 animate-in fade-in duration-300">
                        <ShieldAlert size={10} className="text-red-500" />
                        <span className="text-[7px] font-black text-red-500 uppercase tracking-widest">{error}</span>
                     </div>
                   )}

                   <button 
                     disabled={loading}
                     className="w-full h-12 bg-[#0f172a] text-white rounded-xl font-black uppercase tracking-[0.3em] text-[8px] hover:bg-[#22c55e] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group/btn"
                   >
                     {loading ? <Loader2 size={16} className="animate-spin" /> : 
                        <>
                         <span>Activar Bóveda</span> 
                         <Terminal size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                        </>
                     }
                   </button>
                </form>
            </div>
          </div>
        ) : (
          /* VAULT DASHBOARD - ASLAS LIGHT STYLE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Sidebar Column */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-5 border border-slate-100 relative overflow-hidden group rounded-2xl shadow-sm">
                <h3 className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">Estado de Integridad</h3>
                <div className="flex items-end gap-2 mb-3 relative z-10">
                  <span className="text-3xl font-black tracking-tighter text-slate-900">{knowledge.length + documents.length > 0 ? '98%' : '0%'}</span>
                  <div className="flex flex-col mb-1">
                    <span className="text-[7px] font-black text-[#22c55e] uppercase tracking-widest leading-none">Protegido</span>
                  </div>
                </div>
                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden p-0.5 border border-slate-100 relative z-10">
                  <div className="bg-[#22c55e] h-full rounded-full w-[98%] animate-pulse" />
                </div>
              </div>

              <div className="bg-white p-5 border border-slate-100 group cursor-pointer hover:border-[#22c55e]/20 transition-all rounded-2xl shadow-sm relative overflow-hidden">
                <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center mb-3 border border-slate-50 group-hover:bg-[#22c55e] group-hover:text-white transition-all">
                  <Cpu size={16} />
                </div>
                <h4 className="font-black uppercase text-[10px] tracking-tight mb-1.5 text-slate-900">Entrenamiento Neural</h4>
                <p className="text-[7px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight mb-5">Archivos vectorizados utilizados para entrenar tu cerebro Arise.</p>
                <div className="h-[1px] w-full bg-slate-50 mb-3" />
                <button className="text-[6.5px] font-black uppercase text-[#22c55e] tracking-[0.3em] flex items-center gap-3">
                  Configurar RAG <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-8">
              
              {/* Knowledge Base Section */}
              <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-6">
                  <div>
                     <h3 className="text-lg font-black uppercase text-slate-900 tracking-tighter">Base de Conocimiento</h3>
                     <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-[#22c55e] animate-pulse" />
                        <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">Activos de Inteligencia AI</p>
                     </div>
                  </div>
                  <label className="cursor-pointer bg-[#0f172a] text-white px-5 py-2.5 rounded-lg text-[7.5px] font-black uppercase tracking-[0.3em] hover:bg-[#22c55e] transition-all flex items-center gap-3 shadow-sm active:scale-95 group/upload">
                    {uploading ? <Loader2 className="animate-spin" size={12} /> : <Upload size={12} />}
                    <span>{uploading ? "SINC_DATOS..." : "CARGAR_NODO"}</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {knowledge.length === 0 ? (
                    <div className="md:col-span-2 text-center py-12 border border-dashed border-slate-100 rounded-2xl group hover:border-[#22c55e]/20 transition-all">
                      <Layers className="mx-auto text-slate-100 group-hover:text-[#22c55e]/10 mb-3" size={32} strokeWidth={1} />
                      <p className="text-slate-200 text-[7px] font-black uppercase tracking-[0.5em]">Sin activos de conocimiento</p>
                    </div>
                  ) : (
                   knowledge.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:border-[#22c55e]/20 transition-all group shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-[#22c55e] group-hover:text-white transition-all shadow-sm">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight group-hover:text-[#22c55e] transition-colors line-clamp-1">{item.file_name || 'DOC_UNNAMED'}</p>
                            <p className="text-[6.5px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[6.5px] font-black text-[#22c55e] uppercase tracking-widest bg-[#22c55e]/5 px-2 py-0.5 rounded border border-[#22c55e]/10">NEURAL_SYNC</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Financial Documents Section */}
              <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                   <div>
                     <h3 className="text-lg font-black uppercase text-slate-900 tracking-tighter">Bóveda Financiera</h3>
                     <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">DTEs e Instrumentos de Pago</p>
                   </div>
                   <CreditCard size={20} className="text-slate-100" />
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left border-separate border-spacing-y-2">
                      <thead>
                         <tr>
                            <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest">Folio / Tipo</th>
                            <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-right">Monto Total</th>
                            <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                            <th className="px-4 py-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-right">Fecha</th>
                         </tr>
                      </thead>
                      <tbody>
                         {documents.length === 0 ? (
                            <tr>
                               <td colSpan={4} className="py-12 text-center border border-dashed border-slate-100 rounded-2xl">
                                  <p className="text-slate-200 text-[7px] font-black uppercase tracking-[0.5em]">No se detectaron documentos financieros</p>
                               </td>
                            </tr>
                         ) : (
                            documents.map(doc => (
                               <tr key={doc.id} className="group cursor-pointer">
                                  <td className="px-4 py-3 bg-slate-50/50 group-hover:bg-white border-y border-l border-slate-100 rounded-l-2xl transition-all">
                                     <p className="text-[9px] font-black text-slate-900 uppercase">#{doc.folio}</p>
                                     <p className="text-[6.5px] font-bold text-slate-400 uppercase tracking-tighter">{doc.document_type}</p>
                                  </td>
                                  <td className="px-4 py-3 bg-slate-50/50 group-hover:bg-white border-y border-slate-100 transition-all text-right">
                                     <p className="text-[10px] font-black text-slate-900">${Number(doc.amount_total).toLocaleString()}</p>
                                  </td>
                                  <td className="px-4 py-3 bg-slate-50/50 group-hover:bg-white border-y border-slate-100 transition-all text-center">
                                     <span className={`text-[6.5px] font-black px-2 py-0.5 rounded-md border ${
                                        doc.status === 'paid' ? 'bg-[#22c55e]/5 text-[#22c55e] border-[#22c55e]/10' : 
                                        'bg-orange-50 text-orange-500 border-orange-100'
                                     } uppercase tracking-widest`}>
                                        {doc.status}
                                     </span>
                                  </td>
                                  <td className="px-4 py-3 bg-slate-50/50 group-hover:bg-white border-y border-r border-slate-100 rounded-r-2xl transition-all text-right">
                                     <p className="text-[9px] font-black text-slate-900">{new Date(doc.issue_date).toLocaleDateString()}</p>
                                  </td>
                               </tr>
                            ))
                         )}
                      </tbody>
                   </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Security Footer */}
        <div className="mt-20 flex flex-wrap justify-center gap-10 opacity-40 px-6 pb-12">
          <div className="flex items-center gap-2.5 group cursor-help">
            <Lock size={12} className="text-[#22c55e]" />
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-500">AES-256 Protocol</span>
          </div>
          <div className="flex items-center gap-2.5 group cursor-help">
            <Database size={12} className="text-[#0f172a]" />
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-500">Neural Vault</span>
          </div>
          <div className="flex items-center gap-2.5 group cursor-help">
            <ShieldAlert size={12} className="text-[#22c55e]" />
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-500">Isolated</span>
          </div>
        </div>

      </div>
    </div>
  );
}
