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
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* VITALITY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 p-6 shadow-sm rounded-2xl relative overflow-hidden group">
           <div className="flex items-center justify-between mb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vitalidad IA</p>
              <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
           </div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{apiKeys.length}<span className="text-slate-200 text-xl ml-1">/</span>{apiKeys.length}</h2>
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-4 flex items-center gap-2">
              <Server size={12} />
              Nodos Neurales Activos
           </p>
        </div>
        
        <div className="bg-white border border-slate-100 p-6 shadow-sm rounded-2xl relative overflow-hidden group">
           <div className="flex items-center justify-between mb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Puente Meta</p>
              <Zap size={14} className="text-[#22c55e]" />
           </div>
           <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">CONECTADO</h2>
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-6 flex items-center gap-2">
              <Activity size={12} />
              Infraestructura Operativa
           </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 shadow-xl rounded-2xl relative overflow-hidden group text-white">
           <div className="flex items-center justify-between mb-6">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Latencia MS</p>
              <Cpu size={14} className="text-white/20" />
           </div>
           <h2 className="text-3xl font-black text-white tracking-tighter">{telemetry.latency}</h2>
           <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-4 flex items-center gap-2">
              <Zap size={12} className="text-[#22c55e]" />
              Ritmo de Respuesta Actual
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* API NODES MONITOR */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-3">
              <Database size={14} className="text-[#22c55e]" />
              Estado de los Nodos Gemini-2.5
            </h3>
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">Round-Robin v2.5</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {apiKeys.map((k, index) => {
              const result = keyResults[k.id];
              return (
                <div key={k.id} className="bg-white border border-slate-100 p-4 flex items-center justify-between group hover:border-[#22c55e]/30 transition-all rounded-xl shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#22c55e] group-hover:text-white transition-all border border-slate-100 group-hover:border-transparent">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">NODO {index + 1}</p>
                        {result?.status === 'ok' ? (
                          <span className="bg-[#22c55e]/10 text-[#22c55e] px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border border-[#22c55e]/10">OPERATIVO</span>
                        ) : result?.status === 'error' ? (
                          <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border border-red-100">AGOTADO</span>
                        ) : (
                          <span className="bg-slate-50 text-slate-300 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border border-slate-100">ESPERA</span>
                        )}
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 mt-1 tracking-tight">{k.key_value?.substring(0, 24) || 'NULL_NODE'}...</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {result?.latency && (
                      <div className="text-right">
                        <p className="text-lg font-black text-[#22c55e] tracking-tighter">{result.latency}ms</p>
                        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">LATENCIA</p>
                      </div>
                    )}
                    <button 
                      onClick={() => onTestKey(k.id, k.key_value)}
                      disabled={result?.status === 'testing'}
                      className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-300 hover:text-[#22c55e] hover:border-[#22c55e] rounded-lg transition-all disabled:opacity-20"
                    >
                      {result?.status === 'testing' ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* META HEALTH CARD */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-100 p-8 shadow-sm rounded-2xl relative overflow-hidden group">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 mb-8 flex items-center gap-3">
                <ShieldCheck size={16} className="text-[#22c55e]" />
                Salud de Infra
             </h3>
             
             <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 group hover:border-[#22c55e]/20 transition-all">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Token Auth</span>
                  <span className="text-[9px] font-black text-[#22c55e] tracking-widest">VÁLIDO_OK</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 group hover:border-[#22c55e]/20 transition-all">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">WABA Webhook</span>
                  <span className="text-[9px] font-black text-[#22c55e] animate-pulse tracking-widest">ACTIVO_SYNC</span>
                </div>
                
                <div className="pt-6 border-t border-slate-50">
                  <p className="text-[8px] font-black text-slate-200 uppercase mb-6 tracking-widest">Meta Data Registry</p>
                  <div className="space-y-4">
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[7px] font-black text-slate-300 uppercase">WABA_ID</span>
                        <code className="text-[10px] font-mono text-slate-900 tracking-tight bg-slate-50 p-3 rounded-lg border border-slate-100 truncate">{telemetry.wabaId || '192744882582782'}</code>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <span className="text-[7px] font-black text-slate-300 uppercase">PHONE_ID</span>
                        <code className="text-[10px] font-mono text-slate-900 tracking-tight bg-slate-50 p-3 rounded-lg border border-slate-100 truncate">{telemetry.phoneId || '106687442345511'}</code>
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
