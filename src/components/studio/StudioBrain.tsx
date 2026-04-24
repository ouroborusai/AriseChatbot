import React from 'react';
import { Terminal, RefreshCw, Activity, Zap, Sparkles } from 'lucide-react';

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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="lg:col-span-3 space-y-10">
        <section className="loop-card p-0 overflow-hidden bg-white border-none shadow-arise">
          <div className="bg-slate-100 px-6 md:px-8 py-4 md:py-6 flex justify-between items-center">
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                <Terminal size={12} className="text-primary fill-primary/20" />
                Master Instruction (Cognitive DNA)
            </div>
          </div>
          <div className="relative">
            <textarea 
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-[350px] md:h-[600px] px-6 md:px-10 py-6 md:py-10 text-slate-800 text-[13px] font-mono leading-loose outline-none resize-none bg-white"
              placeholder="IDENTITY_PROTOCOL_v9.0..."
            />
          </div>
          <div className="px-6 md:px-10 py-6 md:py-8 bg-slate-100 flex justify-end">
            <button 
              onClick={onSave}
              disabled={saving}
              className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-6 md:px-10 py-3 md:py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Synchronize Neural DNA
            </button>
          </div>
        </section>
      </div>
      <aside className="space-y-6 sticky top-10">
        <div className="loop-card p-8 bg-black/90 text-white border-none shadow-2xl backdrop-blur-xl rounded-[32px]">
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3 text-primary">
            <Zap size={12} className="fill-primary" />
            Engineering Vault
          </h3>
          <div className="space-y-6">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-primary uppercase mb-2 tracking-widest">Global Variables</p>
              <code className="text-[10px] font-mono text-slate-400 break-all leading-relaxed">{`{client_context}, {operational_params}`}</code>
            </div>
          </div>
        </div>
        <div className="loop-card p-8 bg-white border-none shadow-arise rounded-[32px]">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 mb-8 flex items-center gap-3">
            <Activity size={12} className="text-primary" />
            Neural Pulse
          </h3>
          <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Load Factor</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{(telemetry.tokens / 1000).toFixed(1)}K</p>
                </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-gradient-to-r from-primary to-accent animate-pulse shadow-[0_0_10px_rgba(0,69,189,0.3)]" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
