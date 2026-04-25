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
    const promptsQuery = supabase
      .from('ai_prompts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    const telemetryQuery = supabase
      .from('ai_api_telemetry')
      .select('tokens_input, tokens_output, cost_estimated, latency_ms')
      .eq('company_id', companyId);
    
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
    <div className="flex items-center justify-center h-screen bg-[#020617]">
      <div className="text-center">
        <RefreshCw size={64} className="text-green-500 animate-spin mx-auto mb-10 opacity-20" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[1em] animate-pulse">Neural_Sync_Active</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-full py-6 md:py-12 animate-in fade-in duration-700 overflow-x-hidden relative">
      
      {/* PREMIUM BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-green-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full -z-10" />

      {/* HEADER SECTION - DIAMOND v10.0 */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16 px-2">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]" />
             <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Laboratorio de IA</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
            Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500">Studio</span>
          </h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-5 flex items-center gap-3">
            <Cpu size={12} className="text-green-500" />
            ADN MAESTRO / PROTOCOLO LOOP v2.5
          </p>
        </div>

        <div className="flex items-center bg-white/5 p-1.5 rounded-[28px] backdrop-blur-3xl border border-white/10 relative z-10 shadow-2xl">
          <button 
            onClick={() => setActiveTab('brain')}
            className={`flex items-center gap-4 px-8 md:px-10 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'brain' ? 'bg-white text-slate-900 shadow-2xl scale-105' : 'text-slate-500 hover:text-white'}`}
          >
            <BrainCircuit size={16} />
            <span>Cerebro</span>
          </button>
          <button 
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-4 px-8 md:px-10 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'skills' ? 'bg-white text-slate-900 shadow-2xl scale-105' : 'text-slate-500 hover:text-white'}`}
          >
            <Layers size={16} />
            <span>Skills</span>
          </button>
          <button 
            onClick={() => setActiveTab('cluster')}
            className={`flex items-center gap-4 px-8 md:px-10 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cluster' ? 'bg-white text-slate-900 shadow-2xl scale-105' : 'text-slate-500 hover:text-white'}`}
          >
            <Network size={16} />
            <span>Infra</span>
          </button>
        </div>
      </header>

      {/* DYNAMIC CONTENT AREA */}
      <div className="animate-in slide-in-from-bottom-10 duration-700">
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

      {/* FOOTER METRICS */}
      <div className="mt-16 pt-10 border-t border-white/5 flex flex-wrap gap-10 opacity-20 px-2">
         <div className="flex items-center gap-3">
            <ShieldCheck size={16} />
            <span className="text-[8px] font-black uppercase tracking-widest">Protocolo Blindado</span>
         </div>
         <div className="flex items-center gap-3">
            <Zap size={16} />
            <span className="text-[8px] font-black uppercase tracking-widest">Latencia Media: {telemetry.latency}ms</span>
         </div>
         <div className="flex items-center gap-3">
            <Activity size={16} />
            <span className="text-[8px] font-black uppercase tracking-widest">Uso de Tokens: {telemetry.tokens.toLocaleString()}</span>
         </div>
      </div>
    </div>
  );
}
