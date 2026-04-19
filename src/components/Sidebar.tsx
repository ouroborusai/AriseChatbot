'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  MessageSquare,
  Users, 
  Package, 
  BarChart3, 
  Code2, 
  Settings,
  ChevronDown,
  Zap,
  X,
  Menu,
  LogOut,
  User,
  Search,
  Check
} from 'lucide-react';

const menuItems = [
  { name: 'Vista General', icon: LayoutDashboard, path: '/' },
  { name: 'Mensajes', icon: MessageSquare, path: '/messages' },
  { name: 'CRM (Pagos)', icon: Users, path: '/crm' },
  { name: 'Inventario', icon: Package, path: '/inventory' },
  { name: 'Analítica', icon: BarChart3, path: '/billing' },
  { name: 'Arise Studio', icon: Code2, path: '/studio' },
  { name: 'Configuración', icon: Settings, path: '/users' },
];

export default function Sidebar() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('viewer');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUserContext() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserData(user);

      const { data: accessData } = await supabase
        .from('user_company_access')
        .select('company_id, role, companies(name)')
        .eq('user_id', user.id);

      if (accessData) {
        const companyList = accessData
          .map((item: any) => ({
            id: item.company_id,
            name: item.companies?.name || 'Empresa sin Nombre',
            role: item.role
          }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        // Obtener el rol más alto disponible para el menú
        const highestRole = companyList.some(c => c.role === 'admin') ? 'admin' : 'staff';
        setUserRole(highestRole);

        // Añadir opción Global al principio para Admins
        const finalCompanies = highestRole === 'admin' 
          ? [{ id: 'global', name: '🌍 VISTA GLOBAL (Consolidado)', role: 'admin' }, ...companyList]
          : companyList;

        setCompanies(finalCompanies);
        setFilteredCompanies(finalCompanies);
        
        const savedId = localStorage.getItem('arise_active_company');
        let active = finalCompanies.find(c => c.id === savedId) || finalCompanies[0];
        
        // Si no hay empresas en absoluto, el login ya debería haber fallado, pero manejamos la salida
        if (active) {
          setActiveCompany(active);
          setUserRole(active.role);
          if (!savedId) localStorage.setItem('arise_active_company', active.id);
        } else {
          // Caso extremo: Logueado pero sin accesos (limpiar)
          localStorage.removeItem('arise_active_company');
        }
      }
    }
    fetchUserContext();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const filtered = companies.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCompanies(filtered);
  }, [searchQuery, companies]);

  const handleCompanyChange = (company: any) => {
    setActiveCompany(company);
    localStorage.setItem('arise_active_company', company.id);
    setUserRole(company.role);
    setIsDropdownOpen(false);
    window.location.reload();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    window.location.href = '/auth/login';
  };

  const shouldShowSelector = true; // Selector siempre visible en v6.23

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-50 flex flex-col p-6 md:p-8 z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
      <div className="flex items-center gap-4 mb-10 md:mb-12 px-2">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 rotate-3 transform hover:rotate-0 transition-all duration-500">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <div>
            <span className="font-black text-slate-800 tracking-tighter text-2xl leading-none block">Arise</span>
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] block mt-1">Intelligence</span>
          </div>
        </div>

        {/* CUSTOM MASTER SELECTOR v6.22 */}
        {shouldShowSelector && (
          <div className="mb-8 md:mb-10 relative" ref={dropdownRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 px-2 tracking-[0.2em]">Contexto Operativo</label>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 transition-all rounded-2xl p-4 text-[11px] font-black text-slate-700 outline-none"
            >
              <span className="truncate pr-2">{activeCompany?.name || 'Seleccionar Empresa'}</span>
              <ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-50 rounded-2xl shadow-2xl shadow-slate-200/50 z-[100] p-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="relative mb-3">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                   <input 
                    autoFocus
                    type="text" 
                    placeholder="Filtrar por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-9 pr-4 text-[11px] font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                   />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((c) => (
                      <button 
                        key={c.id} 
                        onClick={() => handleCompanyChange(c)}
                        className={`w-full text-left p-3 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-between group ${
                          activeCompany?.id === c.id 
                            ? 'bg-primary/5 text-primary' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <span className="truncate pr-4">{c.name}</span>
                        {activeCompany?.id === c.id && <Check size={12} className="shrink-0" />}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin resultados</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2 tracking-[0.2em]">Núcleo del Sistema</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black transition-all group ${
                  isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                }`}
              >
                <Icon size={18} className={`transition-all ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                <span className="tracking-tight">{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-glow" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-50">
          <div className="flex items-center gap-4 px-2 mb-6">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm relative shrink-0">
               <User size={20} />
               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-black text-slate-800 leading-none truncate">{userData?.email?.split('@')[0] || 'Usuario Arise'}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate mt-1">
                {userRole === 'admin' ? 'Administrador Global' : userRole.toUpperCase()}
              </p>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all group shadow-sm hover:shadow-red-100/50"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
  );
}
