'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  RefreshCw,
  Sparkles,
  BrainCircuit,
  Layers,
  Network
} from 'lucide-react';
import { StudioCluster } from '@/components/studio/StudioCluster';
import { StudioBrain } from '@/components/studio/StudioBrain';
import { StudioSkills } from '@/components/studio/StudioSkills';

interface Template {
  id: string;
  name: string;
  category: string;
  system_prompt?: string;
  created_at: string;
}

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  created_at: string;
}

interface Telemetry {
  tokens: number;
  cost: number;
  latency: number;
}

export default function AIStudio() {
  const [activeTab, setActiveTab] = useState<'brain' | 'skills' | 'cluster'>('brain');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [telemetry, setTelemetry] = useState({ tokens: 0, cost: 0, latency: 0 });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
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
          const stats = telemetryData.reduce((acc, curr) => ({
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
            Neural Engineering Interface / OS_VERSION_9.0
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
        <StudioCluster 
          telemetry={telemetry} 
          apiKeys={apiKeys} 
          keyResults={keyResults} 
          onTestKey={testKey} 
        />
      ) : activeTab === 'brain' ? (
        <StudioBrain 
          systemPrompt={systemPrompt}
          setSystemPrompt={setSystemPrompt}
          saving={saving}
          onSave={savePrompt}
          telemetry={telemetry}
        />
      ) : (
        <StudioSkills templates={filteredTemplates} />
      )}
    </div>
  );
}
