'use client';

import { useEffect, useState } from 'react';
import { SystemStatusPanel } from '../system-status-panel';

type EnvConfig = {
  ai_backend: string;
  gemini_model: string;
  whatsapp_phone_id: string;
  whatsapp_verify_token: string;
  supabase_url: string;
};

export default function SettingsPage() {
  const [config, setConfig] = useState<EnvConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setConfig({
      ai_backend: process.env.NEXT_PUBLIC_AI_BACKEND || 'gemini',
      gemini_model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
      whatsapp_phone_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      whatsapp_verify_token: process.env.WHATSAPP_VERIFY_TOKEN || '',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-700">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-whatsapp-green border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium">Cargando configuracion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 pb-12 p-4 md:p-8 animate-in fade-in duration-700">
      
      {/* Header Premium Industrial */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 p-6 md:p-10 shadow-2xl shadow-slate-100">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="h-20 w-20 md:h-24 md:w-24 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-xl shadow-slate-200 animate-in zoom-in duration-500">
            <span className="text-4xl text-white">⚙️</span>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Centro de Mandos</h1>
            <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">Neural Engine Control Unit v1.0</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Lado Izquierdo: Estado de Salud */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 md:p-10 shadow-sm relative overflow-hidden group">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Service Mesh Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <HealthItem label="Database Cluster" status="online" uptime="99.9%" icon="🗄️" />
              <HealthItem label="WhatsApp Gateway" status="online" uptime="100%" icon="📱" />
              <HealthItem label="AI Compute (Gemini)" status="online" uptime="98.5%" icon="🧠" />
              <HealthItem label="Real-time Webhook" status="online" uptime="100%" icon="⚡" />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 md:p-10 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">AI Core Configuration</h3>
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 md:p-6 bg-slate-50/50 rounded-[1.8rem] border border-slate-100 hover:border-indigo-600/30 transition-all">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">🤖</div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Modelo Desplegado</p>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{config?.gemini_model || 'Gemini 2.0 Flash-Lite'}</p>
                  </div>
                </div>
                <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg shadow-indigo-200">Producción</span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 md:p-6 bg-slate-50/50 rounded-[1.8rem] border border-slate-100 hover:border-emerald-600/30 transition-all">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">🎭</div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Personalidad Neural</p>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Especialista Administrativo Experto</p>
                  </div>
                </div>
                <button className="h-10 px-5 bg-white text-indigo-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">Ajustar Prompt</button>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Acciones de Emergencia y Mantenimiento */}
        <div className="space-y-6 md:space-y-8">
          
          <div className="bg-slate-950 rounded-[2.5rem] p-8 md:p-10 text-white shadow-3xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6">Security Protocol</h3>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-4 w-12 bg-emerald-500 rounded-full relative shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <div className="absolute right-1 top-1 h-2 w-2 bg-white rounded-full animate-ping"></div>
                </div>
                <span className="text-xs font-black uppercase tracking-widest">IA Auto-Pilot Activo</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-10 font-bold italic">
                El motor neural está procesando flujos inteligentes en tiempo real según la Estrategia de Comunicación definida.
              </p>
              <button className="w-full h-14 bg-rose-600 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/20 active:scale-95">
                🛑 Parada de Pánico
              </button>
            </div>
            {/* Gráfico decorativo de fondo */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-10 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">System Engineering</h3>
            <div className="space-y-2 md:space-y-3">
              <button className="w-full group h-12 flex items-center justify-between px-5 rounded-[1.2rem] hover:bg-slate-50 text-[10px] font-black text-slate-700 uppercase tracking-widest border border-transparent hover:border-slate-100 transition-all">
                <span>🔄 Sync Plantillas</span>
                <span className="text-sm transition-transform group-hover:translate-x-1">→</span>
              </button>
              <button className="w-full group h-12 flex items-center justify-between px-5 rounded-[1.2rem] hover:bg-slate-50 text-[10px] font-black text-slate-700 uppercase tracking-widest border border-transparent hover:border-slate-100 transition-all">
                <span>🧹 Purge Sessions</span>
                <span className="text-sm transition-transform group-hover:translate-x-1">→</span>
              </button>
              <div className="h-px bg-slate-100 my-4" />
              <button className="w-full group h-14 flex items-center justify-between px-5 rounded-[1.2rem] bg-rose-50/50 hover:bg-rose-600 hover:text-white text-[10px] font-black text-rose-600 uppercase tracking-widest transition-all">
                <span>⚠️ Master Reset</span>
                <span className="text-sm group-hover:animate-bounce">!!</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthItem({ label, status, uptime, icon }: { label: string; status: 'online' | 'offline'; uptime: string; icon: string }) {
  return (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{uptime}</span>
          <span className="text-[9px] font-black text-slate-300">UPTIME</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 rounded-lg">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-[9px] font-black text-green-700 uppercase">Live</span>
      </div>
    </div>
  );
}

function ConfigItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <p className="font-mono text-sm text-slate-900 break-all">{value}</p>
    </div>
  );
}
