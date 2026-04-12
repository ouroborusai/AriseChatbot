'use client';

import { useState, useEffect } from 'react';
import { Template, Action, ListOption } from './types';
import { CATEGORIES, SERVICE_TYPES, WORKFLOWS } from './config';
import ActionEditor from './ActionEditor';

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
          if (listAction?.content) {
            try {
              setListOptions(JSON.parse(listAction.content));
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
        finalActions = [{ ...listAction, content: JSON.stringify(listOptions) }];
      }
    }

    onSave({ ...form, actions: finalActions });
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

                </div>
              </div>
            ) : (
              <ActionEditor
                actions={form.actions || []}
                onChangeActions={(actions) => setForm(prev => ({ ...prev, actions }))}
                listOptions={listOptions}
                onChangeListOptions={setListOptions}
                responseType={responseType}
                onChangeResponseType={handleResponseTypeChange}
                allTemplates={allTemplates}
                currentTemplateId={form.id || ''}
              />
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
