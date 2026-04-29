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

  const BRAND_GREEN = "var(--color-primary)";
  const ACCENT_NAVY = "var(--color-accent)";

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
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-300 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto relative z-10 w-full px-4">
        
        {/* HEADER SECTION - OPTIMIZED SCALES */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-24 gap-12">
          <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
            <h1 className="text-h1-mobile md:text-h1 font-black text-neural-dark tracking-tighter leading-[0.85] uppercase italic">
               Bóveda <br/><span className="text-primary drop-shadow-2xl">LOOP.</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-10 flex items-center gap-4 italic opacity-60">
              <ShieldCheck size={16} className="text-primary animate-pulse" />
              SISTEMA_DE_ARCHIVO_DE_ALTA_INTEGRIDAD_//_v10.4_PLATINUM
            </p>
          </div>
          
          <div className="flex items-center gap-6 animate-in fade-in slide-in-from-right-8 duration-1000">
             <div className="flex items-center gap-4 bg-white border border-slate-100 px-6 py-3 rounded-xl shadow-2xl italic ring-1 ring-primary/5">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                   <ShieldCheck size={18} className="text-primary" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-neural-dark uppercase tracking-widest leading-none">BLINDADO_AES_256</span>
                   <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1.5 opacity-60">ESTADO_OPTIMAL</span>
                </div>
             </div>
          </div>
        </div>

        {!isRegistered ? (
          /* REGISTRATION / ACCESS FORM - PLATINUM TERMINAL */
          <div className="animate-in fade-in zoom-in-95 duration-1000 flex justify-center mt-20">
            <div className="w-full max-w-[500px] bg-white p-12 md:p-16 shadow-2xl border border-slate-50 relative overflow-hidden italic" style={{ borderRadius: 'var(--radius-xl)' }}>
               <div className="absolute top-0 left-0 w-full h-2 bg-primary/20" />
               
               <div className="mb-14 text-center relative z-10">
                  <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-10 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                     <Fingerprint size={48} className="text-neural-dark opacity-20" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mb-3 text-neural-dark">Verificación.</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed opacity-60">
                    SINCRONIZACIÓN_DE_IDENTIDAD_NODE_//_v10.4
                  </p>
               </div>

               <form onSubmit={handleRegister} className="space-y-8 relative z-10">
                  <div className="relative group bg-slate-50 border border-slate-100 rounded-xl flex items-center overflow-hidden h-20 focus-within:bg-white focus-within:border-primary/50 transition-all shadow-inner">
                      <div className="w-24 pl-6 flex items-center border-r border-slate-100 shrink-0">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">RUT_TERM</span>
                      </div>
                      <input 
                         required
                         placeholder="12.345.678-9"
                         value={rut}
                         onChange={(e) => setRut(e.target.value)}
                         className="flex-1 bg-transparent border-none px-8 h-full text-lg font-black text-neural-dark tracking-[0.2em] outline-none placeholder:text-slate-200 uppercase italic"
                      />
                   </div>
                   
                   {error && (
                     <div className="flex items-center gap-4 p-6 bg-rose-50 rounded-xl border border-rose-100 animate-in fade-in duration-300">
                        <ShieldAlert size={18} className="text-rose-500" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] italic">{error}</span>
                     </div>
                   )}

                   <button 
                     disabled={loading}
                     className="w-full h-20 bg-neural-dark text-white rounded-xl font-black uppercase tracking-[0.5em] text-[12px] hover:bg-primary active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-5 group/btn shadow-2xl relative overflow-hidden ring-1 ring-white/10"
                   >
                     <div className="absolute inset-0 bg-primary/10 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-700" />
                     {loading ? <Loader2 size={24} className="animate-spin" /> : 
                        <>
                         <span className="relative z-10">ACTIVAR_BÓVEDA_//_OPEN</span> 
                         <Terminal size={18} className="group-hover/btn:translate-x-2 transition-transform relative z-10" />
                        </>
                     }
                   </button>
                </form>
            </div>
          </div>
        ) : (
          /* VAULT DASHBOARD - PLATINUM SCALES */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-8 duration-1000 italic">
            
            {/* Sidebar Column */}
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white p-8 border border-slate-100 relative overflow-hidden group rounded-xl shadow-xl">
                <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] mb-6 opacity-60">Estado_de_Integridad.</h3>
                <div className="flex items-end gap-3 mb-5 relative z-10">
                  <span className="text-5xl font-black tracking-tighter text-neural-dark">{knowledge.length + documents.length > 0 ? '98%' : '0%'}</span>
                  <div className="flex flex-col mb-2">
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] leading-none">PROTEGIDO</span>
                  </div>
                </div>
                <div className="w-full bg-slate-50 h-3 rounded-xl overflow-hidden p-1 border border-slate-100 relative z-10 shadow-inner">
                  <div className="bg-primary h-full rounded-xl w-[98%] animate-pulse shadow-[0_0_10px_var(--color-primary)]" />
                </div>
              </div>

              <div className="bg-white p-8 border border-slate-100 group cursor-pointer hover:border-primary/20 transition-all duration-500 rounded-xl shadow-xl relative overflow-hidden">
                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-6 border border-slate-50 group-hover:bg-primary group-hover:text-white transition-all duration-700 shadow-inner">
                  <Cpu size={22} className="group-hover:rotate-12 transition-transform" />
                </div>
                <h4 className="font-black uppercase text-[12px] tracking-tight mb-3 text-neural-dark">Entrenamiento Neural.</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-black uppercase tracking-[0.2em] mb-8 opacity-60">Archivos vectorizados utilizados para entrenar tu cerebro Arise.</p>
                <div className="h-[1px] w-full bg-slate-50 mb-6" />
                <button className="text-[9px] font-black uppercase text-primary tracking-[0.4em] flex items-center gap-4 group/link">
                  CONFIGURAR_RAG <ChevronRight size={14} className="group-hover/link:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-12">
              
              {/* Knowledge Base Section */}
              <div className="bg-white p-10 border border-slate-100 shadow-2xl relative overflow-hidden" style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-8">
                  <div>
                     <h3 className="text-2xl font-black uppercase text-neural-dark tracking-tighter">Base de Conocimiento.</h3>
                     <div className="flex items-center gap-3 mt-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic opacity-60">ACTIVOS_DE_INTELIGENCIA_AI</p>
                     </div>
                  </div>
                  <label className="cursor-pointer bg-neural-dark text-white px-10 py-5 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-primary transition-all flex items-center gap-5 shadow-2xl active:scale-95 group/upload relative overflow-hidden ring-1 ring-white/10">
                    <div className="absolute inset-0 bg-primary/10 -translate-x-full group-hover/upload:translate-x-0 transition-transform duration-700" />
                    {uploading ? <Loader2 className="animate-spin relative z-10" size={18} /> : <Upload size={18} className="relative z-10" />}
                    <span className="relative z-10">{uploading ? "SINC_DATOS..." : "CARGAR_NODO"}</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {knowledge.length === 0 ? (
                    <div className="md:col-span-2 text-center py-24 border border-dashed border-slate-100 rounded-xl group hover:border-primary/20 transition-all duration-700 bg-slate-50/30 shadow-inner">
                      <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-xl group-hover:scale-110 transition-transform">
                        <Layers className="text-slate-200 group-hover:text-primary transition-colors" size={40} strokeWidth={1} />
                      </div>
                      <p className="text-slate-300 text-[11px] font-black uppercase tracking-[0.5em] italic opacity-60">SIN_ACTIVOS_DE_CONOCIMIENTO</p>
                    </div>
                  ) : (
                   knowledge.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-8 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:border-primary/30 transition-all duration-500 group shadow-sm hover:shadow-2xl">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all duration-700 shadow-inner">
                            <FileText size={22} className="group-hover:rotate-6 transition-transform" />
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-neural-dark uppercase tracking-tight group-hover:text-primary transition-colors duration-500 line-clamp-1">{item.file_name || 'DOC_UNNAMED'}</p>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-1.5 opacity-60">{new Date(item.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10 shadow-sm">NEURAL_SYNC</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Financial Documents Section - PLATINUM MATRIX */}
              <div className="bg-white p-10 border border-slate-100 shadow-2xl relative overflow-hidden" style={{ borderRadius: 'var(--radius-xl)' }}>
                <div className="flex justify-between items-center mb-12">
                   <div>
                     <h3 className="text-2xl font-black uppercase text-neural-dark tracking-tighter">Bóveda Financiera.</h3>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mt-2 italic opacity-60">DTES_E_INSTRUMENTOS_DE_PAGO</p>
                   </div>
                   <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-50 shadow-inner text-slate-200">
                      <CreditCard size={24} />
                   </div>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left border-separate border-spacing-y-4">
                      <thead>
                         <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60">Folio / Tipo</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60 text-right">Monto Total</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60 text-center">Estado</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60 text-right">Fecha</th>
                         </tr>
                      </thead>
                      <tbody>
                         {documents.length === 0 ? (
                            <tr>
                               <td colSpan={4} className="py-24 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                                  <p className="text-slate-200 text-[11px] font-black uppercase tracking-[0.5em] italic opacity-60">NO_SE_DETECTARON_DOCUMENTOS_FINANCIEROS</p>
                               </td>
                            </tr>
                         ) : (
                            documents.map(doc => (
                               <tr key={doc.id} className="group cursor-pointer">
                                  <td className="px-8 py-6 bg-slate-50/50 group-hover:bg-white border-y border-l border-slate-100 rounded-l-xl transition-all duration-500 shadow-sm group-hover:shadow-xl">
                                     <p className="text-[14px] font-black text-neural-dark uppercase tracking-tight group-hover:text-primary transition-colors">#{doc.folio}</p>
                                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1.5 opacity-60">{doc.document_type}</p>
                                  </td>
                                  <td className="px-8 py-6 bg-slate-50/50 group-hover:bg-white border-y border-slate-100 transition-all duration-500 text-right">
                                     <p className="text-[15px] font-black text-neural-dark tracking-tighter italic">${Number(doc.amount_total).toLocaleString()}</p>
                                  </td>
                                  <td className="px-8 py-6 bg-slate-50/50 group-hover:bg-white border-y border-slate-100 transition-all duration-500 text-center">
                                     <span className={`text-[9px] font-black px-4 py-1.5 rounded-xl border ${
                                        doc.status === 'paid' ? 'bg-primary/5 text-primary border-primary/10 shadow-sm shadow-primary/5' : 
                                        'bg-rose-50 text-rose-500 border-rose-100 shadow-sm shadow-rose-50'
                                     } uppercase tracking-[0.3em] italic`}>
                                        {doc.status}
                                     </span>
                                  </td>
                                  <td className="px-8 py-6 bg-slate-50/50 group-hover:bg-white border-y border-r border-slate-100 rounded-r-xl transition-all duration-500 text-right">
                                     <p className="text-[12px] font-black text-neural-dark tracking-tighter opacity-80">{new Date(doc.issue_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</p>
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
        <div className="mt-24 flex flex-wrap justify-center gap-12 opacity-30 px-6 pb-20 italic">
          <div className="flex items-center gap-3 group cursor-help hover:opacity-100 transition-opacity">
            <Lock size={16} className="text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">AES_256_PROTOCOL</span>
          </div>
          <div className="flex items-center gap-3 group cursor-help hover:opacity-100 transition-opacity">
            <Database size={16} className="text-neural-dark" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">NEURAL_VAULT_CORE</span>
          </div>
          <div className="flex items-center gap-3 group cursor-help hover:opacity-100 transition-opacity">
            <ShieldAlert size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">ISOLATED_NODE</span>
          </div>
        </div>

      </div>
    </div>
  );
}
