'use client';

import { useState, useEffect } from 'react';
import { Template, Action } from './types';
import { CATEGORIES, SERVICE_TYPES, WORKFLOWS } from './config';

interface ListOption {
  id: string;
  title: string;
  description: string;
  next_template_id?: string;
}

interface TemplateEditorProps {
  template: Template | null;
  allTemplates: Template[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Partial<Template>) => void;
  onDelete?: (id: string) => void;
}

export default function TemplateEditor({ template, allTemplates, isOpen, onClose, onSave, onDelete }: TemplateEditorProps) {
  const [form, setForm] = useState<Partial<Template>>({
    name: '',
    content: '',
    category: 'general',
    segment: 'todos',
    service_type: undefined,
    trigger: '',
    actions: [],
    is_active: true,
    priority: 50,
    workflow: 'general',
  });

  const [listOptions, setListOptions] = useState<ListOption[]>([]);
  const [responseType, setResponseType] = useState<'text' | 'buttons' | 'list'>('text');
  const [activeTab, setActiveTab] = useState<'content' | 'actions'>('content');

  useEffect(() => {
    if (template) {
      setForm({ ...template });
      
      // Determinar el tipo de respuesta basado en las acciones
      if (template.actions && template.actions.length > 0) {
        if (template.actions.some(a => a.type === 'list')) {
          setResponseType('list');
          const listAction = template.actions.find(a => a.type === 'list');
          if (listAction?.description) {
            try {
              setListOptions(JSON.parse(listAction.description));
            } catch {
              setListOptions([]);
            }
          }
        } else if (template.actions.some(a => a.type === 'button')) {
          setResponseType('buttons');
        }
      } else {
        setResponseType('text');
      }
    } else {
      setForm({
        name: '',
        content: '',
        category: 'general',
        segment: 'todos',
        service_type: undefined,
        trigger: '',
        actions: [],
        is_active: true,
        priority: 50,
        workflow: 'general',
      });
      setListOptions([]);
      setResponseType('text');
    }
  }, [template, isOpen]);

  const handleResponseTypeChange = (type: 'text' | 'buttons' | 'list') => {
    setResponseType(type);
    if (type === 'text') {
      setForm(prev => ({ ...prev, actions: [] }));
    } else if (type === 'buttons') {
      const existingButtons = form.actions?.filter(a => a.type === 'button') || [];
      setForm(prev => ({ ...prev, actions: existingButtons.slice(0, 3) }));
    } else if (type === 'list') {
      const existingList = form.actions?.find(a => a.type === 'list');
      if (!existingList) {
        setForm(prev => ({
          ...prev,
          actions: [{ type: 'list', title: 'Opciones', description: '', id: 'list_1' }]
        }));
        setListOptions([{ id: 'opt_1', title: '', description: '', next_template_id: '' }]);
      } else {
        setForm(prev => ({ ...prev, actions: [existingList] }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.content) {
      alert('⚠️ El nombre y el contenido son obligatorios');
      return;
    }

    // Validar nombre duplicado (excepto si es la misma plantilla que se está editando)
    const duplicateName = allTemplates.find(
      t => t.name.toLowerCase() === form.name?.toLowerCase() && t.id !== form.id
    );
    if (duplicateName) {
      alert(`⚠️ Ya existe una plantilla con el nombre "${duplicateName.name}". Por favor usa un nombre único.`);
      return;
    }

    // Validar que las opciones de lista tengan next_template_id si tienen título
    if (responseType === 'list' && listOptions.length > 0) {
      const emptyOptions = listOptions.filter(opt => opt.title && !opt.next_template_id);
      if (emptyOptions.length > 0) {
        const confirm = window.confirm(
          `⚠️ Tienes ${emptyOptions.length} opción(es) de lista con título pero sin enlace.\n\n` +
          `¿Quieres guardar de todos modos? (Recomendado: conecta cada opción a una plantilla)`
        );
        if (!confirm) return;
      }
    }

    let finalActions = form.actions || [];

    if (responseType === 'text') {
      finalActions = [];
    } else if (responseType === 'buttons') {
      finalActions = finalActions.filter(a => a.type === 'button').slice(0, 3);
    } else if (responseType === 'list') {
      const listAction = finalActions.find(a => a.type === 'list');
      if (listAction) {
        finalActions = [{ ...listAction, description: JSON.stringify(listOptions) }];
      }
    }

    onSave({ ...form, actions: finalActions });
  };

  const addAction = () => {
    if (responseType !== 'buttons') return;
    if ((form.actions?.length || 0) >= 3) return;
    setForm(prev => ({
      ...prev,
      actions: [...(prev.actions || []), { type: 'button', id: '', title: '', next_template_id: '' }]
    }));
  };

  const updateAction = (index: number, field: keyof Action, value: string) => {
    const action = form.actions?.[index];
    if (field === 'type' && value === 'list' && action?.type !== 'list') {
      setListOptions([{ id: 'opt_1', title: '', description: '', next_template_id: '' }]);
    }
    setForm(prev => ({
      ...prev,
      actions: prev.actions?.map((a, i) => i === index ? { ...a, [field]: value === '' ? undefined : value } : a)
    }));
  };

  const removeAction = (index: number) => {
    const actionType = form.actions?.[index]?.type;
    setForm(prev => ({
      ...prev,
      actions: prev.actions?.filter((_, i) => i !== index)
    }));
    if (actionType === 'list') {
      setListOptions([]);
    }
  };

  const addListOption = () => {
    if (listOptions.length >= 10) return;
    setListOptions(prev => [...prev, { id: `opt_${prev.length + 1}`, title: '', description: '', next_template_id: '' }]);
  };

  const updateListOption = (index: number, field: keyof ListOption, value: string) => {
    setListOptions(prev => prev.map((opt, i) => i === index ? { ...opt, [field]: value === '' ? undefined : value } : opt));
  };

  const removeListOption = (index: number) => {
    setListOptions(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop parcial para enfoque pero permitiendo ver el canvas */}
      <div 
        className="fixed inset-0 z-40 bg-slate-900/5 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="fixed top-0 right-0 z-50 h-full w-[450px] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300 ease-out">
        {/* Header Premium */}
        <div className="bg-slate-900 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400 mb-1 block">Editor de Módulo</span>
              <h2 className="text-xl font-black tracking-tight leading-none">
                {template ? template.name : 'Nueva Plantilla'}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Custom Tabs */}
          <div className="flex bg-slate-50 p-1 m-4 rounded-2xl border border-slate-100">
            <button 
              type="button" 
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'content' ? 'bg-white text-slate-900 shadow-sm shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              📝 Contenido
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'actions' ? 'bg-white text-slate-900 shadow-sm shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              ⚡ Respuesta
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar space-y-6">
            {activeTab === 'content' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Identificador (Nombre)</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-green-400/20 transition-all"
                      placeholder="Ej: Saludo Inicial"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Palabras Clave (Triggers)</label>
                    <input
                      value={form.trigger || ''}
                      onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-400/20 transition-all"
                      placeholder="hola, buenos días..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cuerpo del Mensaje</label>
                  <div className="relative">
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-3xl px-5 py-4 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-green-400/20 transition-all resize-none min-h-[160px]"
                      placeholder="Escribe aquí..."
                      required
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-300">
                      {form.content?.length || 0} chars
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                    <label className="text-[8px] font-black text-slate-400 uppercase whitespace-nowrap shrink-0">Cat</label>
                    <select
                      value={form.category || 'general'}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-700 focus:ring-0"
                    >
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                    <label className="text-[8px] font-black text-slate-400 uppercase whitespace-nowrap shrink-0">Flow</label>
                    <select
                      value={form.workflow || 'general'}
                      onChange={(e) => setForm({ ...form, workflow: e.target.value })}
                      className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-700 focus:ring-0"
                    >
                      {WORKFLOWS.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                    <label className="text-[8px] font-black text-slate-400 uppercase whitespace-nowrap shrink-0">Seg</label>
                    <select
                      value={form.segment}
                      onChange={(e) => setForm({ ...form, segment: e.target.value as any })}
                      className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-700 focus:ring-0"
                    >
                      <option value="todos">👥 Todos</option>
                      <option value="cliente">👤 Cliente</option>
                      <option value="prospecto">🔍 Prospecto</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                    <label className="text-[8px] font-black text-slate-400 uppercase whitespace-nowrap shrink-0">Srv</label>
                    <select
                      value={form.service_type || ''}
                      onChange={(e) => setForm({ ...form, service_type: e.target.value || undefined })}
                      className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-700 focus:ring-0"
                    >
                      <option value="">Ninguno</option>
                      {SERVICE_TYPES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-2xl">
                  {['text', 'buttons', 'list'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleResponseTypeChange(t as any)}
                      className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${responseType === t ? 'bg-white shadow-sm text-slate-900 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <span className="text-lg">{t === 'text' ? '💬' : t === 'buttons' ? '🔘' : '📋'}</span>
                      <span className="text-[8px] font-black uppercase tracking-tighter">{t}</span>
                    </button>
                  ))}
                </div>

                <div className="min-h-[200px]">
                  {responseType === 'buttons' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Config Botones</span>
                        <button type="button" onClick={addAction} disabled={(form.actions?.length || 0) >= 3} className="text-[10px] font-black text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg transition-all">+ ADD</button>
                      </div>
                      <div className="space-y-3">
                        {form.actions?.map((action, index) => (
                           <div key={index} className="group p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all relative">
                              <button type="button" onClick={() => removeAction(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-white shadow-sm rounded-full text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                              <input
                                value={action.title}
                                onChange={(e) => updateAction(index, 'title', e.target.value)}
                                placeholder="Título botón"
                                className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 mb-2"
                              />
                              <select
                                value={action.next_template_id || ''}
                                onChange={(e) => updateAction(index, 'next_template_id', e.target.value)}
                                className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-500 focus:ring-0"
                              >
                                <option value="">🔌 Sin conectar (Deshacer flecha)</option>
                                {allTemplates.filter(t => t.id !== form.id).map(t => <option key={t.id} value={t.id}>→ Enlazar a: {t.name}</option>)}
                              </select>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {responseType === 'list' && (
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Items de Lista</span>
                        <button type="button" onClick={addListOption} disabled={listOptions.length >= 10} className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-all">+ ITEM</button>
                      </div>
                      <div className="space-y-3">
                        {listOptions.map((opt, idx) => (
                          <div key={idx} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                value={opt.title}
                                onChange={(e) => updateListOption(idx, 'title', e.target.value)}
                                placeholder="Título (Ej: Facturación)"
                                className="flex-1 bg-white border border-blue-100 rounded-xl px-3 py-2 text-xs font-bold text-blue-900"
                              />
                              <button type="button" onClick={() => removeListOption(idx)} className="text-rose-400 text-sm">✕</button>
                            </div>
                            <select
                              value={opt.next_template_id || ''}
                              onChange={(e) => updateListOption(idx, 'next_template_id', e.target.value)}
                              className="w-full bg-white/50 border border-blue-50 rounded-lg px-3 py-1.5 text-[9px] font-bold text-blue-600"
                            >
                              <option value="">🔌 Detalle (Quitar flecha de enlace)</option>
                              {allTemplates.filter(t => t.id !== form.id).map(t => <option key={t.id} value={t.id}>→ Enlazar a: {t.name}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase">Estado</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                <span className="ml-3 text-xs font-black text-slate-700 uppercase">{form.is_active ? 'Activo' : 'OFF'}</span>
              </label>
            </div>
            <div className="flex gap-3">
              {template?.id && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Eliminar esta plantilla? Esta acción no se puede deshacer.')) {
                      onDelete(template.id);
                    }
                  }}
                  className="w-14 shrink-0 flex items-center justify-center bg-rose-50 text-rose-500 py-4 rounded-2xl font-black hover:bg-rose-100 hover:text-rose-600 active:scale-[0.98] transition-all"
                  title="Eliminar Plantilla"
                >
                  🗑️
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all"
              >
                Confirmar Cambios
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
