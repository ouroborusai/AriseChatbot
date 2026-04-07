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
    // Cargar configuración actual
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
      <div className="flex min-h-screen items-center justify-center bg-whatsapp-panel text-slate-700">
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-whatsapp-panel text-slate-900 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-whatsapp-border font-semibold">
              Sistema
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Configuración</h1>
            <p className="text-sm text-slate-500">
              Estado del sistema y variables de entorno
            </p>
          </div>
        </div>

        {/* Panel de Estado del Sistema */}
        <SystemStatusPanel />

        {/* Configuración Actual */}
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Configuración Actual
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConfigItem
                label="Backend de IA"
                value={config?.ai_backend || 'No configurado'}
                icon="🤖"
              />
              <ConfigItem
                label="Modelo Gemini"
                value={config?.gemini_model || 'No configurado'}
                icon="🧠"
              />
              <ConfigItem
                label="WhatsApp Phone ID"
                value={config?.whatsapp_phone_id || 'No configurado'}
                icon="📱"
              />
              <ConfigItem
                label="Supabase URL"
                value={
                  config?.supabase_url
                    ? `${config.supabase_url.slice(0, 30)}...`
                    : 'No configurado'
                }
                icon="🗄️"
              />
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900 mb-4">
            ⚠️ Importante: Variables de Entorno
          </h2>
          <div className="space-y-3 text-sm text-amber-800">
            <p>
              Las variables de entorno se configuran en <strong>Vercel</strong> para producción:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Ve a tu proyecto en Vercel</li>
              <li>Settings &gt; Environment Variables</li>
              <li>Agrega las variables necesarias</li>
              <li>Redeploya el proyecto para aplicar cambios</li>
            </ol>

            <div className="mt-4 p-4 bg-white rounded-xl border border-amber-200">
              <p className="font-semibold mb-2">Variables requeridas:</p>
              <ul className="space-y-1 font-mono text-xs">
                <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                <li>• SUPABASE_SERVICE_ROLE_KEY</li>
                <li>• WHATSAPP_ACCESS_TOKEN</li>
                <li>• WHATSAPP_PHONE_NUMBER_ID</li>
                <li>• WHATSAPP_VERIFY_TOKEN</li>
                <li>• GEMINI_API_KEY</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Enlaces útiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-sm hover:shadow-md transition text-center"
          >
            <p className="text-2xl mb-2">▲</p>
            <p className="font-semibold text-slate-900">Vercel</p>
            <p className="text-xs text-slate-500">Deploy y variables</p>
          </a>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-sm hover:shadow-md transition text-center"
          >
            <p className="text-2xl mb-2">◈</p>
            <p className="font-semibold text-slate-900">Supabase</p>
            <p className="text-xs text-slate-500">Base de datos</p>
          </a>

          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-sm hover:shadow-md transition text-center"
          >
            <p className="text-2xl mb-2">📘</p>
            <p className="font-semibold text-slate-900">Meta Apps</p>
            <p className="text-xs text-slate-500">WhatsApp API</p>
          </a>
        </div>
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
