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
    <section className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* VITALITY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-8 shadow-sm rounded-xl relative overflow-hidden group">
           <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Vitalidad IA</p>
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
           </div>
           <h2 className="text-4xl font-black text-neural-dark tracking-tighter">{apiKeys.length}<span className="text-slate-200 text-2xl mx-2">/</span>{apiKeys.length}</h2>
           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-6 flex items-center gap-3">
              <Server size={14} className="text-primary" />
              Nodos Neurales Activos
           </p>
        </div>
        
        <div className="bg-white border border-slate-100 p-8 shadow-sm rounded-xl relative overflow-hidden group">
           <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Puente Meta</p>
              <Zap size={18} className="text-primary" />
           </div>
           <h2 className="text-2xl font-black text-neural-dark tracking-tighter uppercase italic">CONECTADO</h2>
           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-8 flex items-center gap-3">
              <Activity size={14} className="text-accent" />
              Infraestructura Operativa
           </p>
        </div>

        <div className="bg-accent border border-slate-800 p-8 shadow-2xl rounded-xl relative overflow-hidden group text-white">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
           <div className="flex items-center justify-between mb-8 relative z-10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Latencia MS</p>
              <Cpu size={18} className="text-white/20" />
           </div>
           <h2 className="text-4xl font-black text-white tracking-tighter relative z-10">{telemetry.latency}</h2>
           <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-6 flex items-center gap-3 relative z-10">
              <Zap size={14} className="text-primary" />
              Ritmo de Respuesta v10.4
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* API NODES MONITOR */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-[12px] font-black uppercase text-neural-dark tracking-tighter flex items-center gap-4">
              <Database size={18} className="text-primary" />
              Estado de los Nodos Gemini-2.5
            </h3>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-md border border-slate-100">Round-Robin v10.4</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {apiKeys.map((k, index) => {
              const result = keyResults[k.id];
              return (
                <div key={k.id} className="bg-white border border-slate-100 p-6 flex items-center justify-between group hover:border-primary/30 transition-all rounded-xl shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-slate-50 group-hover:bg-primary transition-colors" />
                  <div className="flex items-center gap-8">
                    <div className="w-12 h-12 bg-slate-50 rounded-md flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all border border-slate-100 group-hover:border-transparent">
                      <Cpu size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-4">
                        <p className="text-[10px] font-black text-neural-dark uppercase tracking-[0.2em]">NODO_{String(index + 1).padStart(2, '0')}</p>
                        {result?.status === 'ok' ? (
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest border border-primary/10">OPERATIVO</span>
                        ) : result?.status === 'error' ? (
                          <span className="bg-red-50 text-red-500 px-3 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest border border-red-100">AGOTADO</span>
                        ) : (
                          <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest border border-slate-100">STANDBY</span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-2 tracking-tighter opacity-60 italic">{k.key_value?.substring(0, 32) || 'NULL_NODE_POINTER'}...</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {result?.latency && (
                      <div className="text-right">
                        <p className="text-xl font-black text-primary tracking-tighter">{result.latency}ms</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">LATENCIA</p>
                      </div>
                    )}
                    <button 
                      onClick={() => onTestKey(k.id, k.key_value)}
                      disabled={result?.status === 'testing'}
                      className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary rounded-md transition-all shadow-sm hover:shadow-md active:scale-90 disabled:opacity-20 group"
                    >
                      {result?.status === 'testing' ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* META HEALTH CARD */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-100 p-10 shadow-sm rounded-xl relative overflow-hidden group">
             <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-neural-dark mb-10 flex items-center gap-4">
                <ShieldCheck size={20} className="text-primary" />
                Salud de Infra
             </h3>
             
             <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-center bg-slate-50 p-5 rounded-md border border-slate-100 group hover:border-primary/20 transition-all">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Token Auth</span>
                  <span className="text-[10px] font-black text-primary tracking-widest italic">VÁLIDO_OK</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-50 p-5 rounded-md border border-slate-100 group hover:border-primary/20 transition-all">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WABA Webhook</span>
                  <span className="text-[10px] font-black text-primary animate-pulse tracking-widest italic">ACTIVO_SYNC</span>
                </div>
                
                <div className="pt-8 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-300 uppercase mb-8 tracking-widest">Meta Data Registry</p>
                  <div className="space-y-6">
                     <div className="flex flex-col gap-2">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">WABA_ID_CORE</span>
                        <code className="text-[11px] font-mono text-neural-dark tracking-tighter bg-slate-50 p-4 rounded-md border border-slate-100 truncate shadow-inner">{telemetry.wabaId || '192744882582782'}</code>
                     </div>
                     <div className="flex flex-col gap-2">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">PHONE_ID_NODE</span>
                        <code className="text-[11px] font-mono text-neural-dark tracking-tighter bg-slate-50 p-4 rounded-md border border-slate-100 truncate shadow-inner">{telemetry.phoneId || '106687442345511'}</code>
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
