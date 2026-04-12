'use client';

import React from 'react';
import { useServiceRequests } from '@/lib/hooks/useServiceRequests';

export default function RequestsPage() {
  const { requests, loading, updateStatus, refetch } = useServiceRequests();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header Compacto */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            📋 Gestión de Solicitudes
          </h1>
          <p className="text-xs text-slate-500">Tickets generados por el chatbot y solicitudes de clientes</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 font-medium"
        >
          🔄 Actualizar
        </button>
      </header>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400 animate-pulse font-medium">
            Cargando solicitudes...
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-32">Código / Fecha</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Detalle del Pedido</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cliente / Empresa</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24">Estado</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-32 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No hay solicitudes pendientes.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-[12px] font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                          {req.request_code}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 font-medium">
                          {new Date(req.created_at).toLocaleDateString('es-CL')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] text-slate-800 font-medium line-clamp-2" title={req.description}>
                          {req.description}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                          Tipo: {req.request_type}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-semibold text-slate-700">{req.contacts?.name || 'Usuario'}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]" title={req.companies?.legal_name}>
                          🏢 {req.companies?.legal_name || 'Individual'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(req.status)}`}>
                          {req.status?.toUpperCase() || 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {req.status === 'pending' && (
                          <button 
                            onClick={() => updateStatus(req.id, 'resolved')}
                            className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-transform active:scale-95"
                          >
                            Resolver
                          </button>
                        )}
                      </td>
                    </tr>
                   ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
