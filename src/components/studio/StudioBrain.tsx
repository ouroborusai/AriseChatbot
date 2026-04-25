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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="lg:col-span-3 space-y-6">
        <section className="bg-white border border-slate-100 shadow-sm overflow-hidden rounded-2xl relative">
          <div className="bg-slate-50/50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">
                <Terminal size={12} className="text-[#22c55e]" />
                Master Instruction (Cognitive DNA)
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
               <span className="text-[7px] font-black text-[#22c55e] uppercase tracking-widest">Core_Active</span>
            </div>
          </div>
          <div className="relative group">
            <textarea 
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-[400px] md:h-[600px] px-6 py-6 text-slate-700 text-[12px] font-mono leading-relaxed outline-none resize-none bg-transparent selection:bg-[#22c55e]/10 scrollbar-hide"
              placeholder="IDENTITY_PROTOCOL_v10.0..."
            />
          </div>
          <div className="px-6 py-4 bg-slate-50/50 flex justify-between items-center border-t border-slate-100">
            <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest hidden sm:block">
               * PROTOCOLO DE IDENTIDAD NEURAL / LOOP OS
            </p>
            <button 
              onClick={onSave}
              disabled={saving}
              className="bg-slate-900 text-white px-6 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg hover:bg-[#22c55e] transition-all active:scale-95 disabled:opacity-20"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Synchronize DNA
            </button>
          </div>
        </section>
      </div>

      <aside className="space-y-6 sticky top-6">
        {/* ENGINEERING VAULT */}
        <div className="bg-white border border-slate-100 p-6 shadow-sm rounded-2xl relative overflow-hidden group">
          <h3 className="text-[9px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-3 text-slate-900">
            <ShieldCheck size={14} className="text-[#22c55e]" />
            Engineering Vault
          </h3>
          <div className="space-y-6 relative z-10">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:border-[#22c55e]/20 transition-all">
              <p className="text-[7px] font-black text-[#22c55e] uppercase mb-2 tracking-widest">Context Variables</p>
              <div className="flex flex-col gap-2">
                 <code className="text-[9px] font-mono text-slate-500 leading-none bg-white px-2 py-1.5 rounded border border-slate-100">{`{client_context}`}</code>
                 <code className="text-[9px] font-mono text-slate-500 leading-none bg-white px-2 py-1.5 rounded border border-slate-100">{`{operational_params}`}</code>
              </div>
            </div>
            
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
               <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest leading-relaxed">
                  * LOS CAMBIOS AFECTAN TODAS LAS RESPUESTAS DEL NODO ACTIVO.
               </p>
            </div>
          </div>
        </div >

        {/* NEURAL PULSE */}
        <div className="bg-slate-900 p-6 shadow-xl rounded-2xl relative overflow-hidden group text-white">
          <h3 className="text-[9px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-3 italic">
            <Activity size={14} className="text-emerald-400" />
            Neural Pulse
          </h3>
          <div className="space-y-6 relative z-10">
            <div>
              <div className="flex justify-between items-end mb-3">
                 <div>
                    <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-1">Load Factor</p>
                    <p className="text-2xl font-black text-white tracking-tighter italic">{(telemetry.tokens / 1000).toFixed(1)}<span className="text-white/20 text-xs ml-0.5">K</span></p>
                 </div>
                 <div className="text-right">
                    <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-1">Health</p>
                    <p className="text-lg font-black text-[#22c55e] tracking-tighter">98.2%</p>
                 </div>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="w-[85%] h-full bg-[#22c55e] shadow-[0_0_10px_#22c55e/30]" />
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-white/30">
               <Cpu size={14} />
               <span className="text-[7px] font-black uppercase tracking-widest">Engine_Safe_State</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
