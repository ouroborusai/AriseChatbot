'use client';

import { useEffect, useState } from 'react';

type EnvConfig = {
  ai_backend: string;
  gemini_model: string;
  whatsapp_phone_id: string;
  whatsapp_verify_token: string;
  supabase_url: string;
};

export default function SettingsPage() {
  const [config, setConfig] = useState<EnvConfig | null>(null);
  const [aiKeys, setAiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch('/api/admin/system');
      const data = await res.json();
      if (data.success) setAiKeys(data.keys);
    } catch (e) {
      console.error('Error fetching health');
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleAction = async (action: string, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setActionLoading(action);
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) alert(`✅ Éxito: ${data.message}`);
      else alert(`❌ Error: ${data.error}`);
    } catch (e: any) {
      alert(`❌ Error de conexión: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    setConfig({
      ai_backend: process.env.NEXT_PUBLIC_AI_BACKEND || 'gemini',
      gemini_model: process.env.GEMINI_MODEL || 'models/gemini-2.5-flash',
      whatsapp_phone_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      whatsapp_verify_token: process.env.WHATSAPP_VERIFY_TOKEN || '',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    });
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    setLoading(false);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-1000">
      
      {/* Barra de Navegación Superior / Header Compacto */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 md:px-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
            <span className="text-xl">⚙️</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-black tracking-tight leading-none">CENTRO DE MANDOS</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Neural Engine Control Unit v2.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-700 uppercase">Sistema Operativo</span>
          </div>
          <button 
            onClick={fetchHealth} 
            disabled={checkingHealth}
            className="h-9 px-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 shadow-md shadow-slate-200"
          >
            {checkingHealth ? '---' : 'Sync Telemetry'}
          </button>
        </div>
      </header>

      {/* Grid Principal Estilo Dashboard Pro */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: Estado del Sistema (Poco Espacio) */}
        <aside className="lg:col-span-3 space-y-6">
          <section className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2">
              <div className="h-1 w-8 bg-slate-100 rounded-full" />
            </div>
            <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em] mb-6">Service Mesh</h3>
            <div className="space-y-4">
              <HealthMiniItem label="Database" uptime="99.9%" icon="🗄️" />
              <HealthMiniItem label="WhatsApp" uptime="100%" icon="📱" />
              <HealthMiniItem label="SII Sync" uptime="Active" icon="🏛️" />
            </div>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Neural Protocol</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Rotación:</span>
                <span className="text-[10px] font-black text-indigo-400 uppercase">8 Núcleos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Resiliencia:</span>
                <span className="text-[10px] font-black text-emerald-400 uppercase">CB-60s Active</span>
              </div>
              <div className="h-px bg-slate-800 my-2" />
              <button className="w-full h-10 bg-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all mt-2">
                🛑 Emergency Kill
              </button>
            </div>
          </section>
        </aside>

        {/* COLUMNA CENTRAL: Cluster de IA (El Corazón) */}
        <main className="lg:col-span-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[11px] font-black text-black uppercase tracking-[0.3em]">IA CLUSTER PERFORMANCE</h3>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Monitor de rotación circular en tiempo real</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  {aiKeys.length > 0 ? (
                    aiKeys.map((key) => (
                      <tr key={key.id} className={`group transition-all duration-500 border-b border-slate-50 last:border-0 ${
                        key.isCurrent ? 'bg-indigo-50/40 relative' : 'hover:bg-slate-50/40'
                      }`}>
                        <td className="py-4 pl-4 rounded-l-2xl">
                          <div className="flex items-center gap-4">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                              key.isCurrent ? 'bg-indigo-600 shadow-lg shadow-indigo-200 animate-pulse' : 'bg-slate-100 border border-slate-200'
                            }`}>
                              <span className="text-sm">{key.isCurrent ? '🧠' : '🔑'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[11px] font-black uppercase tracking-tight ${key.isCurrent ? 'text-indigo-900' : 'text-black'}`}>
                                {key.name}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                                {key.status === 'active' ? (key.isCurrent ? 'Active Load' : 'Waiting Queue') : `${key.cooldownRemaining}s Hold`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Msgs</span>
                            <span className="text-[11px] font-mono font-black text-black">💬 {key.requestsToday || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Credits</span>
                            <span className="text-[11px] font-mono font-black text-black">💎 {key.tokensToday?.toLocaleString() || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-6 text-right rounded-r-2xl">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                            key.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${key.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-[8px] font-black uppercase tracking-[0.1em]">
                              {key.status === 'active' ? 'Online' : 'Retry'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        Calibrando Motores Neurales...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* COLUMNA DERECHA: Datos de Configuración y Acciones */}
        <aside className="lg:col-span-3 space-y-6">
          <section className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em] mb-6">Mantenimiento</h3>
            <div className="grid grid-cols-1 gap-2">
              <ActionButton label="Sync Plantillas" action="sync-templates" type="primary" loading={actionLoading} onAction={handleAction} />
              <ActionButton label="Limpiar Sesiones" action="purge-sessions" type="secondary" loading={actionLoading} onAction={handleAction} />
              <div className="h-px bg-slate-100 my-2" />
              <ActionButton label="RESET MAESTRO" action="master-reset" type="danger" loading={actionLoading} onAction={handleAction} />
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em] mb-6">Configuración Activa</h3>
            <div className="space-y-4">
              <ConfigMiniItem icon="🤖" label="Modelo Principal" value={config?.gemini_model || 'Gemini 2.5'} />
              <ConfigMiniItem icon="🎭" label="Voz IA" value="Asesor Senior MTZ" />
              <ConfigMiniItem icon="📡" label="SII Endpoint" value="Producción v3" />
            </div>
          </section>
        </aside>

      </div>
    </div>
  );
}

function HealthMiniItem({ label, uptime, icon }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all group">
      <div className="flex items-center gap-3">
        <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-[9px] font-mono font-black text-emerald-600">{uptime}</span>
    </div>
  );
}

function ConfigMiniItem({ icon, label, value }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs">{icon}</span>
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-[10px] font-black text-black uppercase truncate bg-slate-50 p-2 rounded-lg border border-slate-100">{value}</p>
    </div>
  );
}

function ActionButton({ label, action, type, loading, onAction }: any) {
  const styles: any = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-100',
    secondary: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white'
  };

  return (
    <button 
      onClick={() => onAction(action, '¿Confirmar ejecución de este protocolo?')}
      disabled={!!loading}
      className={`w-full h-11 flex items-center justify-center rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 ${styles[type]}`}
    >
      {loading === action ? 'Procesando...' : label}
    </button>
  );
}
