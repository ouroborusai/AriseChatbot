'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { 
  HelpCircle, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Loader2,
  ChevronRight,
  BookOpen,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import Image from 'next/image';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  created_at: string;
}

export default function FAQManagementPage() {
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Form states
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeCompanyId = activeCompany?.id;

  useEffect(() => {
    if (activeCompanyId) {
      fetchFAQs();
    }
  }, [activeCompanyId]);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('company_id', activeCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFaqs(data || []);
    } catch (err: any) {
      console.error('Error fetching FAQs:', err.message);
      setError('Error al cargar las preguntas frecuentes.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!question || !answer) {
      setError('Pregunta y respuesta son obligatorias.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('faqs')
          .update({ question, answer, is_active: isActive })
          .eq('id', editingId);
        if (error) throw error;
        setSuccess('FAQ actualizada correctamente.');
      } else {
        const { error } = await supabase
          .from('faqs')
          .insert({ company_id: activeCompanyId, question, answer, is_active: isActive });
        if (error) throw error;
        setSuccess('FAQ creada correctamente.');
      }

      fetchFAQs();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta FAQ?')) return;

    try {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
      setFaqs(faqs.filter(f => f.id !== id));
      setSuccess('FAQ eliminada.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleStatus = async (faq: FAQ) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_active: !faq.is_active })
        .eq('id', faq.id);
      if (error) throw error;
      setFaqs(faqs.map(f => f.id === faq.id ? { ...f, is_active: !f.is_active } : f));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setIsActive(faq.is_active);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setIsActive(true);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(search.toLowerCase()) || 
    f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 md:p-12 font-sans relative overflow-hidden">
      
      {/* Background Aesthetic */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#22c55e]/5 blur-[100px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#0f172a]/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 bg-[#22c55e] rounded-lg flex items-center justify-center shadow-lg shadow-[#22c55e]/20">
                  <BookOpen size={16} className="text-white" />
               </div>
               <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Centro de <span className="text-[#22c55e]">Conocimiento</span></h1>
            </div>
            <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
              <Sparkles size={10} className="text-[#22c55e]" />
              Gestión de Inteligencia Diamond v10.1
            </p>
          </div>

          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#0f172a] text-white px-6 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] hover:bg-[#22c55e] transition-all flex items-center gap-3 shadow-xl active:scale-95 group"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            Nueva Pregunta
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm">
              <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Total FAQs</p>
              <div className="text-3xl font-black text-slate-900">{faqs.length}</div>
           </div>
           <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm">
              <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Activadas</p>
              <div className="text-3xl font-black text-[#22c55e]">{faqs.filter(f => f.is_active).length}</div>
           </div>
           <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm border-l-4 border-l-[#22c55e]">
              <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Precisión IA</p>
              <div className="text-3xl font-black text-slate-900">99.8%</div>
           </div>
        </div>

        {/* Search and Feedback */}
        <div className="mb-8">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#22c55e] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="BUSCAR EN LA BASE DE CONOCIMIENTO..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-2xl h-14 pl-14 pr-6 text-xs font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-[#22c55e]/30 shadow-sm transition-all"
              />
           </div>
        </div>

        {/* Modal / Form for Adding/Editing */}
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-2xl rounded-[32px] p-8 md:p-12 shadow-2xl border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                   <button onClick={resetForm} className="text-slate-300 hover:text-slate-900 transition-colors">
                      <X size={24} />
                   </button>
                </div>

                <div className="mb-10">
                   <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">
                      {editingId ? 'Editar FAQ' : 'Añadir Conocimiento'}
                   </h2>
                   <p className="text-[7px] font-black text-[#22c55e] uppercase tracking-[0.4em] mt-1">Sincronización con el Motor Neural</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Pregunta (Prompt del Usuario)</label>
                      <input 
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="EJ: ¿CUÁL ES EL HORARIO DE ATENCIÓN?"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl h-12 px-5 text-[10px] font-black text-slate-900 uppercase tracking-tight focus:bg-white focus:border-[#22c55e]/30 transition-all outline-none"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Respuesta (Salida de la IA)</label>
                      <textarea 
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="ESCRIBE LA RESPUESTA QUE LA IA DEBE ENTREGAR..."
                        rows={5}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-5 text-[10px] font-black text-slate-900 uppercase tracking-tight focus:bg-white focus:border-[#22c55e]/30 transition-all outline-none resize-none"
                      />
                   </div>

                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                         <ToggleRight className={isActive ? "text-[#22c55e]" : "text-slate-200"} size={20} />
                         <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Activar en Producción</span>
                      </div>
                      <button 
                        onClick={() => setIsActive(!isActive)}
                        className={`w-12 h-6 rounded-full relative transition-all ${isActive ? 'bg-[#22c55e]' : 'bg-slate-200'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'right-1' : 'left-1'}`} />
                      </button>
                   </div>

                   <div className="pt-4 flex gap-4">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 h-14 bg-[#0f172a] text-white rounded-xl font-black uppercase tracking-[0.3em] text-[9px] hover:bg-[#22c55e] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar Activo
                      </button>
                      <button 
                        onClick={resetForm}
                        className="px-8 h-14 border border-slate-100 text-slate-400 rounded-xl font-black uppercase tracking-[0.3em] text-[9px] hover:bg-slate-50 transition-all"
                      >
                        Cancelar
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* FAQ List */}
        <div className="space-y-4">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={32} className="animate-spin text-[#22c55e]" />
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">Sincronizando Base de Datos...</p>
             </div>
           ) : filteredFaqs.length === 0 ? (
             <div className="text-center py-24 bg-white border border-slate-100 border-dashed rounded-[32px]">
                <HelpCircle className="mx-auto text-slate-100 mb-4" size={48} strokeWidth={1} />
                <p className="text-slate-300 text-[8px] font-black uppercase tracking-[0.5em]">No hay activos de conocimiento registrados</p>
             </div>
           ) : (
             filteredFaqs.map((faq) => (
               <div key={faq.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-[#22c55e]/20 transition-all shadow-sm group">
                  <div className="p-6">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                           <div className="flex items-center gap-3 mb-1">
                              <span className={`text-[6px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${faq.is_active ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/10' : 'bg-slate-100 text-slate-400'}`}>
                                 {faq.is_active ? 'Activo' : 'Pausado'}
                              </span>
                              <span className="text-[6px] font-black text-slate-300 uppercase tracking-widest">{new Date(faq.created_at).toLocaleDateString()}</span>
                           </div>
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{faq.question}</h3>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => startEdit(faq)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-all"><Edit2 size={14} /></button>
                           <button onClick={() => toggleStatus(faq)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#22c55e] transition-all">
                              {faq.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                           </button>
                           <button onClick={() => handleDelete(faq.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                        </div>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-[10px] font-medium text-slate-600 leading-relaxed uppercase tracking-tight">{faq.answer}</p>
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* Alerts */}
        {success && (
          <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-8 fade-in">
             <div className="bg-white border border-[#22c55e]/20 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
                <CheckCircle2 className="text-[#22c55e]" size={20} />
                <span className="text-[9px] font-black uppercase text-slate-900 tracking-widest">{success}</span>
             </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-8 fade-in">
             <div className="bg-white border border-red-100 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
                <AlertCircle className="text-red-500" size={20} />
                <span className="text-[9px] font-black uppercase text-red-500 tracking-widest">{error}</span>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
