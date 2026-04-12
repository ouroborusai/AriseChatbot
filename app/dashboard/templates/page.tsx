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
      <>
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
              onClick={handleRestoreSystemTemplates}
              className="w-full bg-blue-600/10 text-blue-600 border border-blue-200 px-6 py-3 rounded-2xl font-black text-xs hover:bg-blue-600/20 transition-all"
            >
              🔄 Recuperar JSONs del Sistema
            </button>
            <button
              onClick={() => openEdit()}
              className="w-full bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all"
            >
              ➕ Crear Nueva Plantilla (Vacia)
            </button>
          </div>
        </div>
      </div>
      
      {/* Es CRÍTICO renderizar el editor incluso en el estado vacío */}
      <TemplateEditor
        template={editingTemplate}
        allTemplates={templates}
        isOpen={showEditor}
        onClose={() => { setShowEditor(false); setEditingTemplate(null); }}
        onSave={handleSaveTemplate}
        onDelete={handleDeleteTemplate}
      />
    </>
    );
  }

  return (
    <div className="relative h-full flex overflow-hidden bg-slate-50/30">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${showEditor ? 'pr-[450px]' : ''}`}>
        <div className="space-y-4 h-full flex flex-col p-4 md:p-6 overflow-hidden">
          {/* Header Premium Rediseñado */}
          <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl p-4 rounded-[1.5rem] border border-white shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-slate-900 rounded-xl shadow-lg">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">Estrategia de Comunicación</h1>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Configuración de Canales y Flujos</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleExportTemplates} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-all">💾 Exportar</button>
              <label className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-all cursor-pointer">
                📥 Importar
                <input type="file" accept=".json" onChange={handleImportTemplates} className="hidden" />
              </label>
              <button onClick={() => openEdit()} className="bg-green-600 text-white px-5 py-2 rounded-xl font-bold text-[11px] shadow-lg shadow-green-600/20 hover:bg-green-500 transition-all">+ Nueva Plantilla</button>
            </div>
          </div>

          {/* DOBLE PIZARRA */}
          <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
            
            {/* PIZARRA 1: PROSPECTOS */}
            <div className="flex-1 flex flex-col bg-indigo-50/40 rounded-[2rem] border border-indigo-100 overflow-hidden">
              <div className="p-4 border-b border-indigo-100 bg-indigo-100/30 flex items-center justify-between">
                <h3 className="text-xs font-black text-indigo-700 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="text-lg">🎯</span> Pizarra de Prospectos
                </h3>
                <span className="bg-white text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  {templates.filter(t => t.segment === 'prospecto').length} flujos
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {templates.filter(t => t.segment === 'prospecto').map(template => (
                  <button 
                    key={template.id} 
                    onClick={() => openEdit(template)}
                    className="w-full text-left bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{template.category || 'General'}</span>
                      <span className={`h-2 w-2 rounded-full ${template.is_active ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600">{template.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{template.content}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* PIZARRA 2: CLIENTES */}
            <div className="flex-1 flex flex-col bg-emerald-50/40 rounded-[2rem] border border-emerald-100 overflow-hidden">
              <div className="p-4 border-b border-emerald-100 bg-emerald-100/30 flex items-center justify-between">
                <h3 className="text-xs font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="text-lg">👤</span> Pizarra de Clientes
                </h3>
                <span className="bg-white text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  {templates.filter(t => t.segment === 'cliente').length} flujos
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {templates.filter(t => t.segment === 'cliente').map(template => (
                  <button 
                    key={template.id} 
                    onClick={() => openEdit(template)}
                    className="w-full text-left bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{template.category || 'Operación'}</span>
                      <span className={`h-2 w-2 rounded-full ${template.is_active ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-600">{template.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{template.content}</p>
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