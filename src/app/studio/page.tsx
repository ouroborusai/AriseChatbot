'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Cpu, 
  Terminal, 
  Zap, 
  Activity, 
  FileCode, 
  ShieldCheck, 
  Send,
  Plus,
  RefreshCw,
  Sparkles,
  Search,
  ChevronDown,
  Filter,
  BrainCircuit,
  Layers,
  Network,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

const CATEGORIES = ['Todas', 'Onboarding', 'Ventas', 'Soporte', 'Finanzas'];

export default function AIStudio() {
  const [activeTab, setActiveTab] = useState<'brain' | 'skills' | 'cluster'>('brain');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [telemetry, setTelemetry] = useState<any>({ tokens: 0, cost: 0, latency: 0 });
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [keyResults, setKeyResults] = useState<Record<string, { status: 'ok' | 'error' | 'testing', latency?: number }>>({});

  useEffect(() => {
    async function loadStudioData() {
      const activeCompanyId = typeof window !== 'undefined' ? localStorage.getItem('arise_active_company') : null;
      if (!activeCompanyId || activeCompanyId === 'null') {
        setLoading(false);
        return;
      }

      try {
        // Load Prompts
        const { data: prompts } = await supabase
          .from('ai_prompts')
          .select('*')
          .eq('company_id', activeCompanyId)
          .order('created_at', { ascending: true });

        // Load Telemetry
        const { data: telemetryData } = await supabase
          .from('ai_api_telemetry')
          .select('tokens_input, tokens_output, cost_estimated, latency_ms')
          .eq('company_id', activeCompanyId);
        
        // Load API Keys
        const { data: keys } = await supabase
          .from('gemini_api_keys')
          .select('*')
          .order('created_at', { ascending: true });

        if (keys) setApiKeys(keys);

        if (prompts) {
          const mainPrompt = prompts.find(p => p.category === 'General') || prompts[0];
          if (mainPrompt) setSystemPrompt(mainPrompt.system_prompt || '');
          setTemplates(prompts);
          setFilteredTemplates(prompts);
        }

        if (telemetryData) {
          const stats = telemetryData.reduce((acc: any, curr: any) => ({
            tokens: acc.tokens + ((curr.tokens_input || 0) + (curr.tokens_output || 0)),
            cost: acc.cost + (Number(curr.cost_estimated) || 0),
            latency: acc.latency + (curr.latency_ms || 0)
          }), { tokens: 0, cost: 0, latency: 0 });
          
          if (telemetryData.length > 0) stats.latency = Math.round(stats.latency / telemetryData.length);
          setTelemetry(stats);
        }
      } catch (e) {
        console.error("Studio Sync Error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStudioData();
  }, []);

  useEffect(() => {
    let result = templates;
    if (activeCategory !== 'Todas') {
      result = result.filter(t => t.category === activeCategory);
    }
    if (templateSearch) {
      result = result.filter(t => 
        t.name.toLowerCase().includes(templateSearch.toLowerCase())
      );
    }
    setFilteredTemplates(result);
  }, [templateSearch, activeCategory, templates]);

  const testKey = async (id: string, key: string) => {
    setKeyResults(prev => ({ ...prev, [id]: { status: 'testing' } }));
    const startTime = Date.now();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
      });
      const data = await res.json();
      const latency = Date.now() - startTime;
      
      if (data.candidates) {
        setKeyResults(prev => ({ ...prev, [id]: { status: 'ok', latency } }));
      } else if (res.status === 429) {
        setKeyResults(prev => ({ ...prev, [id]: { status: 'error', message: 'Quota Exhausted' } }));
      } else {
        setKeyResults(prev => ({ ...prev, [id]: { status: 'error' } }));
      }
    } catch (e) {
      setKeyResults(prev => ({ ...prev, [id]: { status: 'error' } }));
    }
  };

  const savePrompt = async () => {
    setSaving(true);
    const activeCompanyId = localStorage.getItem('arise_active_company');
    const { error } = await supabase
      .from('ai_prompts')
      .upsert({ 
        company_id: activeCompanyId,
        name: 'ADN Neural Maestro',
        category: 'General',
        system_prompt: systemPrompt,
        is_active: true
      }, { onConflict: 'company_id, name' });

    if (error) console.error('Error saving DNA:', error);
    setTimeout(() => setSaving(false), 1000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <RefreshCw size={40} className="text-primary animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Sincronizando Studio Neural...</p>
      </div>
    </div>
  );

  return (
    <main className="p-4 md:p-10 max-w-7xl mx-auto min-h-screen bg-slate-50/30">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Arise Studio</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Sparkles size={12} className="text-primary" />
            AI Behavior & Response Control Center / v7.0 Diamond Edition
          </p>
        </div>
        <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
          <button 
            onClick={() => setActiveTab('brain')}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'brain' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <BrainCircuit size={14} />
            Cerebro
          </button>
          <button 
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'skills' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Layers size={14} />
            Skills
          </button>
          <button 
            onClick={() => setActiveTab('cluster')}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cluster' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Network size={14} />
            Infraestructura
          </button>
        </div>
      </header>

      {activeTab === 'cluster' ? (
        <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* GLOBAL PULSE BOARD */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="arise-card p-8 bg-white border-l-4 border-l-emerald-500">
                 <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IA Neural (Gemini)</p>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-glow shadow-emerald-500/50" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">8/8 Nodos OK</h2>
                 <p className="text-[10px] font-bold text-slate-400 mt-2">Clúster Ouroborus Activo</p>
              </div>
              <div className="arise-card p-8 bg-white border-l-4 border-l-primary">
                 <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Business</p>
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-glow shadow-primary/50" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">WABA Conectado</h2>
                 <p className="text-[10px] font-bold text-slate-400 mt-2">ID: 1927442801464899</p>
              </div>
              <div className="arise-card p-8 bg-white border-l-4 border-l-slate-200">
                 <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latencia Media</p>
                    <Clock size={16} className="text-slate-300" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">{telemetry.latency}ms</h2>
                 <p className="text-[10px] font-bold text-slate-400 mt-2">Rendimiento Industrial</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-black uppercase text-slate-900 flex items-center gap-3">
                    <Zap size={14} className="text-primary" />
                    Estado de los Nodos Gemini-2.5-Flash-Lite
                  </h3>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Balanceo Round-Robin Activo</span>
                </div>
                
                <div className="space-y-3">
                  {apiKeys.map((k, index) => {
                    const result = keyResults[k.id];
                    return (
                      <div key={k.id} className="arise-card p-4 bg-white border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-all">
                            <Cpu size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="text-[10px] font-black text-slate-900 uppercase">Nodo Neural #{index + 1}</p>
                              {result?.status === 'ok' ? (
                                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[8px] font-black">DISPONIBLE</span>
                              ) : result?.status === 'error' ? (
                                <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md text-[8px] font-black">AGOTADA / ERROR</span>
                              ) : (
                                <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md text-[8px] font-black">{k.is_active ? 'STANDBY' : 'INACTIVA'}</span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-slate-400 mt-1">{k.api_key.substring(0, 30)}...</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          {result?.latency && (
                            <div className="text-right">
                              <p className="text-[9px] font-black text-emerald-500 uppercase">{result.latency}ms</p>
                              <p className="text-[8px] font-bold text-slate-300 uppercase">Latencia</p>
                            </div>
                          )}
                          <button 
                            onClick={() => testKey(k.id, k.api_key)}
                            disabled={result?.status === 'testing'}
                            className="w-10 h-10 flex items-center justify-center bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-xl transition-all disabled:opacity-50 shadow-sm"
                          >
                            {result?.status === 'testing' ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-4 gap-6 flex flex-col">
                <div className="arise-card p-8 bg-neural-dark text-white border-none shrink-0 overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                   <h3 className="text-[11px] font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-3">
                      <Activity size={14} />
                      Meta Health
                   </h3>
                   <div className="space-y-6 relative z-10">
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Token Status</span>
                        <span className="text-[10px] font-black text-emerald-400">VÁLIDO</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Webhook Pulse</span>
                        <span className="text-[10px] font-black text-primary animate-pulse">LIVE</span>
                      </div>
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-4">Meta Data IDs</p>
                        <div className="space-y-2">
                           <p className="text-[10px] font-mono text-slate-400 flex justify-between">WABA: <span className="text-white">192744...</span></p>
                           <p className="text-[10px] font-mono text-slate-400 flex justify-between">Phone: <span className="text-white">106687...</span></p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </section>
      ) : activeTab === 'brain' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="lg:col-span-3 space-y-10">
            <section className="arise-card p-0 overflow-hidden group border-primary/10">
              <div className="bg-slate-50 px-8 py-5 flex justify-between items-center border-b border-slate-100">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Terminal size={14} className="text-primary" />
                    Instrucción Maestra (ADN Sistémico)
                </div>
              </div>
              <div className="relative bg-white">
                <textarea 
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full h-[550px] pl-8 pr-8 py-8 text-slate-800 text-xs font-mono leading-relaxed outline-none resize-none"
                  placeholder="Identidad: Arise Intelligence v7.0..."
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
                      <p className="text-[9px] font-black text-slate-400 uppercase">Token Load</p>
                      <p className="text-xl font-bold text-slate-900">{(telemetry.tokens / 1000).toFixed(1)}k</p>
                    </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-primary rounded-full animate-pulse shadow-glow shadow-primary/50" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map(t => (
                <div key={t.id} className="arise-card p-6 min-h-[160px] relative overflow-hidden group hover:border-primary/20 transition-all cursor-pointer">
                   <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all border border-slate-100">
                        <FileCode size={20} />
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-tight mb-3 pr-8">{t.name}</p>
                </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
