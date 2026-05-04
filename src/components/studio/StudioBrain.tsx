import React from 'react';
import { Terminal, RefreshCw, Activity, Zap, Sparkles, ShieldCheck, Cpu } from 'lucide-react';

interface StudioBrainProps {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  saving: boolean;
  onSave: () => void;
  telemetry: Telemetry;
}

interface Telemetry {
  tokens: number;
  cost: number;
  latency: number;
}

export function StudioBrain({ systemPrompt, setSystemPrompt, saving, onSave, telemetry }: StudioBrainProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="lg:col-span-3 space-y-8">
        <section className="bg-white border border-slate-100 shadow-sm overflow-hidden rounded-xl relative">
          <div className="bg-slate-50/50 px-8 py-6 flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                <Terminal size={14} className="text-primary" />
                Master Instruction (Cognitive DNA)
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
               <span className="text-[8px] font-black text-primary uppercase tracking-widest">Core_Active</span>
            </div>
          </div>
          <div className="relative group">
            <textarea 
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-[400px] md:h-[600px] px-8 py-8 text-neural-dark text-[13px] font-mono leading-relaxed outline-none resize-none bg-transparent selection:bg-primary/10 scrollbar-hide"
              placeholder="IDENTITY_PROTOCOL_v12.0_DIAMOND..."
            />
          </div>
          <div className="px-8 py-6 bg-slate-50/50 flex justify-between items-center border-t border-slate-100">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest hidden sm:block">
               * PROTOCOLO DE IDENTIDAD NEURAL / ARISE OS v12.0
            </p>
            <button 
              onClick={onSave}
              disabled={saving}
              className="bg-accent text-white px-8 py-4 rounded-sm text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-xl hover:bg-primary transition-all active:scale-95 disabled:opacity-20 group"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} className="group-hover:fill-current" />}
              <span>Sincronizar ADN</span>
            </button>
          </div>
        </section>
      </div>

      <aside className="space-y-8 sticky top-8">
        {/* ENGINEERING VAULT */}
        <div className="bg-white border border-slate-100 p-8 shadow-sm rounded-xl relative overflow-hidden group">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-4 text-neural-dark">
            <ShieldCheck size={16} className="text-primary" />
            Engineering Vault
          </h3>
          <div className="space-y-8 relative z-10">
            <div className="bg-slate-50 p-6 rounded-md border border-slate-100 group-hover:border-primary/20 transition-all">
              <p className="text-[8px] font-black text-primary uppercase mb-3 tracking-widest">Context Variables</p>
              <div className="flex flex-col gap-3">
                 <code className="text-[10px] font-mono text-slate-400 leading-none bg-white px-3 py-2 rounded-sm border border-slate-100">{`{client_context}`}</code>
                 <code className="text-[10px] font-mono text-slate-400 leading-none bg-white px-3 py-2 rounded-sm border border-slate-100">{`{operational_params}`}</code>
              </div>
            </div>
            
            <div className="p-6 bg-primary/5 rounded-md border border-primary/10">
               <p className="text-[8px] font-black text-primary uppercase tracking-widest leading-relaxed">
                  * LOS CAMBIOS AFECTAN TODAS LAS RESPUESTAS DEL NODO ACTIVO EN TIEMPO REAL.
               </p>
            </div>
          </div>
        </div >

        {/* NEURAL PULSE */}
        <div className="bg-accent p-8 shadow-2xl rounded-xl relative overflow-hidden group text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 flex items-center gap-4 italic relative z-10">
            <Activity size={18} className="text-primary" />
            Neural Pulse
          </h3>
          <div className="space-y-8 relative z-10">
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">Load Factor</p>
                  <p className="text-3xl font-black text-white tracking-tighter italic">{(telemetry.tokens / 1000).toFixed(1)}<span className="text-white/20 text-xs ml-0.5 uppercase tracking-normal font-mono">K_Tokens</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">Health</p>
                  <p className="text-xl font-black text-primary tracking-tighter">98.2%</p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div className="h-full bg-primary shadow-[0_0_15px_rgba(34,197,94,0.4)] rounded-full animate-pulse" style={{ width: '85%' }} />
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-white/20">
               <Cpu size={16} />
               <span className="text-[8px] font-black uppercase tracking-widest">Engine_Safe_State: TRUE</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
