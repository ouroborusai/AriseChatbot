'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Upload, FileText, Search, CreditCard, Fingerprint, CheckCircle2, AlertCircle, ChevronRight, Database, Lock, CloudLightning, Sparkles, Cpu, Layers, ArrowRight, ShieldAlert, Loader2, Terminal } from 'lucide-react';
import Image from 'next/image';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import type { ClientKnowledge, ClientDocument } from '@/types/database';

export type VaultKnowledgeType = Pick<ClientKnowledge, 'id' | 'file_name' | 'created_at' | 'content_summary'>;
export type VaultDocumentType = Pick<ClientDocument, 'id' | 'document_type' | 'folio' | 'issue_date' | 'amount_total' | 'status'>;

export default function ClientVaultPage() {
  const { activeCompany } = useActiveCompany();
  const [taxId, setTaxId] = useState('');
  const [isRegistered, setIsRegistered] = useState(true);
  const [knowledge, setKnowledge] = useState<VaultKnowledgeType[]>([]);
  const [documents, setDocuments] = useState<VaultDocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCompanyId = activeCompany?.id;

  useEffect(() => {
    if (activeCompanyId) {
        fetchVaultData(activeCompanyId);
    }
  }, [activeCompanyId]);

  const BRAND_GREEN = "var(--color-primary)";
  const ACCENT_NAVY = "var(--color-accent)";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
        setIsRegistered(true);
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Error de acceso');
        }
    } finally {
        setLoading(false);
    }
  };

  const fetchVaultData = async (companyId: string) => {
    setLoading(true);
    try {
        const [kRes, dRes] = await Promise.all([
          supabase.from('client_knowledge').select('id, file_name, created_at, content_summary').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20),
          supabase.from('client_documents').select('id, document_type, folio, issue_date, amount_total, status').eq('company_id', companyId).order('issue_date', { ascending: false }).limit(20)
        ]);

        if (kRes.data) setKnowledge(kRes.data as VaultKnowledgeType[]);
        if (dRes.data) setDocuments(dRes.data as VaultDocumentType[]);
    } catch (err: unknown) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCompanyId) return;
    setUploading(true);
    try {
        setTimeout(() => {
            setUploading(false);
            fetchVaultData(activeCompanyId);
        }, 1500);
    } catch (err: unknown) {
        console.error(err);
        setUploading(false);
    }
  };

  if (!isRegistered) {
      return (
          <div className="flex flex-col items-center justify-center w-full min-h-[60vh] animate-in fade-in duration-500">
              <div className="arise-card p-12 max-w-md w-full text-center">
                  <Lock size={48} className="text-primary mx-auto mb-6 opacity-80" />
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic text-neural-dark mb-4">Acceso Denegado</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Por favor, registre su Terminal de Acceso</p>
                  
                  <form onSubmit={handleRegister} className="space-y-4">
                      <input 
                          type="text" 
                          placeholder="INGRESAR CREDENCIAL..." 
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-xl text-[10px] font-black uppercase italic tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all text-center"
                      />
                      <button type="submit" className="btn-arise w-full flex items-center justify-center gap-3">
                          {loading ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                          <span>VERIFICAR</span>
                      </button>
                      {error && <p className="text-red-500 text-[9px] font-black mt-4 uppercase tracking-widest">{error}</p>}
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-300 overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      
      <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-12 lg:mb-24 px-4 gap-6 relative z-10">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-neural-dark tracking-tighter uppercase italic">Bóveda <span className="text-primary drop-shadow-xl">Neural.</span></h1>
          <p className="text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] mt-6 flex items-center gap-4 italic opacity-60">
            <Lock size={14} className="text-primary" /> NODO_SEGURO_SSOT_//_v12.0
          </p>
        </div>
      </header>

      <div className="px-4 relative z-10">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="arise-card p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20">
                        <Database size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter uppercase italic">Memoria_Cognitiva</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">client_knowledge_v12.0</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="h-32 flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary" />
                        </div>
                    ) : knowledge.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                            <FileText size={32} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sin documentos indexados</p>
                        </div>
                    ) : (
                        knowledge.map(k => (
                            <div key={k.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-primary/30 transition-all cursor-pointer group bg-white">
                                <div className="flex items-center gap-4">
                                    <FileText size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                                    <div>
                                        <p className="text-[12px] font-black text-neural-dark tracking-tight uppercase italic truncate max-w-[200px] md:max-w-[300px]">{k.file_name || 'Documento'}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(k.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-8">
                    <input type="file" id="upload-knowledge" className="hidden" onChange={handleFileUpload} />
                    <label htmlFor="upload-knowledge" className="btn-arise w-full flex items-center justify-center gap-3 cursor-pointer text-center">
                        {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                        <span>{uploading ? 'PROCESANDO_VECTORES...' : 'INDEXAR_NUEVO_DOCUMENTO'}</span>
                    </label>
                </div>
            </div>

            <div className="arise-card p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-accent/10 rounded-xl text-accent border border-accent/20">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter uppercase italic">Registro_Financiero</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">client_documents_v12.0</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                         <div className="h-32 flex items-center justify-center">
                            <Loader2 className="animate-spin text-accent" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                            <FileText size={32} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sin facturas emitidas</p>
                        </div>
                    ) : (
                        documents.map(d => (
                            <div key={d.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-accent/30 transition-all cursor-pointer group bg-white">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${d.status === 'paid' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                                        <FileText size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-black text-neural-dark tracking-tight uppercase italic">{d.document_type} N°{d.folio}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{d.issue_date ? new Date(d.issue_date).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] font-black text-neural-dark tracking-tight italic">${d.amount_total?.toLocaleString()}</p>
                                    <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${d.status === 'paid' ? 'text-primary' : 'text-amber-500'}`}>{d.status}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
