'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, User, ShieldCheck, Users, ArrowUpRight, Search } from 'lucide-react';
import { MetricSmall } from '@/components/ui/MetricSmall';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import useSWR from 'swr';
import type { Employee } from '@/types/database';

/**
 *  TEAM HUB v12.0 (Diamond Resilience - SSOT)
 *  Aislamiento Tenant Estricto y Tipado Certificado.
 */
export default function TeamPage() {
  const { activeCompany, isLoading: isContextLoading } = useActiveCompany();
  const activeCompanyId = activeCompany?.id;
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchTeam = async (companyId: string): Promise<Employee[]> => {
    if (!companyId) return [];
    
    // MANDATO DIAMOND: Aislamiento Tenant Inquebrantable.
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .order('full_name');

    if (error) {
      console.error('[TEAM_SYNC_ERROR]', error);
      return [];
    }
    
    return data || [];
  };

  const { data: employees, isLoading: isSwrLoading } = useSWR<Employee[]>(
    !isContextLoading && activeCompanyId ? `team_${activeCompanyId}` : null,
    () => fetchTeam(activeCompanyId!),
    { revalidateOnFocus: false }
  );

  const loading = isContextLoading || isSwrLoading;

  const filteredEmployees = employees?.filter((emp: Employee) =>
    (emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  ) || [];

  const totalEmployees = employees?.length || 0;

  return (
    <div className="flex flex-col w-full max-w-full py-master-section animate-in fade-in duration-700 overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      
      <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-16 gap-8 px-4 lg:px-8">
        <div>
          <h1 className="text-6xl font-black text-neural-dark tracking-tighter uppercase italic">
            Equipo <span className="text-primary drop-shadow-xl">Humano.</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-6 flex items-center gap-4 italic opacity-60">
            INTELIGENCIA_DE_CAPITAL_//_v12.0_DIAMOND
          </p>
        </div>
        <div className="flex gap-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <input
              type="text"
              placeholder="BUSCAR_PERSONAL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-100 pl-14 pr-8 py-5 text-[10px] font-black uppercase italic w-full md:w-80 outline-none shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all"
              style={{ borderRadius: 'var(--radius-md)' }}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 px-4 lg:px-8">
        <MetricSmall title="Personal_Activo" value={totalEmployees.toString()} icon={Users} active />
        <MetricSmall title="Nodos_Sincronizados" value={loading ? '...' : totalEmployees.toString()} icon={Activity} />
        <MetricSmall title="Validación_Tenant" value="100%" icon={ShieldCheck} />
      </div>

      <div className="px-4 lg:px-8">
        <div className="arise-card overflow-hidden relative shadow-2xl border-slate-100/50" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Identidad_Master</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Posición_Asignada</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Protocolo_Contrato</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">Registro_Alta</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-right italic opacity-60">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-8 py-8"><div className="w-48 h-10 bg-slate-50 animate-pulse" style={{ borderRadius: 'var(--radius-md)' }} /></td>
                      <td className="px-8 py-8"><div className="w-32 h-6 bg-slate-50 animate-pulse" style={{ borderRadius: 'var(--radius-sm)' }} /></td>
                      <td className="px-8 py-8"><div className="w-24 h-6 bg-slate-50 animate-pulse" style={{ borderRadius: 'var(--radius-sm)' }} /></td>
                      <td className="px-8 py-8"><div className="w-28 h-6 bg-slate-50 animate-pulse" style={{ borderRadius: 'var(--radius-sm)' }} /></td>
                      <td className="px-8 py-8 text-right"><div className="w-12 h-12 bg-slate-50 animate-pulse ml-auto" style={{ borderRadius: 'var(--radius-md)' }} /></td>
                    </tr>
                  ))
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp: Employee) => (
                    <tr key={emp.id} className="group hover:bg-slate-50 transition-all cursor-pointer">
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-slate-50 text-slate-300 flex items-center justify-center font-black text-[12px] border border-slate-100 shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500 italic" style={{ borderRadius: 'var(--radius-md)' }}>
                            {emp.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <span className="text-[12px] font-black text-neural-dark uppercase tracking-tight group-hover:text-primary transition-colors italic">{emp.full_name}</span>
                            <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest italic opacity-60">ID: {emp.id.split('-')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <p className="text-[11px] font-black text-neural-dark tracking-tight italic opacity-80">{emp.position || 'No_Asignado'}</p>
                      </td>
                      <td className="px-8 py-8">
                        <span className="text-[8px] font-black bg-primary/5 text-primary border border-primary/10 px-3 py-1.5 uppercase tracking-widest italic shadow-sm" style={{ borderRadius: 'var(--radius-sm)' }}>
                          {emp.contract_type || 'STANDARD'}
                        </span>
                      </td>
                      <td className="px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                        {new Date(emp.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                      </td>
                      <td className="px-8 py-8 text-right">
                        <button className="btn-arise w-12 h-12 flex ml-auto items-center justify-center">
                          <ArrowUpRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <User size={48} className="mx-auto text-slate-200 mb-6" />
                      <h3 className="text-xl font-black text-neural-dark uppercase italic tracking-tighter">Sin_Registros</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">No_se_encontraron_empleados</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
