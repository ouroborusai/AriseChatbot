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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="lg:col-span-3 space-y-10">
        <section className="loop-card p-0 overflow-hidden bg-white/5 border-white/5 shadow-2xl rounded-[40px]">
          <div className="bg-white/5 px-8 md:px-12 py-6 md:py-8 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                <Terminal size={14} className="text-green-500" />
                Master Instruction (Cognitive DNA)
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
               <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Core_Active</span>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <textarea 
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-[400px] md:h-[700px] px-8 md:px-12 py-8 md:py-12 text-slate-200 text-[14px] font-mono leading-loose outline-none resize-none bg-transparent selection:bg-green-500/20 scrollbar-hide"
              placeholder="IDENTITY_PROTOCOL_v10.0..."
            />
          </div>
          <div className="px-8 md:px-12 py-8 md:py-10 bg-white/5 flex justify-between items-center border-t border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] hidden sm:block italic">
               * PROTOCOLO DE IDENTIDAD NEURAL / LOOP OS
            </p>
            <button 
              onClick={onSave}
              disabled={saving}
              className="bg-white text-slate-900 px-10 md:px-14 py-4 md:py-5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:bg-green-500 hover:text-white transition-all active:scale-95 disabled:opacity-20"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Synchronize DNA
            </button>
          </div>
        </section>
      </div>

      <aside className="space-y-8 sticky top-10">
        {/* ENGINEERING VAULT */}
        <div className="loop-card p-10 bg-white/5 border-white/10 shadow-2xl backdrop-blur-3xl rounded-[40px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 flex items-center gap-3 text-white italic">
            <ShieldCheck size={14} className="text-green-500" />
            Engineering Vault
          </h3>
          <div className="space-y-8 relative z-10">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 group-hover:border-green-500/20 transition-all">
              <p className="text-[8px] font-black text-green-500 uppercase mb-3 tracking-[0.3em]">Context Variables</p>
              <div className="flex flex-col gap-3">
                 <code className="text-[10px] font-mono text-slate-400 leading-relaxed bg-black/40 px-3 py-1.5 rounded-lg">{`{client_context}`}</code>
                 <code className="text-[10px] font-mono text-slate-400 leading-relaxed bg-black/40 px-3 py-1.5 rounded-lg">{`{operational_params}`}</code>
              </div>
            </div>
            
            <div className="p-6 bg-green-500/5 rounded-2xl border border-green-500/10">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-loose">
                  * LOS CAMBIOS EN EL ADN COGNITIVO AFECTAN TODAS LAS RESPUESTAS DEL NODO ACTIVO.
               </p>
            </div>
          </div>
        </div >

        {/* NEURAL PULSE */}
        <div className="loop-card p-10 bg-[#020617] border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden group">
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none" />
          
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white mb-10 flex items-center gap-3 italic">
            <Activity size={14} className="text-blue-500" />
            Neural Pulse
          </h3>
          <div className="space-y-10 relative z-10">
            <div>
              <div className="flex justify-between items-end mb-4">
                 <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">Load Factor</p>
                    <p className="text-4xl font-black text-white tracking-tighter italic">{(telemetry.tokens / 1000).toFixed(1)}<span className="text-slate-700 text-lg ml-1">K</span></p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">Health</p>
                    <p className="text-xl font-black text-green-500 tracking-tighter">98.2%</p>
                 </div>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="w-[85%] h-full bg-gradient-to-r from-green-500 to-blue-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-slate-600">
               <Cpu size={16} />
               <span className="text-[8px] font-black uppercase tracking-[0.4em]">Engine_Safe_State</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
