'use client';

import { useState, useEffect } from 'react';
import { Template, Action } from './types';
import { CATEGORIES, SERVICE_TYPES } from './constants';

interface TemplateEditorProps {
  template: Template | null;
  allTemplates: Template[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Partial<Template>) => void;
}

export default function TemplateEditor({ template, allTemplates, isOpen, onClose, onSave }: TemplateEditorProps) {
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
  });

  useEffect(() => {
    if (template) {
      setForm({ ...template });
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
      });
    }
  }, [template, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.content) return;
    onSave(form);
  };

  const addAction = () => {
    setForm(prev => ({
      ...prev,
      actions: [...(prev.actions || []), { type: 'button', id: '', title: '', next_template_id: '' }]
    }));
  };

  const updateAction = (index: number, field: keyof Action, value: string) => {
    setForm(prev => ({
      ...prev,
      actions: prev.actions?.map((a, i) => i === index ? { ...a, [field]: value } : a)
    }));
  };

  const removeAction = (index: number) => {
    setForm(prev => ({
      ...prev,
      actions: prev.actions?.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {template ? '✏️ Editar Plantilla' : '➕ Nueva Plantilla'}
            </h2>
            <p className="text-sm text-slate-500">Configura el mensaje y los botones de respuesta</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <span className="text-xl">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
                placeholder="Ej: Saludo IVA"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Disparador (trigger)
              </label>
              <input
                value={form.trigger || ''}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
                placeholder="hola, iva, pago"
              />
              <p className="text-[10px] text-slate-400 mt-1">Palabras que disparan esta plantilla</p>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mensaje <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none resize-none"
              rows={5}
              placeholder="Escribe el mensaje... Usa {variable} para variables"
              required
            />
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Servicio</label>
              <select
                value={form.service_type || ''}
                onChange={(e) => setForm({ ...form, service_type: e.target.value || undefined })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="">Sin especificar</option>
                {SERVICE_TYPES.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Segmento</label>
              <select
                value={form.segment}
                onChange={(e) => setForm({ ...form, segment: e.target.value as any })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="todos">👥 Todos</option>
                <option value="cliente">👤 Clientes</option>
                <option value="prospecto">🔍 Prospectos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                min={1}
                max={100}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-slate-900">Botones de Respuesta</h3>
                <p className="text-xs text-slate-500">Configura los botones interactivos que tendrá este mensaje</p>
              </div>
              <button
                type="button"
                onClick={addAction}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                + Agregar
              </button>
            </div>

            <div className="space-y-3">
              {form.actions && form.actions.length > 0 ? (
                form.actions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                    <div className="w-20">
                      <select
                        value={action.type}
                        onChange={(e) => updateAction(index, 'type', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                      >
                        <option value="button">Botón</option>
                        <option value="list">Lista</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        value={action.id}
                        onChange={(e) => updateAction(index, 'id', e.target.value)}
                        placeholder="ID (ej: btn_iva)"
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        value={action.title}
                        onChange={(e) => updateAction(index, 'title', e.target.value)}
                        placeholder="Título (ej: 🧾 Ver IVA)"
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <select
                        value={action.next_template_id || ''}
                        onChange={(e) => updateAction(index, 'next_template_id', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                      >
                        <option value="">Sin conectar</option>
                        {allTemplates
                          .filter(t => t.id !== form.id)
                          .map(t => (
                            <option key={t.id} value={t.id}>
                              → {t.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAction(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm">
                  <p>No hay botones configurados</p>
                  <p className="text-xs mt-1">Esta plantilla se mostrará como texto plano</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-slate-700">Plantilla activa</span>
            </label>
            <span className="text-xs text-slate-400">
              {form.is_active ? 'Esta plantilla se usará en el flujo' : 'No se usará en respuestas automáticas'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
            >
              {template ? '💾 Actualizar' : '➕ Guardar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
