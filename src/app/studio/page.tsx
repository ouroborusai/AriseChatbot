'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Cpu, 
  BookOpen, 
  Terminal, 
  Zap, 
  Activity, 
  FileCode, 
  ShieldCheck, 
  Send,
  Plus,
  Settings2,
  RefreshCw,
  Sparkles,
  Search,
  ChevronDown,
  Filter,
  BrainCircuit,
  Layers
} from 'lucide-react';

const CATEGORIES = ['Todas', 'Onboarding', 'Ventas', 'Soporte', 'Finanzas'];

export default function AIStudio() {
  const [activeTab, setActiveTab] = useState<'brain' | 'skills'>('brain');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');

  useEffect(() => {
    async function loadStudioData() {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'system_prompt')
        .single();
      
      const { data: templateData } = await supabase
        .from('templates')
        .select('*')
        .order('name', { ascending: true });

      if (settings) setSystemPrompt(settings.value);
      if (templateData) {
        setTemplates(templateData);
        setFilteredTemplates(templateData);
      }
      setLoading(false);
    }
    loadStudioData();
  }, []);

  useEffect(() => {
    let result = templates;
    if (activeCategory !== 'Todas') {
      result = result.filter(t => t.category === activeCategory || (activeCategory === 'Finanzas' && t.name.includes('03')) || (activeCategory === 'Ventas' && t.name.includes('02')));
    }
    if (templateSearch) {
      result = result.filter(t => 
        t.name.toLowerCase().includes(templateSearch.toLowerCase()) || 
        t.content.toLowerCase().includes(templateSearch.toLowerCase())
      );
    }
    setFilteredTemplates(result);
  }, [templateSearch, activeCategory, templates]);

  const savePrompt = async () => {
    setSaving(true);
    await supabase
      .from('system_settings')
      .update({ value: systemPrompt })
      .eq('key', 'system_prompt');
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <RefreshCw size={40} className="text-primary animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Sincronizando Studio Neural...</p>
      </div>
    </div>
  );

  return (
    <main className="p-4 md:p-10 max-w-7xl mx-auto min-h-screen">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Arise Studio</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Sparkles size={12} className="text-primary" />
            AI Behavior & Response Control Center / v6.22 Industrial Edition
          </p>
        </div>
        <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
          <button 
            onClick={() => setActiveTab('brain')}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'brain' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <BrainCircuit size={14} />
            Cerebro Neural
          </button>
          <button 
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'skills' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Layers size={14} />
            Habilidades
          </button>
        </div>
      </header>

      {activeTab === 'brain' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="lg:col-span-3 space-y-10">
            <section className="arise-card p-0 overflow-hidden group border-primary/10">
              <div className="bg-slate-50 px-8 py-5 flex justify-between items-center border-b border-slate-100">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Terminal size={14} className="text-primary" />
                    Instrucción Maestra (ADN Sistémico)
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                      <ShieldCheck size={12} /> Protegido
                    </span>
                </div>
              </div>
              <div className="relative bg-white">
                <div className="absolute left-0 top-0 w-12 h-full bg-slate-50 border-r border-slate-100 flex flex-col items-center pt-8 text-[9px] font-mono text-slate-300 pointer-events-none">
                  {[...Array(20)].map((_, i) => <div key={i} className="mb-2">{i + 1}</div>)}
                </div>
                <textarea 
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full h-[550px] pl-16 pr-8 py-8 text-slate-800 text-xs font-mono leading-relaxed outline-none resize-none"
                  placeholder="Identidad: Arise Intelligence v6.22..."
                />
              </div>
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={savePrompt}
                  disabled={saving}
                  className="btn-arise px-10 flex items-center gap-3 shadow-xl shadow-primary/30"
                >
                  {saving ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                  <span className="uppercase tracking-widest text-[10px]">Actualizar ADN Neural</span>
                </button>
              </div>
            </section>
          </div>
          <aside className="space-y-6 sticky top-10">
            <div className="arise-card p-8 bg-neural-dark text-white border-none shadow-2xl shadow-slate-900/20">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3 text-primary">
                <Zap size={14} className="fill-primary" />
                Guía de Ingeniería
              </h3>
              <div className="space-y-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[9px] font-black text-primary uppercase mb-2">Variables Arise</p>
                  <code className="text-[10px] font-mono text-slate-300 break-all">{`{nombre_cliente}, {stock_actual}`}</code>
                </div>
                <div className="space-y-4 text-[10px] leading-relaxed text-slate-400">
                  <p className="flex gap-3"><span className="text-primary font-black">01</span> Modela el tono ejecutivo y técnico.</p>
                  <p className="flex gap-3"><span className="text-primary font-black">02</span> Prioriza respuestas menores a 10s.</p>
                  <p className="flex gap-3"><span className="text-primary font-black">03</span> Usa "---" para inyectar botones.</p>
                </div>
              </div>
            </div>
            <div className="arise-card p-8">
              <h3 className="text-[11px] font-black uppercase text-slate-900 mb-6 flex items-center gap-3">
                <Activity size={14} className="text-primary" />
                Estado del Motor
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Input Token Load</p>
                      <p className="text-xl font-bold text-slate-900">12,4k</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-emerald-500 uppercase">Óptimo</p>
                    </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-primary rounded-full animate-pulse shadow-glow shadow-primary/50" />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
                      <Cpu size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-900 uppercase tracking-tighter">Nervio Central</p>
                      <p className="text-[9px] font-bold text-slate-400">Gemini 2.5 Flash Lite</p>
                    </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center border border-primary/10">
                 <Layers size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Biblioteca de Habilidades</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{filteredTemplates.length} Skills Activas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="Buscar habilidad neural..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-6 text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/5 transition-all w-80 shadow-sm"
                />
              </div>
              <button className="btn-arise p-3 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Plus size={24} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-100 w-fit no-scrollbar overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map(t => (
                <div key={t.id} className="arise-card p-6 flex flex-col justify-between group hover:border-primary/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer min-h-[160px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[40px] translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-500" />
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all border border-slate-100 group-hover:border-primary/20">
                        <FileCode size={20} />
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full">
                        {t.name.split('_')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-tight mb-3 pr-8">{t.name}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2 font-medium leading-relaxed group-hover:text-slate-700 transition-colors">{t.content}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                      <span className="text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all uppercase tracking-widest">Configurar Skill</span>
                      <ChevronDown size={14} className="text-slate-300 -rotate-90 group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                <Filter size={48} className="text-slate-200 mx-auto mb-4" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Sin habilidades encontradas</p>
                <button onClick={() => {setActiveCategory('Todas'); setTemplateSearch('');}} className="mt-4 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Limpiar Filtros</button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
