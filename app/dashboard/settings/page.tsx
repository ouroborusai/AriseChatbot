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
    <div className="space-y-6 pb-12">
      {/* Header Premium */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200">
            <span className="text-3xl text-white">⚙️</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Centro de Mandos</h1>
            <p className="text-slate-500 mt-1 text-sm">Control técnico y monitoreo de AriseChatbot v1.0</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Izquierdo: Estado de Salud */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Estado de Servicios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HealthItem label="Supabase DB" status="online" uptime="99.9%" icon="🗄️" />
              <HealthItem label="WhatsApp API" status="online" uptime="100%" icon="📱" />
              <HealthItem label="Google Gemini" status="online" uptime="98.5%" icon="🧠" />
              <HealthItem label="Webhook Handler" status="online" uptime="100%" icon="⚡" />
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Configuración de IA</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Modelo Actual</p>
                  <p className="text-sm font-bold text-slate-800">{config?.gemini_model || 'Gemini 1.5 Flash'}</p>
                </div>
                <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">Eficiente</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Personalidad</p>
                  <p className="text-sm font-bold text-slate-800 italic">Asistente Administrativo Experto</p>
                </div>
                <button className="text-xs text-indigo-600 font-bold hover:underline">Editar Prompt</button>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Acciones y Tokens */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Modo de Operación</h3>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-4 w-12 bg-green-500 rounded-full relative">
                <div className="absolute right-1 top-1 h-2 w-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm font-bold">Automatización Activa</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-6">
              El bot está procesando mensajes entrantes automáticamente mediante el flujo definido en Plantillas.
            </p>
            <button className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-bold hover:bg-red-500/20 transition-all uppercase tracking-widest">
              ❌ Parada de Emergencia
            </button>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Mantenimiento</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-between group">
                🔄 Re-sincronizar Plantillas
                <span className="opacity-0 group-hover:opacity-100">→</span>
              </button>
              <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-between group">
                🧹 Limpiar Caché de Sesiones
                <span className="opacity-0 group-hover:opacity-100">→</span>
              </button>
              <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 text-xs font-bold text-red-600 flex items-center justify-between group">
                ⚠️ Resetear Configuración
                <span className="opacity-0 group-hover:opacity-100">!</span>
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
