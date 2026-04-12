'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTemplates } from '@/lib/hooks/useTemplates';
import { saludosTemplates } from '@/lib/templates-config/saludos';
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
  
  // Estados para filtros
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [filterSegment, setFilterSegment] = useState<string>('todos');

  // Filtrado de plantillas
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchCategory = filterCategory === 'todos' || t.category === filterCategory;
      const matchSegment = filterSegment === 'todos' || t.segment === filterSegment;
      return matchCategory && matchSegment;
    });
  }, [templates, filterCategory, filterSegment]);

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

  // Restaurar plantillas por defecto - re-insertar en Supabase
  const handleRestoreDefaults = async () => {
    if (!confirm('¿Restaurar plantillas por defecto?\n\nSolo se restaurarán los saludos principales.')) return;
    
    for (const t of saludosTemplates) {
      await supabase.from('templates').upsert(t);
    }
    
    alert(`✅ Se restauraron ${saludosTemplates.length} plantillas de saludo`);
    window.location.reload();
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
      <div className="h-full flex flex-col items-center justify-center bg-slate-50/30 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-4xl">
            📋
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            No hay plantillas configuradas
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Tu base de datos está vacía. Puedes restaurar las plantillas por defecto o crear nuevas manualmente.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRestoreDefaults}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-xl shadow-green-600/20 hover:bg-green-500 transition-all"
            >
              🔄 Restaurar Plantillas por Defecto
            </button>
            <button
              onClick={() => openEdit()}
              className="w-full bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all"
            >
              ➕ Crear Nueva Plantilla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex overflow-hidden bg-slate-50/30">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${showEditor ? 'pr-[450px]' : ''}`}>
        <div className="space-y-6 h-full flex flex-col p-4 md:p-6 overflow-hidden">
          {/* Header Premium */}
          <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl p-5 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-6">
              <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Builder de Flujos</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WhatsApp Automation Engine</p>
              </div>
              
              <div className="hidden lg:flex items-center gap-6 bg-slate-100/50 px-6 py-2 rounded-2xl border border-slate-100">
                <div className="flex flex-col border-r border-slate-200 pr-4">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nodes</span>
                  <span className="text-base font-black text-slate-800 leading-none">{stats.total}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Active</span>
                  <span className="text-base font-black text-green-600 leading-none">{stats.active}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
                <option value="todos">Todas las categorías</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={filterSegment} onChange={(e) => setFilterSegment(e.target.value)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
                <option value="todos">Todos los segmentos</option>
                <option value="cliente">Cliente</option>
                <option value="prospecto">Prospecto</option>
              </select>
              <button onClick={handleExportTemplates} className="px-5 py-2.5 bg-white text-blue-600 border border-blue-200 rounded-2xl text-xs font-black hover:bg-blue-50 hover:border-blue-300 transition-all" title="Exportar plantillas a JSON">💾 Exportar</button>
              <label className="px-5 py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-2xl text-xs font-black hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer" title="Importar plantillas desde JSON">
                📥 Importar
                <input type="file" accept=".json" onChange={handleImportTemplates} className="hidden" />
              </label>
              <button onClick={handleDeleteAll} className="px-5 py-2.5 bg-white text-rose-600 border border-rose-200 rounded-2xl text-xs font-black hover:bg-rose-50 hover:border-rose-300 transition-all">🗑️ Limpiar Todo</button>
              <button onClick={handleRestoreDefaults} className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all">🔄 Restaurar</button>
              <button onClick={() => openEdit()} className="bg-green-600 text-white px-7 py-3 rounded-2xl font-black text-xs shadow-xl shadow-green-600/20 hover:bg-green-500 transition-all">+ Nueva Plantilla</button>
            </div>
          </div>

           {/* Builder Canvas Area */}
          <div className="flex-1 min-h-0 bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-white shadow-inner overflow-hidden relative">
             <FlowCanvas 
               templates={filteredTemplates} 
               selectedTemplateId={editingTemplate?.id || null} 
               onSelectTemplate={(id) => openEdit(templates.find(t => t.id === id))}
             />
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