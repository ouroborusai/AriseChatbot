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
    <div className="flex flex-col w-full max-w-full p-4 md:p-10 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-8 mb-12">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Studio</h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <Sparkles size={10} className="text-primary fill-primary/20" />
            Neural Engineering Interface / OS_VERSION_7.0
          </p>
        </div>
        <div className="flex items-center bg-slate-200/40 p-1 rounded-2xl backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('brain')}
            className={`flex items-center gap-3 px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'brain' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <BrainCircuit size={14} />
            Cerebro
          </button>
          <button 
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-3 px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'skills' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Layers size={14} />
            Skills
          </button>
          <button 
            onClick={() => setActiveTab('cluster')}
            className={`flex items-center gap-3 px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cluster' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Network size={14} />
            Infra
          </button>
        </div>
      </header>

      {activeTab === 'cluster' ? (
        <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* GLOBAL PULSE BOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="arise-card p-6 md:p-8 bg-white border-none shadow-arise">
                 <div className="flex items-center justify-between mb-4 md:mb-6">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">IA Vitality</p>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                 </div>
                 <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">8/8</h2>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Active Neural Nodes</p>
              </div>
              <div className="arise-card p-6 md:p-8 bg-[#f2f4f6] border-none shadow-none">
                 <div className="flex items-center justify-between mb-4 md:mb-6">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">WhatsApp Bridge</p>
                    <Zap size={14} className="text-primary fill-primary/20" />
                 </div>
                 <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter">CONNECTED</h2>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Infrastructure Live</p>
              </div>
              <div className="arise-card p-6 md:p-8 bg-white border-none shadow-arise">
                 <div className="flex items-center justify-between mb-4 md:mb-6">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Latency_MS</p>
                    <Activity size={14} className="text-slate-300" />
                 </div>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{telemetry.latency}</h2>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Current Response Pace</p>
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
                
                <div className="grid grid-cols-1 gap-3">
                  {apiKeys.map((k, index) => {
                    const result = keyResults[k.id];
                    return (
                      <div key={k.id} className="arise-card p-5 bg-white border-none shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-10 h-10 bg-[#f7f9fb] rounded-xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-all">
                            <Cpu size={14} />
                          </div>
                          <div>
                            <div className="flex items-center gap-4">
                              <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">NODE_{index + 1}</p>
                              {result?.status === 'ok' ? (
                                <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[7px] font-black uppercase">Active</span>
                              ) : result?.status === 'error' ? (
                                <span className="bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded text-[7px] font-black uppercase">Exhausted</span>
                              ) : (
                                <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[7px] font-black uppercase">Standby</span>
                              )}
                            </div>
                            <p className="text-[9px] font-mono text-slate-400 mt-1 tracking-tight">{k.api_key.substring(0, 40)}...</p>
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
                <div className="arise-card p-6 md:p-8 bg-neural-dark text-white border-none shrink-0 overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                   <h3 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4 md:mb-6 flex items-center gap-3">
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
            <section className="arise-card p-0 overflow-hidden bg-white border-none shadow-arise">
              <div className="bg-[#f2f4f6] px-6 md:px-8 py-4 md:py-6 flex justify-between items-center">
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                    <Terminal size={12} className="text-primary fill-primary/20" />
                    Master Instruction (Cognitive DNA)
                </div>
              </div>
              <div className="relative">
                <textarea 
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full h-[350px] md:h-[600px] px-6 md:px-10 py-6 md:py-10 text-slate-800 text-[13px] font-mono leading-loose outline-none resize-none bg-white"
                  placeholder="IDENTITY_PROTOCOL_V7.0..."
                />
              </div>
              <div className="px-6 md:px-10 py-6 md:py-8 bg-[#f2f4f6] flex justify-end">
                <button 
                  onClick={savePrompt}
                  disabled={saving}
                  className="bg-gradient-to-br from-[#135bec] to-[#0045bd] text-white px-6 md:px-10 py-3 md:py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Synchronize Neural DNA
                </button>
              </div>
            </section>
          </div>
          <aside className="space-y-6 sticky top-10">
            <div className="arise-card p-8 bg-black/90 text-white border-none shadow-2xl backdrop-blur-xl">
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3 text-primary">
                <Zap size={12} className="fill-primary" />
                Engineering Vault
              </h3>
              <div className="space-y-6">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-primary uppercase mb-2 tracking-widest">Global Variables</p>
                  <code className="text-[10px] font-mono text-slate-400 break-all leading-relaxed">{`{client_context}, {operational_params}`}</code>
                </div>
              </div>
            </div>
            <div className="arise-card p-8 bg-white border-none shadow-arise">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 mb-8 flex items-center gap-3">
                <Activity size={12} className="text-primary" />
                Neural Pulse
              </h3>
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Load Factor</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tighter">{(telemetry.tokens / 1000).toFixed(1)}K</p>
                    </div>
                </div>
                <div className="w-full h-1.5 bg-[#f2f4f6] rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-gradient-to-r from-primary to-accent animate-pulse shadow-[0_0_10px_rgba(0,69,189,0.3)]" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map(t => (
                <div key={t.id} className="arise-card p-8 bg-white border-none shadow-arise relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
                   <div className="flex items-center justify-between mb-8">
                      <div className="w-12 h-12 bg-[#f7f9fb] rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-all">
                        <FileCode size={20} />
                      </div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] bg-[#f2f4f6] px-3 py-1.5 rounded-lg">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.1em] leading-tight mb-3 group-hover:text-primary transition-colors">{t.name}</p>
                    <div className="w-full h-1 bg-[#f2f4f6] mt-4 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-primary/20" />
                    </div>
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
