'use client';

import { useCallback, useState } from 'react';

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

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 mt-1.5 ${
        ok ? 'bg-emerald-500' : 'bg-red-500'
      }`}
      title={ok ? 'OK' : 'Error'}
    />
  );
}

export function SystemStatusPanel() {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health', { credentials: 'include' });
      if (res.status === 401) {
        setError('Sesión expirada. Vuelve a iniciar sesión.');
        setData(null);
        return;
      }
      if (!res.ok) {
        setError(`Error ${res.status}`);
        setData(null);
        return;
      }
      const json = (await res.json()) as HealthPayload;
      setData(json);
    } catch {
      setError('No se pudo conectar con el servidor.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="card-base bg-slate-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100 transition-colors rounded-2xl"
      >
        <span className="text-sm font-semibold text-slate-700">
          Estado del sistema y conexiones
        </span>
        <span className="text-slate-500 text-xs">{open ? 'Ocultar' : 'Mostrar'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runCheck}
              disabled={loading}
              className="text-sm px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 font-medium"
            >
              {loading ? 'Comprobando…' : 'Ejecutar chequeo'}
            </button>
            <p className="text-xs text-slate-500 self-center">
              Comprueba variables en Vercel, Supabase, WhatsApp y el modelo de IA.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {data && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  className={`rounded-xl border px-4 py-3 ${
                    data.summary.canReplyWhatsApp
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-amber-300 bg-amber-50'
                  }`}
                >
                  <p className="text-slate-600 text-xs uppercase font-medium">Responder por WhatsApp</p>
                  <p className="text-slate-900 font-semibold mt-1">
                    {data.summary.canReplyWhatsApp ? 'Listo' : 'Revisar'}
                  </p>
                </div>
                <div
                  className={`rounded-xl border px-4 py-3 ${
                    data.summary.canSaveChats
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <p className="text-slate-600 text-xs uppercase font-medium">Guardar en Supabase</p>
                  <p className="text-slate-900 font-semibold mt-1">
                    {data.summary.canSaveChats ? 'OK' : 'Fallo'}
                  </p>
                </div>
                <div
                  className={`rounded-xl border px-4 py-3 ${
                    data.summary.canReceiveWebhook
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-amber-300 bg-amber-50'
                  }`}
                >
                  <p className="text-slate-600 text-xs uppercase font-medium">Token verificación Meta</p>
                  <p className="text-slate-900 font-semibold mt-1">
                    {data.summary.canReceiveWebhook ? 'Definido' : 'Falta en Vercel'}
                  </p>
                </div>
              </div>

              {data.webhookUrl && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-slate-500 text-xs mb-2 font-medium">URL para Callback en Meta (webhook)</p>
                  <code className="text-emerald-600 text-xs break-all block select-all bg-slate-50 p-2 rounded-lg">
                    {data.webhookUrl}
                  </code>
                </div>
              )}

              <div className="space-y-3">
                <StatusRow
                  ok={data.database.ok}
                  title="Base de datos (service role)"
                  detail={data.database.detail}
                />
                <StatusRow
                  ok={data.whatsapp.ok}
                  title="API de WhatsApp (Graph)"
                  detail={data.whatsapp.detail}
                />
                <StatusRow
                  ok={data.gemini.ok}
                  title="IA (Gemini / OpenAI)"
                  detail={data.gemini.detail}
                  model={data.geminiModel}
                />
              </div>

              <div>
                <p className="text-slate-500 text-xs uppercase mb-3 font-medium">Variables de entorno</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.env).map(([key, set]) => (
                    <span
                      key={key}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                        set ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {key}: {set ? '✓' : '✗'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-slate-600 text-xs uppercase mb-3 font-medium">Checklist Meta</p>
                <ul className="space-y-2">
                  {data.summary.metaChecklist.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-slate-600 text-xs">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Última comprobación: {new Date(data.checkedAt).toLocaleString('es')}
              </p>
            </div>
          )}

          {!data && !error && !loading && (
            <p className="text-slate-500 text-sm text-center py-4">
              Pulsa <strong className="text-slate-700">Ejecutar chequeo</strong> para verificar el estado del sistema.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusRow({
  ok,
  title,
  detail,
  model,
}: {
  ok: boolean;
  title: string;
  detail: string;
  model?: string | null;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <div className="flex-1 min-w-0">
        <span className="text-slate-700 font-medium">{title}</span>
        {model && <p className="text-slate-400 text-xs mt-0.5 font-mono">Modelo: {model}</p>}
        <p className="text-slate-500 text-xs mt-0.5">{detail}</p>
      </div>
    </div>
  );
}
