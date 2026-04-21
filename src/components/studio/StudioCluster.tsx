import React from 'react';
import { Cpu, Zap, Activity, RefreshCw, Send } from 'lucide-react';

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
    <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="arise-card p-6 md:p-8 bg-white border-none shadow-arise">
           <div className="flex items-center justify-between mb-4 md:mb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">IA Vitality</p>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
           </div>
           <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">{apiKeys.length}/{apiKeys.length}</h2>
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Active Neural Nodes</p>
        </div>
        <div className="arise-card p-6 md:p-8 bg-[#f2f4f6] border-none shadow-none">
           <div className="flex items-center justify-between mb-4 md:mb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">WhatsApp Bridge</p>
              <Zap size={14} className="text-primary fill-primary/20" />
           </div>
           <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter">CONNECTED</h2>
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Infrastructure Live</p>
        </div>
        <div className="arise-card p-6 md:p-8 bg-white border-none shadow-arise">
           <div className="flex items-center justify-between mb-4 md:mb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Latency_MS</p>
              <Activity size={14} className="text-slate-300" />
           </div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{telemetry.latency}</h2>
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Current Response Pace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-black uppercase text-slate-900 flex items-center gap-3">
              <Zap size={14} className="text-primary" />
              Estado de los Nodos Gemini-2.5-Flash-Lite
            </h3>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Balanceo Round-Robin Activo</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {apiKeys.map((k, index) => {
              const result = keyResults[k.id];
              return (
                <div key={k.id} className="arise-card p-5 bg-white border-none shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-[#f7f9fb] rounded-xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-all">
                      <Cpu size={14} />
                    </div>
                    <div>
                      <div className="flex items-center gap-4">
                        <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">NODE_{index + 1}</p>
                        {result?.status === 'ok' ? (
                          <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[7px] font-black uppercase">Active</span>
                        ) : result?.status === 'error' ? (
                          <span className="bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded text-[7px] font-black uppercase">Exhausted</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[7px] font-black uppercase">Standby</span>
                        )}
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 mt-1 tracking-tight">{k.key_value.substring(0, 40)}...</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {result?.latency && (
                      <div className="text-right">
                        <p className="text-[9px] font-black text-emerald-500 uppercase">{result.latency}ms</p>
                        <p className="text-[8px] font-bold text-slate-300 uppercase">Latencia</p>
                      </div>
                    )}
                    <button 
                      onClick={() => onTestKey(k.id, k.key_value)}
                      disabled={result?.status === 'testing'}
                      className="w-10 h-10 flex items-center justify-center bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-xl transition-all disabled:opacity-50 shadow-sm"
                    >
                      {result?.status === 'testing' ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 gap-6 flex flex-col">
          <div className="arise-card p-6 md:p-8 bg-slate-900 text-white border-none shrink-0 overflow-hidden relative rounded-[32px]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
             <h3 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4 md:mb-6 flex items-center gap-3">
                <Activity size={14} />
                Meta Health
             </h3>
             <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Token Status</span>
                  <span className="text-[10px] font-black text-emerald-400">VÁLIDO</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Webhook Pulse</span>
                  <span className="text-[10px] font-black text-primary animate-pulse">LIVE</span>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-4">Meta Data IDs</p>
                  <div className="space-y-2">
                     <p className="text-[10px] font-mono text-slate-400 flex justify-between">WABA: <span className="text-white">{telemetry.wabaId || '192744...'}</span></p>
                     <p className="text-[10px] font-mono text-slate-400 flex justify-between">Phone: <span className="text-white">{telemetry.phoneId || '106687...'}</span></p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
