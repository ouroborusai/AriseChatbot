'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Terminal, Search, Activity, ShieldCheck, Zap, Database } from 'lucide-react';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';

// ⚠️ TIPADO SSOT IMPORTADO DIRECTAMENTE DE LA BASE DE DATOS
import type { AuditLog } from '@/types/database';

/**
 *  TELEMETRY LOGS (Audit Flow) v12.0 (Diamond Resilience - Luminous Pure)
 *  Aislamiento Tenant Estricto y Tipado SSOT.
 */
export default function TelemetryLogsPage() {
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLive, setIsLive] = useState(true);

  // Extracción blindada del Tenant Activo
  const activeCompanyId = activeCompany?.id;

  const fetchLogs = async () => {
    if (!activeCompanyId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('company_id', activeCompanyId) // 🛡️ AISLAMIENTO TENANT OBLIGATORIO
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setLogs(data as AuditLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeCompanyId) {
      fetchLogs();
    }
  }, [activeCompanyId]);

  useEffect(() => {
    if (!isLive || !activeCompanyId) return;

    // 🛡️ Suscripción Realtime con Aislamiento Tenant RLS
    const channel = supabase.channel('audit_logs_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'audit_logs',
        filter: `company_id=eq.${activeCompanyId}`
      }, (payload) => {
        setLogs((prev) => [payload.new as AuditLog, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLive, activeCompanyId]);

  const filteredLogs = logs.filter(log => 
    (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.table_name && log.table_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.record_id && log.record_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col w-full max-w-full py-12 animate-in fade-in duration-700 overflow-x-hidden relative min-h-[calc(100vh-72px)] bg-slate-50">
      {/* Luminous Pure Background Glow */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#22c55e]/10 blur-[100px] rounded-full -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-[#22c55e]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="px-8 md:px-12 w-full max-w-[1600px] mx-auto flex flex-col h-full relative z-10">
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-8 mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-[#1a1a1a] tracking-tighter uppercase italic">
              Audit <span className="text-[#22c55e]">Flow.</span>
            </h1>
            <p className="text-[10px] md:text-[12px] font-black text-[#22c55e] uppercase tracking-[0.4em] mt-4 flex items-center gap-3 italic">
              <Terminal size={14} className="text-[#22c55e]" />
              TELEMETRY_SSOT_v12.0_DIAMOND
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#22c55e] transition-colors" size={16} />
              <input
                type="text"
                placeholder="BUSCAR_LOGS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-72 bg-white border border-slate-200 py-4 pl-14 pr-6 text-[10px] font-black text-[#1a1a1a] uppercase tracking-widest outline-none focus:border-[#22c55e]/50 focus:ring-4 focus:ring-[#22c55e]/10 transition-all italic shadow-sm"
                style={{ borderRadius: 40 }}
              />
            </div>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest italic transition-all shadow-sm border ${
                isLive
                  ? 'bg-[#22c55e] text-white border-[#22c55e]/20 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-[#22c55e]/30'
              }`}
              style={{ borderRadius: 40 }}
            >
              <div className="flex items-center gap-3">
                {isLive ? <Activity size={14} className="animate-pulse" /> : <Database size={14} />}
                <span className="hidden sm:inline">{isLive ? 'Live_Sync_ON' : 'Sync_Paused'}</span>
              </div>
            </button>
          </div>
        </header>

        {/* Master Log Container */}
        <div 
          className="flex-1 bg-white border border-slate-100 shadow-[0_4px_30px_-10px_rgba(34,197,94,0.15)] relative overflow-hidden" 
          style={{ borderRadius: 40 }}
        >
          <div className="overflow-x-auto h-[70vh] custom-scrollbar">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-xl z-20 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-80">Timestamp</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-80">Action_Trigger</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-80">Target_Entity</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-80">Payload_Data</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-right italic opacity-80">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 relative z-10">
                {loading || isContextLoading ? (
                  Array(8).fill(0).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td className="px-8 py-6"><div className="w-32 h-6 bg-slate-50 animate-pulse" style={{ borderRadius: 40 }} /></td>
                      <td className="px-8 py-6"><div className="w-48 h-6 bg-slate-50 animate-pulse" style={{ borderRadius: 40 }} /></td>
                      <td className="px-8 py-6"><div className="w-24 h-6 bg-slate-50 animate-pulse" style={{ borderRadius: 40 }} /></td>
                      <td className="px-8 py-6"><div className="w-full h-12 bg-slate-50 animate-pulse" style={{ borderRadius: 40 }} /></td>
                      <td className="px-8 py-6 text-right"><div className="w-16 h-6 bg-slate-50 animate-pulse ml-auto" style={{ borderRadius: 40 }} /></td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <Terminal size={48} className="text-slate-200 mx-auto mb-6 opacity-50" />
                      <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic">NO_TELEMETRY_FOUND</p>
                      <p className="text-[9px] font-black text-slate-300 mt-2 uppercase tracking-[0.4em] italic">Esperando eventos en tiempo real...</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                          {new Date(log.created_at).toLocaleString('es-ES', { 
                            day: '2-digit', month: 'short', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit', second: '2-digit' 
                          })}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-10 h-10 bg-[#22c55e]/10 text-[#22c55e] flex items-center justify-center border border-[#22c55e]/20 group-hover:scale-110 transition-transform shadow-inner" 
                            style={{ borderRadius: 40 }}
                          >
                            <Zap size={14} />
                          </div>
                          <span className="text-[11px] font-black text-[#1a1a1a] tracking-tight uppercase italic group-hover:text-[#22c55e] transition-colors">
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span 
                          className="inline-block px-4 py-2 bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-black uppercase tracking-[0.2em] italic shadow-sm" 
                          style={{ borderRadius: 40 }}
                        >
                          {log.table_name || 'SYSTEM_CORE'}
                        </span>
                      </td>
                      <td className="px-8 py-6 w-1/3">
                        <div 
                          className="max-w-md bg-[#1a1a1a] text-[#22c55e] p-4 font-mono text-[9px] overflow-x-auto shadow-inner border border-black/10" 
                          style={{ borderRadius: 24 }}
                        >
                          <pre className="tracking-widest">
                            {JSON.stringify(log.new_data || log.old_data || { status: 'NO_PAYLOAD' }, null, 2)}
                          </pre>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="inline-flex items-center gap-2 justify-end bg-slate-50 px-3 py-1.5 border border-slate-100" style={{ borderRadius: 40 }}>
                          <ShieldCheck size={12} className="text-[#22c55e]" />
                          <span className="text-[9px] font-black text-[#22c55e] uppercase tracking-[0.2em] italic">SECURE</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
