'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Terminal, 
  Search, 
  MessageSquare, 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle,
  Play,
  Cpu,
  Smartphone,
  Layers,
  ChevronRight,
  Database,
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Image from 'next/image';

export default function NeuralLogPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [testPhone, setTestPhone] = useState('56990062213');
  const [isLive, setIsLive] = useState(true);
  const [stats, setStats] = useState({ total: 0, errors: 0, interactive_rate: '0%' });

  useEffect(() => {
    fetchLogs();
    if (isLive) {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          () => {
            fetchLogs();
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isLive, testPhone]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('messages')
      .select(`
        id, 
        content, 
        sender_type, 
        created_at, 
        metadata,
        conversations!inner (
          contact_id,
          contacts!inner (phone, full_name)
        )
      `)
      .eq('conversations.contacts.phone', testPhone)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) {
      setMessages(data);
      const total = data.length;
      const interactive = data.filter(m => m.sender_type === 'bot' && m.metadata?.interactive_buttons?.length > 0).length;
      const rate = total > 0 ? (interactive / (total / 2) * 100).toFixed(0) + '%' : '0%';
      setStats({ total, errors: 0, interactive_rate: rate });
    }
  };

  return (
    <div className="flex flex-col w-full max-w-full py-6 md:py-12 animate-in fade-in duration-700 overflow-x-hidden relative min-h-screen bg-[#020617]">
      
      {/* PREMIUM BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-green-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-[1600px] mx-auto w-full px-4 lg:px-10">
        
        {/* HEADER SECTION - DIAMOND v10.0 */}
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 mb-16 relative z-10">
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]" />
               <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Telemetría en Tiempo Real</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic uppercase">
              Audit <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-500">Flow</span>
            </h1>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-5 flex items-center gap-3">
              <Terminal size={12} className="text-green-500" />
              SISTEMA DE AUDITORÍA NEURAL / v2.5
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-white/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 z-20" size={16} />
              <input 
                type="text" 
                value={testPhone} 
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Frecuencia_Tel..." 
                className="w-full lg:w-64 pl-14 pr-6 py-4.5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white rounded-[24px] outline-none border border-white/10 focus:border-green-500/30 focus:bg-white/10 transition-all relative z-10"
              />
            </div>
            
            <button 
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center justify-center gap-4 px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 border ${isLive ? 'bg-green-500 text-slate-900 border-transparent shadow-[0_0_30px_#22c55e33]' : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-white'}`}
            >
              <RefreshCcw size={16} className={isLive ? 'animate-spin' : ''} />
              <span>{isLive ? 'Live_Sync_ON' : 'Streaming_Paused'}</span>
            </button>
          </div>
        </header>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
            {[
                { label: 'Telemetría IA', value: stats.total, icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                { label: 'Interactive Rate', value: stats.interactive_rate, icon: Layers, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                { label: 'Neural Health', value: 'Optimal', icon: Cpu, color: 'text-green-500', bg: 'bg-green-500/5' },
                { label: 'Latency Pulse', value: 'Active', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/5' }
            ].map((st, i) => (
                <div key={i} className={`loop-card p-8 bg-white/5 border-white/5 backdrop-blur-3xl group hover:border-white/10 hover:bg-white/[0.08] transition-all rounded-[32px] shadow-2xl relative overflow-hidden`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 ${st.bg}`} />
                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <st.icon className={`${st.color} transition-all`} size={20} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-700">Idx_0{i+1}</span>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2 text-slate-500">{st.label}</p>
                    <p className="text-3xl font-black italic text-white tracking-tighter">{st.value}</p>
                </div>
            ))}
        </div>

        {/* CONSOLE TERMINAL */}
        <div className="loop-card bg-white/5 rounded-[48px] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl relative z-10">
            <div className="bg-white/5 px-10 py-8 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-5">
                    <div className="flex gap-2.5">
                       <div className="w-3.5 h-3.5 rounded-full bg-red-500/20 border border-red-500/30" />
                       <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                       <div className="w-3.5 h-3.5 rounded-full bg-green-500/20 border border-green-500/30" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.6em] ml-6 text-slate-500 italic">Live_Response_Console</span>
                </div>
                <div className="flex items-center gap-4 text-[9px] font-black text-green-500 tracking-widest uppercase">
                    <Play size={14} className="fill-green-500 animate-pulse" /> 
                    <span className="hidden sm:inline">Streaming_Production_v2.5</span>
                </div>
            </div>

            <div className="p-10 lg:p-16 space-y-12 max-h-[800px] overflow-y-auto scrollbar-hide">
                {messages.length === 0 ? (
                  <div className="py-40 text-center">
                     <Zap size={64} className="mx-auto text-slate-800 mb-8 opacity-20 animate-pulse" />
                     <p className="text-[11px] font-black text-slate-600 uppercase tracking-[1em]">Esperando enlace neuronal...</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                      <div key={msg.id} className={`flex gap-10 animate-in slide-in-from-left-6 duration-700`}>
                          <div className="flex-shrink-0 mt-2">
                              {msg.sender_type === 'user' ? (
                                  <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-slate-600">
                                      <MessageSquare size={20} />
                                  </div>
                              ) : (
                                  <div className="w-14 h-14 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center justify-center text-green-500 shadow-[0_0_20px_#22c55e33]">
                                      <Cpu size={20} />
                                  </div>
                              )}
                          </div>
                          <div className="flex-grow space-y-5">
                              <div className="flex items-center gap-6">
                                  <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${msg.sender_type === 'user' ? 'text-white' : 'text-green-500'}`}>
                                      {msg.sender_type === 'user' ? 'Protocol_Input' : 'Neural_Response'}
                                  </span>
                                  <span className="text-[10px] text-slate-700 font-mono tracking-widest uppercase">{new Date(msg.created_at).toLocaleTimeString()}</span>
                              </div>
                              
                              <div className={`p-8 lg:p-10 rounded-[40px] border text-sm leading-relaxed transition-all hover:bg-white/[0.02] shadow-2xl ${msg.sender_type === 'user' ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-green-500/5 border-green-500/10 text-white font-medium'}`}>
                                  <p className="whitespace-pre-wrap tracking-tight leading-loose">{msg.content}</p>
                                  
                                  {msg.metadata?.interactive_buttons?.length > 0 && (
                                      <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-3">
                                          {msg.metadata.interactive_buttons.map((btn: string, bi: number) => (
                                              <span key={bi} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-green-500 hover:text-slate-900 transition-all cursor-default">
                                                  🔘 {btn}
                                              </span>
                                          ))}
                                      </div>
                                  )}
                              </div>

                              {msg.sender_type === 'bot' && (
                                  <div className="flex items-center gap-10 mt-2 px-4">
                                      <button className="flex items-center gap-3 text-[9px] font-black text-green-500 uppercase hover:bg-green-500/10 px-5 py-2 rounded-xl transition-all tracking-widest border border-green-500/10">
                                          <CheckCircle size={12} /> Validar Nodo
                                      </button>
                                      <button className="flex items-center gap-3 text-[9px] font-black text-red-500 uppercase hover:bg-red-500/10 px-5 py-2 rounded-xl transition-all tracking-widest border border-red-500/10">
                                          <AlertTriangle size={12} /> Refinar Prompt
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))
                )}
            </div>

            <div className="bg-white/5 px-10 py-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 text-slate-700">
                   <ShieldCheck size={16} />
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] italic leading-none">CONNECTED_TO_SUPABASE_CLUSTER_v2.5 // AES-256-GCM_STABLE</p>
                </div>
                <div className="flex items-center gap-4 text-green-500 text-[10px] font-black uppercase tracking-[0.4em] cursor-pointer hover:text-white transition-all group">
                    <span>Ver Documentación Neural SSOT</span>
                    <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
