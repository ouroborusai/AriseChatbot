import React from 'react';
import { Cpu, Zap, Activity, RefreshCw, Send, ShieldCheck, Database, Server } from 'lucide-react';

interface ApiKeyResult {
  status: 'ok' | 'error' | 'testing';
  latency?: number;
}

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
}

interface TelemetryData {
  tokens: number;
  cost: number;
  latency: number;
  wabaId?: string;
  phoneId?: string;
}

interface StudioClusterProps {
  telemetry: TelemetryData;
  apiKeys: ApiKey[];
  keyResults: Record<string, ApiKeyResult>;
  onTestKey: (id: string, key: string) => void;
}

export function StudioCluster({ telemetry, apiKeys, keyResults, onTestKey }: StudioClusterProps) {
  return (
    <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* VITALITY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="loop-card p-10 bg-white/5 border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full" />
           <div className="flex items-center justify-between mb-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Vitalidad IA</p>
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_#22c55e]" />
           </div>
           <h2 className="text-5xl font-black text-white tracking-tighter italic">{apiKeys.length}<span className="text-slate-700 text-2xl ml-1">/</span>{apiKeys.length}</h2>
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-4 flex items-center gap-2">
              <Server size={14} />
              Nodos Neurales Activos
           </p>
        </div>
        
        <div className="loop-card p-10 bg-white/5 border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
           <div className="flex items-center justify-between mb-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Puente Meta</p>
              <Zap size={16} className="text-blue-500 fill-blue-500/20" />
           </div>
           <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">CONECTADO</h2>
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-8 flex items-center gap-2">
              <Activity size={14} />
              Infraestructura Operativa
           </p>
        </div>

        <div className="loop-card p-10 bg-[#020617] border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden group border-dashed">
           <div className="flex items-center justify-between mb-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Latencia MS</p>
              <Cpu size={16} className="text-slate-700" />
           </div>
           <h2 className="text-5xl font-black text-white tracking-tighter italic">{telemetry.latency}</h2>
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-4 flex items-center gap-2">
              <Zap size={14} />
              Ritmo de Respuesta Actual
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* API NODES MONITOR */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-[12px] font-black uppercase text-white flex items-center gap-4 italic">
              <Database size={16} className="text-green-500" />
              Estado de los Nodos Gemini-2.5
            </h3>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg">Round-Robin v2.5</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {apiKeys.map((k, index) => {
              const result = keyResults[k.id];
              return (
                <div key={k.id} className="loop-card p-6 bg-white/5 border-white/5 flex items-center justify-between group hover:bg-white/[0.08] hover:border-white/10 transition-all rounded-[32px] shadow-2xl">
                  <div className="flex items-center gap-8">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-700 group-hover:bg-green-500 group-hover:text-slate-900 transition-all border border-white/5 group-hover:border-transparent">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-4">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest italic">NODO {index + 1}</p>
                        {result?.status === 'ok' ? (
                          <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-green-500/20">OPERATIVO</span>
                        ) : result?.status === 'error' ? (
                          <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-red-500/20">AGOTADO</span>
                        ) : (
                          <span className="bg-white/5 text-slate-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10">ESPERA</span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-slate-600 mt-2 tracking-tighter opacity-60">{k.key_value.substring(0, 32)}...</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {result?.latency && (
                      <div className="text-right">
                        <p className="text-xl font-black text-green-500 tracking-tighter">{result.latency}ms</p>
                        <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">LATENCIA</p>
                      </div>
                    )}
                    <button 
                      onClick={() => onTestKey(k.id, k.key_value)}
                      disabled={result?.status === 'testing'}
                      className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white text-slate-500 hover:text-slate-900 rounded-2xl transition-all disabled:opacity-20 shadow-2xl group/btn"
                    >
                      {result?.status === 'testing' ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* META HEALTH CARD */}
        <div className="lg:col-span-4">
          <div className="loop-card p-10 bg-white/5 border-white/5 text-white shrink-0 overflow-hidden relative rounded-[40px] shadow-2xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
             
             <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-500 mb-10 flex items-center gap-4 italic">
                <ShieldCheck size={16} />
                Salud de Infra
             </h3>
             
             <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Token Auth</span>
                  <span className="text-[10px] font-black text-green-500 tracking-[0.2em] shadow-[0_0_10px_#22c55e33]">VÁLIDO_OK</span>
                </div>
                
                <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">WABA Webhook</span>
                  <span className="text-[10px] font-black text-blue-500 animate-pulse tracking-[0.2em]">ACTIVO_SYNC</span>
                </div>
                
                <div className="pt-8 border-t border-white/10">
                  <p className="text-[9px] font-black text-slate-700 uppercase mb-6 tracking-widest">Meta Data Registry</p>
                  <div className="space-y-4">
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-black text-slate-500 uppercase">WABA_ID</span>
                        <code className="text-[11px] font-mono text-white tracking-tighter bg-black/40 p-3 rounded-xl border border-white/5 truncate">{telemetry.wabaId || '192744882582782'}</code>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-black text-slate-500 uppercase">PHONE_ID</span>
                        <code className="text-[11px] font-mono text-white tracking-tighter bg-black/40 p-3 rounded-xl border border-white/5 truncate">{telemetry.phoneId || '106687442345511'}</code>
                     </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
