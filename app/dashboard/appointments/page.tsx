'use client';

import React from 'react';
import { useAppointments } from '@/lib/hooks/useAppointments';

export default function AppointmentsPage() {
  const { appointments, loading, updateStatus, deleteAppointment, refetch } = useAppointments();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header Compacto */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            📅 Agenda de Citas
          </h1>
          <p className="text-xs text-slate-500">Gestión de reuniones agendadas por el chatbot</p>
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
            Cargando agenda...
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-32">Fecha y Hora</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cliente / Contacto</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-28">Estado</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-40 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No hay citas agendadas aún.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-[13px] font-bold text-slate-900">{new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{appt.appointment_time.substring(0, 5)} hrs</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-semibold text-slate-800">{appt.contacts?.name || 'Cargando...'}</div>
                        <div className="text-[11px] text-slate-500 font-mono tracking-tight">{appt.contacts?.phone_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12px] text-slate-600 truncate max-w-[200px]" title={appt.companies?.legal_name}>
                          {appt.companies?.legal_name || 'Individual'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(appt.status)}`}>
                          {appt.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {appt.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateStatus(appt.id, 'confirmed')}
                              className="text-[10px] bg-green-500 hover:bg-green-600 text-white font-bold px-2 py-1 rounded shadow-sm"
                            >
                              Confirmar
                            </button>
                            <button 
                              onClick={() => updateStatus(appt.id, 'cancelled')}
                              className="text-[10px] bg-slate-400 hover:bg-slate-500 text-white font-bold px-2 py-1 rounded shadow-sm"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => deleteAppointment(appt.id)}
                          className="text-[10px] text-red-500 hover:text-red-700 font-bold px-2 py-1"
                        >
                          Eliminar
                        </button>
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
