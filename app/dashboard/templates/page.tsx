'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTemplates } from '@/lib/hooks/useTemplates';

import { 
  TemplateEditor,
  Template,
  CATEGORIES,
  FlowCanvas
} from '@/app/components/templates';

export default function TemplatesPage() {
  const supabase = useMemo(() => createClient(), []);
  const { templates, loading, fetchTemplates, saveTemplate, deleteTemplate, deleteAllTemplates } = useTemplates();

  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  const [filterSegment, setFilterSegment] = useState<string>('todos');

  // Filtrado de plantillas
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      return filterSegment === 'todos' || t.segment === filterSegment;
    });
  }, [templates, filterSegment]);

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    byCategory: CATEGORIES.map(c => ({ ...c, count: templates.filter(t => t.category === c.id).length })),
  }), [templates]);

  const handleSaveTemplate = async (form: Partial<Template>) => {
    const templateToSave = { 
      ...form,
      id: editingTemplate?.id || `tpl_${Date.now()}`, 
    } as Template;
    
    await saveTemplate(templateToSave);
    
    setShowEditor(false); 
    setEditingTemplate(null);
  };

  const handleRestoreSystemTemplates = async () => {
    if (!confirm('¿Restaurar plantillas de sistema?\n\nSe sobrescribirá la base de datos con los archivos fuente JSON.')) return;
    try {
      const res = await fetch('/api/setup-templates', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Sincronización exitosa: ${data.count} plantillas restauradas`);
        window.location.reload();
      } else {
        alert(`❌ Error del servidor: ${data.error}`);
      }
    } catch (e: any) {
      alert(`❌ Error de conexión: ${e.message}`);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('¡ATENCIÓN! ¿Estás seguro de que quieres eliminar TODAS las plantillas del servidor? Esta acción destruirá tu Canvas y no se puede deshacer.')) return;
    await deleteAllTemplates();
  };

  const handleExportTemplates = () => {
    const dataStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mtz-plantillas-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as Template[];
        if (!Array.isArray(imported)) {
          alert('⚠️ El archivo no tiene un formato válido');
          return;
        }

        const confirmMsg = `📥 Importar ${imported.length} plantillas:\n\n` +
          `• Se crearán nuevas plantillas con IDs únicos\n` +
          `• Las plantillas existentes no se modificarán\n\n` +
          `¿Continuar?`;

        if (!confirm(confirmMsg)) return;

        // Importar cada plantilla con un nuevo ID
        for (const tpl of imported) {
          const newTemplate = {
            ...tpl,
            id: `imported_${tpl.id}_${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await saveTemplate(newTemplate);
        }

        alert(`✅ Se importaron ${imported.length} plantillas exitosamente`);
        window.location.reload();
      } catch (error) {
        console.error('Error al importar:', error);
        alert('❌ Error al importar el archivo. Asegúrate de que sea un JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    setShowEditor(false);
    setEditingTemplate(null);
  };

  const openEdit = (template?: Template) => { 
    setEditingTemplate(template || null);
    setShowEditor(true);
  };

  const [activeBoard, setActiveBoard] = useState<'prospecto' | 'cliente'>('prospecto');

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-50/50">
      <div className="relative">
        <div className="animate-spin h-16 w-16 border-[3px] border-green-500/20 border-t-green-600 rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
      </div>
      <p className="mt-4 text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Cargando...</p>
    </div>
  );

  // Estado vacío cuando no hay plantillas
  if (templates.length === 0) {
    return (
      <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-700">
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 text-center max-w-2xl mx-auto w-full my-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center text-5xl shadow-2xl">
            🏗️
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Arquitectura de Comunicación Vacía</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">
            No se han detectado flujos operativos en el SSOT. Puedes restaurar el esquema original o iniciar un desarrollo manual.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={handleRestoreSystemTemplates}
              className="flex-1 h-14 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
            >
              🔄 Restaurar del Sistema
            </button>
            <button
              onClick={() => openEdit()}
              className="flex-1 h-14 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 transition-all"
            >
              ➕ Nueva Plantilla
            </button>
          </div>
        </div>
        
        <TemplateEditor
          template={editingTemplate}
          allTemplates={templates}
          isOpen={showEditor}
          onClose={() => { setShowEditor(false); setEditingTemplate(null); }}
          onSave={handleSaveTemplate}
          onDelete={handleDeleteTemplate}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full flex overflow-hidden bg-slate-50/50">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${showEditor ? 'md:pr-[450px]' : ''}`}>
        <div className="h-full flex flex-col p-4 md:p-8 overflow-hidden space-y-6 md:space-y-8 animate-in fade-in duration-700">
          
          {/* Header Premium Industrial */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/50">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 md:h-16 md:w-16 bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-2xl shadow-xl shadow-slate-200">
                <span className="animate-pulse">⚡</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2 uppercase">Estrategia de Flujos</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural Communication Pipeline</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2 md:gap-3">
              <button onClick={handleExportTemplates} className="px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">💾 Exportar</button>
              <label className="px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm cursor-pointer text-center">
                📥 Importar
                <input type="file" accept=".json" onChange={handleImportTemplates} className="hidden" />
              </label>
              <button 
                onClick={() => openEdit()} 
                className="col-span-2 md:col-span-1 h-12 md:h-14 px-6 bg-slate-900 text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95"
              >
                + Nueva Plantilla
              </button>
            </div>
          </div>

          {/* SELECTOR DE PIZARRA (MÓVIL) */}
          <div className="md:hidden flex p-1.5 bg-slate-200/50 rounded-2xl">
            <button 
              onClick={() => setActiveBoard('prospecto')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeBoard === 'prospecto' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              Prospectos
            </button>
            <button 
              onClick={() => setActiveBoard('cliente')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeBoard === 'cliente' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              Clientes
            </button>
          </div>

          {/* DOBLE PIZARRA RESPONSIVA */}
          <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-8 min-h-0 overflow-hidden relative">
            
            {/* PIZARRA 1: PROSPECTOS */}
            <div className={`flex-1 flex-col bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl transition-all duration-500 ${activeBoard === 'prospecto' || 'hidden md:flex' ? 'flex scale-100 opacity-100' : 'hidden scale-95 opacity-0'}`}>
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <span className="text-xl">🎯</span>
                   <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Pizarra Prospectos</h3>
                </div>
                <span className="bg-white/10 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border border-white/10">
                  {templates.filter(t => t.segment === 'prospecto').length} Sprints
                </span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
                {templates.filter(t => t.segment === 'prospecto').map(template => (
                  <button 
                    key={template.id} 
                    onClick={() => openEdit(template)}
                    className="w-full text-left bg-white/5 p-5 md:p-6 rounded-[1.8rem] border border-white/5 shadow-sm hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all group animate-in slide-in-from-bottom-2 duration-500"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{template.category || 'Pipeline'}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${template.is_active ? 'bg-emerald-500' : 'bg-slate-600'} shadow-[0_0_8px] shadow-current`}></span>
                    </div>
                    <p className="text-sm font-black text-white uppercase tracking-tight line-clamp-1 group-hover:text-indigo-400 transition-colors">{template.name}</p>
                    <div className="mt-3 bg-black/20 p-3 rounded-xl border border-white/5">
                       <p className="text-[11px] font-medium text-slate-400 line-clamp-2 leading-relaxed italic">"{template.content}"</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* PIZARRA 2: CLIENTES */}
            <div className={`flex-1 flex-col bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl transition-all duration-500 ${activeBoard === 'cliente' || 'hidden md:flex' ? 'flex scale-100 opacity-100' : 'hidden md:flex scale-95 opacity-0'}`}>
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <span className="text-xl">🤝</span>
                   <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Pizarra Fidelización</h3>
                </div>
                <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                  {templates.filter(t => t.segment === 'cliente').length} Flujos
                </span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
                {templates.filter(t => t.segment === 'cliente').map(template => (
                  <button 
                    key={template.id} 
                    onClick={() => openEdit(template)}
                    className="w-full text-left bg-slate-50 p-5 md:p-6 rounded-[1.8rem] border border-slate-100 shadow-sm hover:bg-white hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all group animate-in slide-in-from-bottom-2 duration-500"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">{template.category || 'Loyalty'}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${template.is_active ? 'bg-emerald-500' : 'bg-slate-300'} shadow-[0_0_8px] shadow-current`}></span>
                    </div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1 group-hover:text-emerald-600 transition-colors">{template.name}</p>
                    <div className="mt-3 bg-white p-3 rounded-xl border border-slate-200/50 shadow-inner">
                       <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed italic">"{template.content}"</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sidebar Editor (estilo KOMMO) */}
      <TemplateEditor
        template={editingTemplate}
        allTemplates={templates}
        isOpen={showEditor}
        onClose={() => { setShowEditor(false); setEditingTemplate(null); }}
        onSave={handleSaveTemplate}
        onDelete={handleDeleteTemplate}
      />
    </div>
  );
}