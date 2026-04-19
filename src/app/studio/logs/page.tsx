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
  Database
} from 'lucide-react';

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
          (payload) => {
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
    <div className="min-h-screen bg-[#020408] text-[#a0a0a0] p-6 font-mono selection:bg-[#6366f1]/30">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Top Telemetry Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-white/5 pb-8">
            <div className="flex items-center gap-6">
                <div className="relative">
                    <div className="absolute -inset-1 bg-[#6366f1]/20 rounded-full blur-sm animate-pulse" />
                    <Terminal className="text-[#6366f1] relative" size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white italic">Neural_Audit_Flow <span className="text-[#6366f1]">v7.1</span></h1>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Status: Operational // Source: Supabase_Live_Stream</p>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-6 md:mt-0">
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <Smartphone size={14} />
                    <input 
                      value={testPhone} 
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="bg-transparent outline-none text-xs font-bold text-white w-32"
                    />
                </div>
                <button 
                  onClick={() => setIsLive(!isLive)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isLive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/10'}`}
                >
                    <RefreshCcw size={12} className={isLive ? 'animate-spin' : ''} />
                    {isLive ? 'Live_Sync_ON' : 'Paused'}
                </button>
            </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
            {[
                { label: 'Telemetría AI', value: stats.total, icon: Database, color: 'text-blue-500' },
                { label: 'Interactive Rate', value: stats.interactive_rate, icon: Layers, color: 'text-[#a855f7]' },
                { label: 'Neural Health', value: 'Optimal', icon: Cpu, color: 'text-emerald-500' },
                { label: 'Test Target', value: 'Active', icon: Search, color: 'text-orange-500' }
            ].map((st, i) => (
                <div key={i} className="bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-3xl group hover:border-[#6366f1]/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <st.icon className={`${st.color} opacity-50 group-hover:opacity-100 transition-all`} size={18} />
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Idx_0{i+1}</span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">{st.label}</p>
                    <p className="text-2xl font-black italic text-white tracking-widest">{st.value}</p>
                </div>
            ))}
        </div>

        {/* Console / Log Terminal */}
        <div className="bg-white/5 rounded-[40px] border border-white/10 overflow-hidden backdrop-blur-3xl">
            <div className="bg-white/5 p-6 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    <span className="text-[10px] font-black uppercase tracking-widest ml-4 text-slate-500">Live_Response_Console</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                    <Play size={10} className="text-emerald-500" /> STREAMING_ACTIVE
                </div>
            </div>

            <div className="p-8 space-y-8 max-h-[600px] overflow-y-auto scrollbar-hide">
                {messages.map((msg, idx) => (
                    <div key={msg.id} className={`flex gap-6 animate-in slide-in-from-left-4 duration-300 delay-${idx*50}`}>
                        <div className="flex-shrink-0 mt-1">
                            {msg.sender_type === 'user' ? (
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                    <MessageSquare size={16} className="text-slate-400" />
                                </div>
                            ) : (
                                <div className="p-3 bg-[#6366f1]/20 rounded-2xl border border-[#6366f1]/30">
                                    <Cpu size={16} className="text-[#6366f1]" />
                                </div>
                            )}
                        </div>
                        <div className="flex-grow space-y-3">
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${msg.sender_type === 'user' ? 'text-white' : 'text-[#6366f1]'}`}>
                                    {msg.sender_type === 'user' ? 'Client_Input' : 'Neural_Response'}
                                </span>
                                <span className="text-[9px] text-slate-700">{new Date(msg.created_at).toLocaleTimeString()}</span>
                            </div>
                            
                            <div className={`p-6 rounded-3xl border text-sm leading-relaxed ${msg.sender_type === 'user' ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-[#6366f1]/5 border-[#6366f1]/10 text-white font-medium'}`}>
                                {msg.content}
                                
                                {msg.metadata?.interactive_buttons?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                                        {msg.metadata.interactive_buttons.map((btn: string, bi: number) => (
                                            <span key={bi} className="px-3 py-1 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg text-[9px] font-black text-[#6366f1] uppercase tracking-tighter">
                                                🔘 {btn}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {msg.sender_type === 'bot' && (
                                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                                    <button className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 uppercase hover:bg-emerald-500/10 px-3 py-1 rounded-full transition-all">
                                        <CheckCircle size={10} /> Validar
                                    </button>
                                    <button className="flex items-center gap-2 text-[9px] font-bold text-red-500 uppercase hover:bg-red-500/10 px-3 py-1 rounded-full transition-all">
                                        <AlertTriangle size={10} /> Refinar Prompt
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white/5 p-6 border-t border-white/10 flex justify-between items-center">
                <p className="text-[9px] font-bold text-slate-700 italic">Connected_to_Supabase_Cluster_Production // AES-256-GCM_Active</p>
                <div className="flex items-center gap-2 text-[#6366f1] text-[10px] font-black uppercase tracking-widest cursor-pointer hover:underline">
                    Ver Documentación SSOT <ChevronRight size={12} />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
