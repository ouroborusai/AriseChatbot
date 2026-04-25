'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  RefreshCw,
  Sparkles,
  BrainCircuit,
  Layers,
  Network,
  Cpu,
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { StudioCluster } from '@/components/studio/StudioCluster';
import { StudioBrain } from '@/components/studio/StudioBrain';
import { StudioSkills } from '@/components/studio/StudioSkills';
import Image from 'next/image';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import useSWR from 'swr';

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
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const [activeTab, setActiveTab] = useState<'brain' | 'skills' | 'cluster'>('brain');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [saving, setSaving] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [keyResults, setKeyResults] = useState<Record<string, { status: 'ok' | 'error' | 'testing', latency?: number }>>({});

  const activeCompanyId = activeCompany?.id;

  const fetchStudioData = async (companyId: string) => {
    const isGlobal = companyId === 'global';

    let promptsQuery = supabase
      .from('ai_prompts')
      .select('*')
      .order('created_at', { ascending: true });

    if (!isGlobal) {
      promptsQuery = promptsQuery.eq('company_id', companyId);
    }

    let telemetryQuery = supabase
      .from('ai_api_telemetry')
      .select('tokens_input, tokens_output, cost_estimated, latency_ms');

    if (!isGlobal) {
      telemetryQuery = telemetryQuery.eq('company_id', companyId);
    }
    
    const keysQuery = supabase
      .from('gemini_api_keys')
      .select('*')
      .order('created_at', { ascending: true });

    const [
      { data: prompts },
      { data: telemetryData },
      { data: keys }
    ] = await Promise.all([
      promptsQuery,
      telemetryQuery,
      keysQuery
    ]);

    let stats = { tokens: 0, cost: 0, latency: 0 };
    if (telemetryData) {
      stats = telemetryData.reduce((acc, curr) => ({
        tokens: acc.tokens + ((curr.tokens_input || 0) + (curr.tokens_output || 0)),
        cost: acc.cost + (Number(curr.cost_estimated) || 0),
        latency: acc.latency + (curr.latency_ms || 0)
      }), { tokens: 0, cost: 0, latency: 0 });
      
      if (telemetryData.length > 0) stats.latency = Math.round(stats.latency / telemetryData.length);
    }

    return {
      prompts: prompts || [],
      telemetry: stats,
      keys: keys || []
    };
  };

  const { data, error, isLoading: isSwrLoading } = useSWR(
    !isContextLoading && activeCompanyId ? `studio_${activeCompanyId}` : null,
    () => fetchStudioData(activeCompanyId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const loading = isContextLoading || isSwrLoading || !data;
  const templates = data?.prompts || [];
  const telemetry = data?.telemetry || { tokens: 0, cost: 0, latency: 0 };
  const apiKeys = data?.keys || [];

  useEffect(() => {
    if (templates.length > 0 && !systemPrompt) {
      const mainPrompt = templates.find(p => p.category === 'General') || templates[0];
      if (mainPrompt) setSystemPrompt(mainPrompt.system_prompt || '');
    }
  }, [templates]);

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
    if (activeCompanyId === 'global') {
      alert('Seleccione una empresa específica para modificar el ADN Neural.');
      setSaving(false);
      return;
    }

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
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <RefreshCw size={32} className="text-[#22c55e] animate-spin mx-auto mb-8 opacity-20" />
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] animate-pulse">Neural_Sync_Active</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-full py-4 md:py-8 animate-in fade-in duration-300 overflow-x-hidden relative">
      
      {/* PERFORMANCE: OPTIMIZED BACKGROUND ACCENTS - ASLAS STYLE */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#22c55e]/5 blur-[64px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#0f172a]/5 blur-[64px] rounded-full -z-10" />

      {/* HEADER SECTION - ASLAS STYLE (Optimized Scales) */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6 px-2">
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            Neural <span className="text-[#22c55e]">Studio</span>
          </h1>
          <p className="text-slate-400 text-[6px] font-black uppercase tracking-[0.3em] mt-2.5 flex items-center gap-2">
            <Cpu size={8} className="text-[#22c55e]" />
            ADN MAESTRO / PROTOCOLO LOOP v2.5
          </p>
        </div>

        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 relative z-10 shadow-sm">
          <button 
            onClick={() => setActiveTab('brain')}
            className={`flex items-center gap-2 px-4 md:px-5 py-1.5 rounded-lg text-[7.5px] font-black uppercase tracking-widest transition-all ${activeTab === 'brain' ? 'bg-white text-slate-900 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <BrainCircuit size={10} />
            <span>Cerebro</span>
          </button>
          <button 
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-4 md:px-5 py-1.5 rounded-lg text-[7.5px] font-black uppercase tracking-widest transition-all ${activeTab === 'skills' ? 'bg-white text-slate-900 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Layers size={10} />
            <span>Skills</span>
          </button>
          <button 
            onClick={() => setActiveTab('cluster')}
            className={`flex items-center gap-2 px-4 md:px-5 py-1.5 rounded-lg text-[7.5px] font-black uppercase tracking-widest transition-all ${activeTab === 'cluster' ? 'bg-white text-slate-900 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Network size={10} />
            <span>Infra</span>
          </button>
        </div>
      </header>

      {/* DYNAMIC CONTENT AREA */}
      <div className="animate-in slide-in-from-bottom-2 duration-300">
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

      {/* FOOTER METRICS - COMPACT */}
      <div className="mt-12 pt-6 border-t border-slate-100 flex flex-wrap gap-8 opacity-40 px-2">
         <div className="flex items-center gap-2">
            <ShieldCheck size={10} className="text-slate-400" />
            <span className="text-[6.5px] font-black uppercase tracking-widest">Protocolo Blindado</span>
         </div>
         <div className="flex items-center gap-2">
            <Zap size={10} className="text-[#22c55e]" />
            <span className="text-[6.5px] font-black uppercase tracking-widest">Latencia Media: {telemetry.latency}ms</span>
         </div>
         <div className="flex items-center gap-2">
            <Activity size={10} className="text-[#0f172a]" />
            <span className="text-[6.5px] font-black uppercase tracking-widest">Uso de Tokens: {telemetry.tokens.toLocaleString()}</span>
         </div>
      </div>
    </div>
  );
}
