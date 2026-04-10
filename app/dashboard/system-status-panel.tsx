'use client';

import { useState, useCallback } from 'react';

type Check = { ok: boolean; detail: string };

type HealthPayload = {
  checkedAt: string;
  geminiModel: string | null;
  webhookUrl: string | null;
  env: Record<string, boolean>;
  database: Check;
  whatsapp: Check;
  gemini: Check;
  summary: {
    canReceiveWebhook: boolean;
    canSaveChats: boolean;
    canReplyWhatsApp: boolean;
    metaChecklist: string[];
  };
};

export function useHealthCheck() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health', { credentials: 'include' });
      if (res.status === 401) { setError('Sesión expirada. Vuelve a iniciar sesión.'); setData(null); return; }
      if (!res.ok) { setError(`Error ${res.status}`); setData(null); return; }
      const json = (await res.json()) as HealthPayload;
      setData(json);
    } catch { setError('No se pudo conectar con el servidor.'); setData(null); }
    finally { setLoading(false); }
  }, []);

  return { loading, data, error, runCheck };
}

export function SystemStatusPanel() {
  const { loading, data, error, runCheck } = useHealthCheck();
  const [open, setOpen] = useState(true);

  const Dot = ({ ok }: { ok: boolean }) => (
    <span className={`inline-block w-2 h-2 rounded-full shrink-0 mt-1.5 ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} title={ok ? 'OK' : 'Error'} />
  );

  if (!open) {
    return (
      <div className="card-base bg-slate-50">
        <button type="button" onClick={() => setOpen(true)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100 transition-colors rounded-2xl">
          <span className="text-sm font-semibold text-slate-700">Estado del sistema y conexiones</span>
          <span className="text-slate-500 text-xs">Mostrar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="card-base bg-slate-50">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100 transition-colors rounded-2xl">
        <span className="text-sm font-semibold text-slate-700">Estado del sistema y conexiones</span>
        <span className="text-slate-500 text-xs">Ocultar</span>
      </button>
      <div className="px-4 pb-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={runCheck} disabled={loading} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Verificando...' : '🔄 Verificar ahora'}
          </button>
          {data?.summary && (
            <>
              <span className={`px-2 py-1 rounded text-xs ${data.summary.canReceiveWebhook ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {data.summary.canReceiveWebhook ? '✅ Webhook' : '❌ Webhook'}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${data.summary.canSaveChats ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {data.summary.canSaveChats ? '✅ Base de datos' : '❌ Base de datos'}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${data.summary.canReplyWhatsApp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {data.summary.canReplyWhatsApp ? '✅ WhatsApp' : '❌ WhatsApp'}
              </span>
            </>
          )}
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {data && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2"><Dot ok={data.database.ok} /><span>Base de datos</span><span className="text-slate-500 text-xs">{data.database.detail}</span></div>
            <div className="flex items-center gap-2"><Dot ok={data.whatsapp.ok} /><span>WhatsApp</span><span className="text-slate-500 text-xs">{data.whatsapp.detail}</span></div>
            <div className="flex items-center gap-2"><Dot ok={data.gemini.ok} /><span>IA (Gemini)</span><span className="text-slate-500 text-xs">{data.gemini.detail}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}