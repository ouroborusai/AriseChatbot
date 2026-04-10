'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTemplateFilters } from '@/lib/hooks/useTemplates';
import { SearchInput } from '@/app/components/SearchInput';
import {
  FlowCanvas,
  TemplateDetailPanel,
  TemplateEditor,
  Template,
  CATEGORIES,
  SERVICE_TYPES,
  DEFAULT_TEMPLATES,
} from '@/app/components/templates';

type ViewMode = 'flow' | 'cards';

export default function TemplatesPage() {
  const supabase = createClient();
  const { category, setCategory, segment, setSegment, service, setService, search, setSearch } = useTemplateFilters();
  
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES as Template[]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('flow');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      const { data } = await supabase.from('templates').select('*').order('priority');
      if (data && data.length > 0) {
        const merged = [...(DEFAULT_TEMPLATES as Template[])];
        data.forEach((t: any) => {
          if (!merged.find(m => m.id === t.id)) {
            merged.push({ ...t, actions: t.actions || [], segment: t.segment || 'todos', is_active: t.is_active ?? true, priority: t.priority || 50 });
          }
        });
        setTemplates(merged);
      }
      setLoading(false);
    };
    loadTemplates();
  }, [supabase]);

  const filteredTemplates = useMemo(() => 
    templates.filter((t) => {
      const catMatch = category === 'todos' || t.category === category;
      const segMatch = segment === 'todos' || t.segment === segment || t.segment === 'todos';
      const servMatch = service === 'todos' || t.service_type === service;
      const searchMatch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase());
      return catMatch && segMatch && servMatch && searchMatch;
    }), [templates, category, segment, service, search]);

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    byCategory: CATEGORIES.map(c => ({ ...c, count: templates.filter(t => t.category === c.id).length })),
  }), [templates]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;

  const handleCopy = (template: Template) => { navigator.clipboard.writeText(template.content); setCopiedId(template.id); setTimeout(() => setCopiedId(null), 2000); };

  const handleSaveTemplate = async (form: Partial<Template>) => {
    const template: Template = { id: editingTemplate?.id || `tpl_${Date.now()}`, name: form.name!, content: form.content!, category: form.category || 'general', service_type: form.service_type, trigger: form.trigger, actions: form.actions || [], is_active: form.is_active ?? true, priority: form.priority || 50, segment: (form.segment as any) || 'todos' };
    await supabase.from('templates').upsert({ id: template.id, name: template.name, content: template.content, category: template.category, service_type: template.service_type, trigger: template.trigger, actions: template.actions, is_active: template.is_active, priority: template.priority, segment: template.segment });
    setTemplates(editingTemplate ? templates.map(t => t.id === template.id ? template : t) : [...templates, template]);
    setShowEditor(false); setEditingTemplate(null);
  };

  const handleDelete = async (id: string) => { if (!confirm('¿Eliminar?')) return; await supabase.from('templates').delete().eq('id', id); setTemplates(templates.filter(t => t.id !== id)); if (selectedTemplateId === id) setSelectedTemplateId(null); };
  const handleToggleActive = async (id: string) => { const t = templates.find(x => x.id === id); if (!t) return; const u = { ...t, is_active: !t.is_active }; await supabase.from('templates').update({ is_active: u.is_active }).eq('id', id); setTemplates(templates.map(x => x.id === id ? u : x)); };
  const openEdit = (template?: Template) => { setEditingTemplate(template || null); setShowEditor(true); };
  const handleSelectTemplate = (id: string) => setSelectedTemplateId(id);

  if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="card-base">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900">Flow de Respuestas</h1><p className="text-sm text-slate-500">Visualiza y configura el flujo conversacional</p></div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setViewMode('flow')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'flow' ? 'bg-white shadow text-green-600' : 'text-slate-600 hover:text-slate-900'}`}>🔀 <span className="hidden sm:inline">Flujo</span></button>
              <button onClick={() => setViewMode('cards')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'cards' ? 'bg-white shadow text-green-600' : 'text-slate-600 hover:text-slate-900'}`}>📋 <span className="hidden sm:inline">Lista</span></button>
            </div>
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
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-48"><SearchInput value={search} onChange={setSearch} placeholder="Buscar..." /></div>
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
        {viewMode === 'flow' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
            <div className="lg:col-span-3 min-h-[500px]"><FlowCanvas templates={filteredTemplates} selectedTemplateId={selectedTemplateId} onSelectTemplate={handleSelectTemplate} /></div>
            <div className="lg:col-span-1"><TemplateDetailPanel template={selectedTemplate} allTemplates={templates} onCopy={handleCopy} onEdit={openEdit} onToggleActive={handleToggleActive} onDelete={handleDelete} copiedId={copiedId} /></div>
          </div>
        ) : (
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
        )}
      </div>

      <TemplateEditor template={editingTemplate} allTemplates={templates} isOpen={showEditor} onClose={() => { setShowEditor(false); setEditingTemplate(null); }} onSave={handleSaveTemplate} />
    </div>
  );
}