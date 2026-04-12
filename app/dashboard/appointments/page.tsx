'use client';

import React from 'react';
import { useAppointments } from '@/lib/hooks/useAppointments';

export default function AppointmentsPage() {
  const { appointments, loading, updateStatus, deleteAppointment, refetch } = useAppointments();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-emerald-50';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200 shadow-rose-50';
      default: return 'bg-amber-100 text-amber-700 border-amber-200 shadow-amber-50';
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header Sólido Adaptable */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-4 py-5 md:px-8 md:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tighter uppercase">
              Agenda de <span className="text-indigo-600">Negocios</span>
            </h1>
            <span className="hidden sm:inline-block bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">Live</span>
          </div>
          <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">Sistema de Canales Programados</p>
        </div>
        
        <div className="relative z-10 flex gap-2">
          <button 
            onClick={() => refetch()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-[10px] md:text-xs bg-white hover:bg-slate-50 text-slate-700 h-10 md:h-12 px-5 md:px-6 rounded-2xl transition-all border border-slate-200 font-black uppercase tracking-widest shadow-sm active:scale-95"
          >
            🔄 Sincronizar
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6 md:space-y-10">
                  {/* Quick Stats Grid - Industrial Compact */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            <StatCard 
              label="Citas Hoy" 
              value={appointments.filter(a => a.appointment_date === todayStr).length} 
              icon="⚡" 
              color="indigo" 
            />
            <StatCard 
              label="Pendientes" 
              value={appointments.filter(a => a.status === 'pending').length} 
              icon="⏳" 
              color="amber" 
            />
            <div className="hidden lg:block">
              <StatCard 
                label="Confirmadas" 
                value={appointments.filter(a => a.status === 'confirmed').length} 
                icon="✅" 
                color="emerald" 
              />
            </div>
          </div>

          {/* VISTA PARA MOBILE: Cuadrícula de Tarjetas Industrial */}
          <div className="md:hidden space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Live Agenda</h3>
              <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-slate-200">
                {appointments.length} REGISTROS
              </span>
            </div>
            
            {loading ? (
               <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-100 border-t-indigo-600 mb-4"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando...</p>
               </div>
            ) : appointments.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin eventos registrados</p>
              </div>
            ) : (
              appointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm active:bg-slate-50 transition-colors relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                       <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border ${appt.appointment_date === todayStr ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                          <span className="text-[8px] font-bold uppercase tracking-tighter mb-0.5 opacity-60">
                            {appt.appointment_date ? new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' }) : '---'}
                          </span>
                          <span className="text-xl font-bold leading-none">{appt.appointment_date ? new Date(appt.appointment_date + 'T00:00:00').getDate() : '--'}</span>
                       </div>
                       <div>
                          <p className="text-base font-bold text-slate-900 tracking-tighter leading-none mb-1 uppercase">{appt.appointment_time?.substring(0, 5) || '--:--'} <span className="text-[10px] text-slate-300">HRS</span></p>
                          <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold tracking-widest border uppercase ${getStatusStyle(appt.status)}`}>
                             {appt.status}
                          </span>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                       <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white text-slate-900 font-bold text-base border border-slate-200">
                          {appt.contacts?.name ? appt.contacts.name[0].toUpperCase() : 'C'}
                       </div>
                       <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 tracking-tight uppercase truncate">{appt.contacts?.name || 'Contacto No Definido'}</p>
                          <p className="text-[10px] font-mono font-bold text-indigo-600">+{appt.contacts?.phone_number}</p>
                       </div>
                    </div>
                    
                    <div className="px-1">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contexto:</p>
                       <div className="bg-slate-50 rounded-xl p-3 border border-slate-50 text-[11px] font-medium text-slate-600 leading-relaxed italic">
                          {appt.companies?.legal_name ? (
                            <div className="flex items-center gap-2 mb-1 not-italic">
                               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                               <span className="font-bold text-slate-800 uppercase tracking-tighter truncate">{appt.companies.legal_name}</span>
                            </div>
                          ) : null}
                          "{appt.notes || 'Sin especificaciones'}"
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {appt.status === 'pending' ? (
                       <>
                         <button onClick={() => updateStatus(appt.id, 'confirmed')} className="col-span-2 h-12 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest active:bg-indigo-700 transition-colors">Confirmar Cita</button>
                         <button onClick={() => updateStatus(appt.id, 'cancelled')} className="h-12 bg-white text-rose-600 border border-rose-100 rounded-xl text-[10px] font-bold uppercase tracking-widest active:bg-rose-50 transition-colors">Cancelar</button>
                         <a href={`https://wa.me/${appt.contacts?.phone_number}`} target="_blank" className="h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-xl shadow-sm active:bg-emerald-600 transition-colors">💬</a>
                       </>
                    ) : (
                      <>
                        <a href={`https://wa.me/${appt.contacts?.phone_number}`} target="_blank" className="col-span-2 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest shadow-sm active:bg-emerald-600 transition-colors">
                          <span>Establecer Contacto</span>
                          <span className="text-lg">💬</span>
                        </a>
                        <button onClick={() => deleteAppointment(appt.id)} className="col-span-2 h-10 text-[9px] font-bold text-slate-300 uppercase tracking-widest hover:text-rose-500 transition-colors">Eliminar Registro</button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* VISTA PARA DESKTOP: Tabla Master (Oculta en < md) */}
          <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden transition-all duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-indigo-600 pl-4 leading-none">Próximos Encuentros</h3>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] bg-slate-50 px-4 py-1.5 rounded-full">{appointments.length} REGISTROS ACTIVOS</span>
            </div>

            {loading ? (
              <div className="py-24 text-center">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando registros con la red neural...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                       <th className="px-8 py-5">Programación</th>
                       <th className="px-8 py-5">Contacto Principal</th>
                       <th className="px-8 py-5">Empresa / Contexto</th>
                       <th className="px-8 py-5">Estado</th>
                       <th className="px-8 py-5 text-right">Gestión</th>
                     </tr>
                   </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-24 text-center bg-white">
                          <div className="text-5xl mb-6 grayscale opacity-20">📅</div>
                          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[11px]">No hay citas pendientes de procesamiento</p>
                        </td>
                      </tr>
                    ) : (
                      appointments.map((appt) => (
                        <tr key={appt.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-8 py-8 whitespace-nowrap">
                            <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 ${appt.appointment_date === todayStr ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl shadow-indigo-100 scale-105' : 'bg-white border-slate-100 text-slate-900 group-hover:scale-105 group-hover:bg-slate-100'}`}>
                                <span className="text-[9px] font-black uppercase tracking-tighter mb-0.5 opacity-80">
                                  {appt.appointment_date ? new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' }) : '---'}
                                </span>
                                <span className="text-xl font-black leading-none">
                                  {appt.appointment_date ? new Date(appt.appointment_date + 'T00:00:00').getDate() : '--'}
                                </span>
                              </div>
                              <div>
                                <div className="text-base font-black text-slate-900 tracking-tighter leading-none mb-1.5 flex items-center gap-1.5">
                                  {appt.appointment_time?.substring(0, 5) || '--:--'} <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">HRS</span>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloque Reservado</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <div className="text-sm font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors uppercase">{appt.contacts?.name || 'Cliente S/N'}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-1">+{appt.contacts?.phone_number}</div>
                          </td>
                           <td className="px-8 py-8">
                             <div className="max-w-[280px]">
                                <div className="text-xs font-black text-slate-800 flex items-center gap-2 mb-2">
                                  <span className="shrink-0 text-xl grayscale group-hover:grayscale-0 transition-all">🏢</span>
                                  <span className="truncate" title={appt.companies?.legal_name}>{appt.companies?.legal_name || 'Individual / Sin Empresa'}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 line-clamp-2 italic leading-relaxed font-medium" title={appt.notes}>
                                  "{appt.notes || 'Sin especificaciones detalladas del cliente'}"
                                </p>
                             </div>
                           </td>
                          <td className="px-8 py-8">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black border tracking-[0.1em] shadow-sm uppercase ${getStatusStyle(appt.status)}`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="px-8 py-8 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                              {appt.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => updateStatus(appt.id, 'confirmed')}
                                    className="h-10 w-10 flex items-center justify-center bg-indigo-600 hover:bg-slate-900 text-white rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-90"
                                    title="Confirmar Cita"
                                  >
                                    ✅
                                  </button>
                                  <button 
                                    onClick={() => updateStatus(appt.id, 'cancelled')}
                                    className="h-10 w-10 flex items-center justify-center bg-white hover:bg-rose-50 text-slate-400 border border-slate-100 rounded-xl transition-all active:scale-90"
                                    title="Cancelar Cita"
                                  >
                                    ✖️
                                  </button>
                                </>
                              )}
                              <a 
                                href={`https://wa.me/${appt.contacts?.phone_number}`} 
                                target="_blank"
                                className="h-10 w-10 flex items-center justify-center bg-emerald-500 hover:bg-slate-900 text-white rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-90"
                              >
                                💬
                              </a>
                              <div className="w-px h-6 bg-slate-200 mx-1"></div>
                              <button 
                                onClick={() => deleteAppointment(appt.id)}
                                className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Eliminar Registro"
                              >
                                🗑️
                              </button>
                            </div>
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
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: string, color: 'indigo' | 'amber' | 'emerald' }) {
  const colorMap = {
    indigo: 'from-indigo-600 to-blue-500 shadow-indigo-100',
    amber: 'from-amber-500 to-orange-400 shadow-amber-100',
    emerald: 'from-emerald-600 to-teal-500 shadow-emerald-100'
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all duration-300">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900 group-hover:scale-110 transition-transform origin-left">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorMap[color]} text-white flex items-center justify-center text-xl shadow-xl`}>
        {icon}
      </div>
    </div>
  );
}
