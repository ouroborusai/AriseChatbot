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
    <div className="border-b border-gray-800 bg-gray-900/50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-900/80 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-200">
          Estado del sistema y conexiones
        </span>
        <span className="text-gray-500 text-xs">{open ? 'Ocultar' : 'Mostrar'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runCheck}
              disabled={loading}
              className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? 'Comprobando…' : 'Ejecutar chequeo'}
            </button>
            <p className="text-xs text-gray-500 self-center">
              Comprueba variables en Vercel, Supabase, WhatsApp y el modelo de IA.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {data && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div
                  className={`rounded-lg border px-3 py-2 ${
                    data.summary.canReplyWhatsApp
                      ? 'border-emerald-800 bg-emerald-950/30'
                      : 'border-amber-800 bg-amber-950/20'
                  }`}
                >
                  <p className="text-gray-400 text-xs uppercase">Responder por WhatsApp</p>
                  <p className="text-white font-medium">
                    {data.summary.canReplyWhatsApp ? 'Listo' : 'Revisar'}
                  </p>
                </div>
                <div
                  className={`rounded-lg border px-3 py-2 ${
                    data.summary.canSaveChats ? 'border-emerald-800 bg-emerald-950/30' : 'border-red-900 bg-red-950/20'
                  }`}
                >
                  <p className="text-gray-400 text-xs uppercase">Guardar en Supabase</p>
                  <p className="text-white font-medium">{data.summary.canSaveChats ? 'OK' : 'Fallo'}</p>
                </div>
                <div
                  className={`rounded-lg border px-3 py-2 ${
                    data.summary.canReceiveWebhook
                      ? 'border-emerald-800 bg-emerald-950/30'
                      : 'border-red-900 bg-red-950/20'
                  }`}
                >
                  <p className="text-gray-400 text-xs uppercase">Token verificación Meta</p>
                  <p className="text-white font-medium">
                    {data.summary.canReceiveWebhook ? 'Definido' : 'Falta en Vercel'}
                  </p>
                </div>
              </div>

              {data.webhookUrl && (
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                  <p className="text-gray-400 text-xs mb-1">URL para Callback en Meta (webhook)</p>
                  <code className="text-emerald-400 text-xs break-all block select-all">
                    {data.webhookUrl}
                  </code>
                </div>
              )}

              <ul className="space-y-2">
                <li className="flex gap-2">
                  <Dot ok={data.database.ok} />
                  <div>
                    <span className="text-gray-300 font-medium">Base de datos (service role)</span>
                    <p className="text-gray-500 text-xs mt-0.5">{data.database.detail}</p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <Dot ok={data.whatsapp.ok} />
                  <div>
                    <span className="text-gray-300 font-medium">API de WhatsApp (Graph)</span>
                    <p className="text-gray-500 text-xs mt-0.5">{data.whatsapp.detail}</p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <Dot ok={data.gemini.ok} />
                  <div>
                    <span className="text-gray-300 font-medium">IA (Gemini / OpenAI)</span>
                    {data.geminiModel && (
                      <p className="text-gray-600 text-xs mt-0.5 font-mono">Modelo: {data.geminiModel}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-0.5">{data.gemini.detail}</p>
                  </div>
                </li>
              </ul>

              <div>
                <p className="text-gray-400 text-xs uppercase mb-2">Variables de entorno (solo sí / no)</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.env).map(([key, set]) => (
                    <span
                      key={key}
                      className={`text-xs px-2 py-0.5 rounded ${
                        set ? 'bg-gray-800 text-gray-300' : 'bg-red-950 text-red-300'
                      }`}
                    >
                      {key}: {set ? 'sí' : 'no'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-950/80 p-3">
                <p className="text-gray-400 text-xs uppercase mb-2">Checklist Meta</p>
                <ul className="list-disc list-inside text-gray-500 text-xs space-y-1">
                  {data.summary.metaChecklist.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-gray-600">
                Última comprobación: {new Date(data.checkedAt).toLocaleString('es')}
              </p>
            </div>
          )}

          {!data && !error && !loading && (
            <p className="text-gray-500 text-sm">
              Pulsa <strong>Ejecutar chequeo</strong> para ver si el bot puede recibir webhooks, guardar
              mensajes y contestar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
