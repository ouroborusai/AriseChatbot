'use client';

import React from 'react';
import { useServiceRequests } from '@/lib/hooks/useServiceRequests';

export default function RequestsPage() {
  const { requests, loading, updateStatus, refetch } = useServiceRequests();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const isUrgent = (createdAt: string) => {
    const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return hours > 24;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-700">
      {/* Header Industrial Adaptable */}
      <header className="shrink-0 bg-white border-b border-slate-100 px-4 py-5 md:px-8 md:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50/50 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            Tickets de <span className="text-amber-600">Servicio</span>
          </h1>
          <p className="text-[11px] md:text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Cola de prioridad operacional</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-2 text-[10px] md:text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white px-5 md:px-6 h-10 md:h-12 rounded-2xl transition-all font-black uppercase tracking-widest shadow-xl active:scale-95 shadow-slate-200"
        >
          🔄 Sincronizar
        </button>
      </header>

      {/* Contenido principal con scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <div className="h-12 w-12 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin mb-6 shadow-xl shadow-amber-50"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Analizando cola de atención...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* VISTA PARA MOBILE: Lista de Tickets en Tarjetas */}
              <div className="md:hidden space-y-4">
                <div className="flex items-center justify-between px-2 mb-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cola Activa</h3>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span className="text-[8px] font-bold text-slate-400 uppercase">Wait</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span><span className="text-[8px] font-bold text-slate-400 uppercase">Prior</span></span>
                  </div>
                </div>

                {requests.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 italic font-medium text-slate-400">
                    <p className="text-4xl mb-3">🏜️</p>
                    <p className="text-xs font-bold uppercase tracking-widest">Sin solicitudes pendientes</p>
                  </div>
                ) : (
                  requests.map((req) => {
                    const urgent = req.status === 'pending' && isUrgent(req.created_at);
                    return (
                      <div key={req.id} className={`bg-white rounded-[2rem] p-5 shadow-sm border ${urgent ? 'border-red-100 ring-2 ring-red-50' : 'border-slate-100'} transition-all active:scale-[0.98]`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="text-[12px] font-mono font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                            #{req.request_code}
                          </div>
                          <span className={`inline-flex px-3 py-1 rounded-xl text-[9px] font-black tracking-widest border shadow-sm uppercase ${getStatusStyle(req.status)}`}>
                             {req.status || 'PENDIENTE'}
                          </span>
                        </div>

                        <div className="mb-5">
                          <p className="text-sm font-black text-slate-900 leading-relaxed mb-3 line-clamp-3">
                            {req.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100">
                              {req.request_type}
                            </span>
                            {urgent && <span className="text-[9px] font-black uppercase bg-red-500 text-white px-2 py-1 rounded-md animate-pulse">URGENTE</span>}
                          </div>
                          
                          <div className="flex items-center gap-3 py-3 border-t border-slate-50">
                             <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 font-black text-xs">
                               {req.contacts?.name ? req.contacts.name[0].toUpperCase() : 'C'}
                             </div>
                             <div className="min-w-0 flex-1">
                               <p className="text-sm font-black text-slate-900 truncate tracking-tight">{req.contacts?.name || 'Cliente S/N'}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{req.companies?.legal_name || 'Individual'}</p>
                             </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                           {req.status === 'pending' && (
                             <button onClick={() => updateStatus(req.id, 'resolved')} className="flex-1 h-12 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100">Resolver Ticket</button>
                           )}
                           <a href={`/dashboard?phone=${req.contacts?.phone_number}`} className="flex-1 h-12 bg-white border border-slate-200 text-slate-700 rounded-2xl flex items-center justify-center text-xl shadow-sm">💬</a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* VISTA PARA DESKTOP: Tabla Master */}
              <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden transition-all duration-300">
                <div className="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-lg">📋</span>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] border-l border-slate-200 pl-4">Cola de Atención Master</h3>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Espera</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-red-500">Prioridad Crítica</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="px-8 py-5">Control / ID</th>
                        <th className="px-8 py-5">Requerimiento</th>
                        <th className="px-8 py-5">Identificación Origen</th>
                        <th className="px-8 py-5">Estado</th>
                        <th className="px-8 py-5 text-right">Ejecución</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-24 text-center bg-white">
                            <div className="text-5xl mb-6 grayscale opacity-20">🏜️</div>
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[11px]">Sistema libre de tickets pendientes</p>
                          </td>
                        </tr>
                      ) : (
                        requests.map((req) => {
                          const urgent = req.status === 'pending' && isUrgent(req.created_at);
                          return (
                            <tr key={req.id} className={`hover:bg-slate-50/50 transition-all group ${urgent ? 'bg-red-50/20' : ''}`}>
                              <td className="px-8 py-8 whitespace-nowrap">
                                <div className="flex items-center gap-5">
                                  <div className={`w-1.5 h-12 rounded-full ${urgent ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-slate-100'}`} />
                                  <div>
                                    <div className="text-[12px] font-mono font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm leading-none inline-block">
                                      #{req.request_code}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">
                                      {new Date(req.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-8">
                                <div className="max-w-[450px]">
                                  <div className="text-sm text-slate-800 font-black leading-relaxed mb-2 line-clamp-2" title={req.description}>
                                    {req.description}
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg border border-indigo-100 tracking-[0.1em]">
                                      {req.request_type}
                                    </span>
                                    {urgent && (
                                      <span className="text-[9px] font-black uppercase bg-rose-500 text-white px-3 py-1 rounded-lg shadow-lg shadow-rose-200 animate-pulse tracking-[0.1em]">
                                        Acción Inmediata
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-8">
                                <div className="text-sm font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{req.contacts?.name || 'Cliente Externo'}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 truncate max-w-[200px]" title={req.companies?.legal_name}>
                                  🏢 {req.companies?.legal_name || 'Individual / S.E'}
                                </div>
                              </td>
                              <td className="px-8 py-8">
                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black border tracking-widest shadow-sm uppercase ${getStatusStyle(req.status)}`}>
                                  {req.status || 'PENDIENTE'}
                                </span>
                              </td>
                              <td className="px-8 py-8 text-right">
                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                  {req.status === 'pending' && (
                                    <button 
                                      onClick={() => updateStatus(req.id, 'resolved')}
                                      className="h-10 px-6 bg-slate-900 hover:bg-emerald-600 text-white text-[10px] font-black rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-widest"
                                    >
                                      Finalizar
                                    </button>
                                  )}
                                  <a 
                                    href={`/dashboard?phone=${req.contacts?.phone_number}`} 
                                    className="h-10 w-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm active:scale-90"
                                    title="Consultar Historial"
                                  >
                                    💬
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
