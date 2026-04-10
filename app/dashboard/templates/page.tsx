'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTemplateFilters } from '@/lib/hooks/useTemplates';
import { SearchInput } from '@/app/components/SearchInput';
import {
  TemplateDetailPanel,
  TemplateEditor,
  Template,
  CATEGORIES,
  SERVICE_TYPES,
  DEFAULT_TEMPLATES,
  WORKFLOWS,
} from '@/app/components/templates';

type ViewMode = 'cards';

export default function TemplatesPage() {
  const supabase = createClient();
  const { category, setCategory, segment, setSegment, service, setService, search, setSearch } = useTemplateFilters();

  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES as Template[]);
  const [loading, setLoading] = useState(true);
  const [viewMode] = useState<ViewMode>('cards');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [workflowFilter, setWorkflowFilter] = useState<string>('todos');

  // Cargar templates solo una vez al montar el componente
  useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      const { data, error } = await supabase.from('templates').select('*').order('priority');
      if (!isMounted) return;

      if (data && data.length > 0) {
        const normalized = data.map((t: any) => ({
          ...t,
          actions: t.actions || [],
          segment: t.segment || 'todos',
          is_active: t.is_active ?? true,
          priority: t.priority || 50,
          workflow: t.workflow || 'general'
        }));
        setTemplates(normalized);
      } else {
        // BD vacía: iniciar con array vacío, NO re-crear defaults automáticamente
        setTemplates([]);
      }
      setLoading(false);
    };
    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTemplates = useMemo(() => 
    templates.filter((t) => {
      const catMatch = category === 'todos' || t.category === category;
      const segMatch = segment === 'todos' || t.segment === segment || t.segment === 'todos';
      const servMatch = service === 'todos' || t.service_type === service;
      const wfMatch = workflowFilter === 'todos' || t.workflow === workflowFilter;
      const searchMatch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase());
      return catMatch && segMatch && servMatch && wfMatch && searchMatch;
    }), [templates, category, segment, service, search, workflowFilter]);

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    byCategory: CATEGORIES.map(c => ({ ...c, count: templates.filter(t => t.category === c.id).length })),
  }), [templates]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;

  const handleCopy = (template: Template) => { navigator.clipboard.writeText(template.content); setCopiedId(template.id); setTimeout(() => setCopiedId(null), 2000); };

  const handleSaveTemplate = async (form: Partial<Template>) => {
    const template: Template = { 
      id: editingTemplate?.id || `tpl_${Date.now()}`, 
      name: form.name!, 
      content: form.content!, 
      category: form.category || 'general', 
      service_type: form.service_type, 
      trigger: form.trigger, 
      actions: form.actions || [], 
      is_active: form.is_active ?? true, 
      priority: form.priority || 50, 
      segment: (form.segment as any) || 'todos',
      workflow: form.workflow || 'general'
    };
    
    const { data, error } = await supabase
      .from('templates')
      .upsert({ 
        id: template.id, 
        name: template.name, 
        content: template.content, 
        category: template.category, 
        service_type: template.service_type, 
        trigger: template.trigger, 
        actions: template.actions, 
        is_active: template.is_active, 
        priority: template.priority, 
        segment: template.segment,
        workflow: template.workflow,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id', ignoreDuplicates: false })
      .select();
    
    if (error) {
      alert('Error al guardar: ' + error.message);
      return;
    }
    
    setTemplates(editingTemplate ? templates.map(t => t.id === template.id ? template : t) : [...templates, template]);
    setShowEditor(false); 
    setEditingTemplate(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar?')) return;
    await supabase.from('templates').delete().eq('id', id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (selectedTemplateId === id) setSelectedTemplateId(null);
  };
  const handleToggleActive = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    const newIsActive = !template.is_active;
    setTemplates(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, is_active: newIsActive };
      }
      return t;
    }));
    await supabase.from('templates').update({ is_active: newIsActive }).eq('id', id);
  };
  const openEdit = (template?: Template) => { 
    setShowEditor(true);
    setEditingTemplate(template || null);
  };
  const handleSelectTemplate = (id: string) => setSelectedTemplateId(id);

  const reloadTemplates = async () => {
    const { data } = await supabase.from('templates').select('*').order('priority');
    if (data) {
      const normalized = data.map((t: any) => ({
        ...t,
        actions: t.actions || [],
        segment: t.segment || 'todos',
        is_active: t.is_active ?? true,
        priority: t.priority || 50,
        workflow: t.workflow || 'general'
      }));
      setTemplates(normalized);
    } else {
      setTemplates([]);
    }
  };

  const handleDeleteProspects = async () => {
    if (!confirm('¿Eliminar todas las plantillas de prospecto? Esto no se puede deshacer.')) return;

    const prospectTemplates = templates.filter(t => t.segment === 'prospecto');
    const idsToDelete = prospectTemplates.map(t => t.id);

    if (idsToDelete.length === 0) {
      alert('No hay plantillas de prospecto para eliminar');
      return;
    }

    for (const id of idsToDelete) {
      await supabase.from('templates').delete().eq('id', id);
    }

    await reloadTemplates();
    alert(`Eliminado(s) ${idsToDelete.length} plantilla(s) de prospecto`);
  };

  const handleDeleteClients = async () => {
    if (!confirm('¿Eliminar todas las plantillas de cliente? Esto no se puede deshacer.')) return;

    const clientTemplates = templates.filter(t => t.segment === 'cliente');
    const idsToDelete = clientTemplates.map(t => t.id);

    if (idsToDelete.length === 0) {
      alert('No hay plantillas de cliente para eliminar');
      return;
    }

    for (const id of idsToDelete) {
      await supabase.from('templates').delete().eq('id', id);
    }

    await reloadTemplates();
    alert(`Eliminado(s) ${idsToDelete.length} plantilla(s) de cliente`);
  };

  const handleDeleteAll = async () => {
    if (!confirm('¿Eliminar TODAS las plantillas? Esto no se puede deshacer.')) return;

    const allIds = templates.map(t => t.id);

    for (const id of allIds) {
      await supabase.from('templates').delete().eq('id', id);
    }

    await reloadTemplates();
    alert(`Eliminado(s) ${allIds.length} plantilla(s)`);
  };

  const handleRestoreDefaults = async () => {
    if (!confirm('¿Restaurar plantillas por defecto? Se agregarán las plantillas predeterminadas del sistema.')) return;

    const defaults = DEFAULT_TEMPLATES as Template[];

    for (const t of defaults) {
      await supabase.from('templates').upsert({
        id: t.id,
        name: t.name,
        content: t.content,
        category: t.category || 'general',
        service_type: t.service_type || null,
        trigger: t.trigger || null,
        actions: t.actions || [],
        is_active: t.is_active ?? true,
        priority: t.priority || 50,
        segment: t.segment || 'todos',
        workflow: t.workflow || 'general'
      });
    }

    await reloadTemplates();
    alert('Plantillas por defecto restauradas');
  };

  if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="card-base">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900">Flow de Respuestas</h1><p className="text-sm text-slate-500">Visualiza y configura el flujo conversacional</p></div>
          <div className="flex items-center gap-3">
            <button onClick={() => openEdit()} className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700">+ Nueva</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="text-center"><p className="text-xl font-bold text-slate-900">{stats.total}</p><p className="text-[10px] text-slate-500">Total</p></div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center"><p className="text-xl font-bold text-green-600">{stats.active}</p><p className="text-[10px] text-slate-500">Activas</p></div>
        </div>
        {stats.byCategory.slice(0, 6).map(cat => (
          <button key={cat.id} onClick={() => setCategory(category === cat.id ? 'todos' : cat.id)} className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition ${category === cat.id ? 'ring-2 ring-green-400' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.colorHex }} />
            <span className="text-sm font-medium">{cat.name}</span>
            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">{cat.count}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button 
          onClick={handleDeleteProspects}
          className="px-3 py-1.5 rounded-xl border border-purple-200 text-purple-600 text-sm hover:bg-purple-50 transition"
        >
          🗑️ Prospectos
        </button>
        <button 
          onClick={handleDeleteClients}
          className="px-3 py-1.5 rounded-xl border border-blue-200 text-blue-600 text-sm hover:bg-blue-50 transition"
        >
          🗑️ Clientes
        </button>
        <button
          onClick={handleDeleteAll}
          className="px-3 py-1.5 rounded-xl border border-red-300 text-red-600 text-sm hover:bg-red-50 transition"
        >
          🗑️ Todo
        </button>
        <button
          onClick={handleRestoreDefaults}
          className="px-3 py-1.5 rounded-xl border border-green-300 text-green-600 text-sm hover:bg-green-50 transition"
        >
          🔄 Restaurar
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-48"><SearchInput value={search} onChange={setSearch} placeholder="Buscar..." /></div>
        <select value={workflowFilter} onChange={(e) => setWorkflowFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="todos">Todos los workflows</option>
          {WORKFLOWS.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
        </select>
        <select value={segment} onChange={(e) => setSegment(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="todos">Todos los segmentos</option><option value="cliente">👤 Clientes</option><option value="prospecto">🔍 Prospectos</option>
        </select>
        <select value={service} onChange={(e) => setService(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="todos">Todos los servicios</option>
          {SERVICE_TYPES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-sm text-slate-500">{filteredTemplates.length} plantillas</span>
      </div>

      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => {
              const cat = CATEGORIES.find(c => c.id === template.category) || CATEGORIES[6];
              const srv = SERVICE_TYPES.find(s => s.id === template.service_type);
              return (
                <div key={template.id} onClick={() => handleSelectTemplate(template.id)} className={`card-base cursor-pointer transition hover:shadow-md ${selectedTemplateId === template.id ? 'ring-2 ring-green-400' : ''} ${template.is_active ? '' : 'opacity-60'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center text-white shrink-0`}>{cat.icon}</div>
                    <div className="flex-1 min-w-0"><h3 className="font-semibold text-slate-900 text-sm truncate">{template.name}</h3><p className="text-xs text-slate-500">{cat.name}</p></div>
                    <div className={`w-2 h-2 rounded-full ${template.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-2">{template.content}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {template.trigger && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">🔑 {template.trigger}</span>}
                    {srv && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{srv.icon}</span>}
                    {template.segment && template.segment !== 'todos' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${template.segment === 'cliente' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {template.segment === 'cliente' ? '👤' : '🔍'}
                      </span>
                    )}
                  </div>
                  {template.actions && template.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.actions.slice(0, 3).map((a, i) => <span key={i} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{a.title}</span>)}
                      {template.actions.length > 3 && <span className="text-[10px] text-slate-400">+{template.actions.length - 3}</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleCopy(template); }} className="p-1.5 rounded hover:bg-slate-50 text-slate-400">{copiedId === template.id ? '✅' : '📋'}</button>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(template); }} className="p-1.5 rounded hover:bg-slate-50 text-slate-400">✏️</button>
                    </div>
                    <span className="text-xs text-slate-400">#{template.priority}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {selectedTemplateId && (
        <TemplateDetailPanel 
          template={selectedTemplate} 
          allTemplates={templates} 
          onCopy={handleCopy} 
          onEdit={openEdit} 
          onToggleActive={handleToggleActive} 
          onDelete={handleDelete} 
          copiedId={copiedId} 
        />
      )}

      <TemplateEditor template={editingTemplate} allTemplates={templates} isOpen={showEditor} onClose={() => { setShowEditor(false); setEditingTemplate(null); }} onSave={handleSaveTemplate} />
    </div>
  );
}