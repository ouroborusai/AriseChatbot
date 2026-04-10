'use client';

import { Template, Action } from './types';
import { getCategoryInfo, getServiceInfo } from './constants';

interface TemplateDetailPanelProps {
  template: Template | null;
  allTemplates: Template[];
  onCopy: (template: Template) => void;
  onEdit: (template: Template) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  copiedId: string | null;
}

export default function TemplateDetailPanel({
  template,
  allTemplates,
  onCopy,
  onEdit,
  onToggleActive,
  onDelete,
  copiedId,
}: TemplateDetailPanelProps) {
  if (!template) {
    return (
      <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl border-l border-slate-200 z-50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📝</span>
          <h3 className="font-semibold text-slate-900">Detalles</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-[calc(100%-60px)] text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl mb-3">
            👆
          </div>
          <p className="text-sm text-slate-500 font-medium">Selecciona una plantilla</p>
          <p className="text-xs text-slate-400 mt-1">
            Haz clic en cualquier plantilla para ver sus detalles
          </p>
        </div>
      </div>
    );
  }

  const cat = getCategoryInfo(template.category);
  const service = getServiceInfo(template.service_type);
  const connectedTemplates = template.actions
    ?.filter(a => a.next_template_id)
    .map(a => allTemplates.find(t => t.id === a.next_template_id))
    .filter(Boolean) as Template[] | undefined;

  const incomingConnections = allTemplates
    .filter(t => t.actions?.some(a => a.next_template_id === template.id))
    .map(t => {
      const action = t.actions!.find(a => a.next_template_id === template.id)!;
      return { from: t, action };
    });

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl border-l border-slate-200 z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <h3 className="font-semibold text-slate-900">Detalles</h3>
        </div>
        <button onClick={() => window.location.reload()} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: cat.colorHex }}
          >
            {cat.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{template.name}</h3>
            <p className="text-xs text-slate-500">{cat.name}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${template.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-slate-900">{template.priority}</p>
            <p className="text-[10px] text-slate-500">Prioridad</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-slate-900">{template.actions?.length || 0}</p>
            <p className="text-[10px] text-slate-500">Botones</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-1">Mensaje</p>
          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-line">
            {template.content}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {template.trigger && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              🔑 {template.trigger}
            </span>
          )}
          {service && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
              {service.icon} {service.name}
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded-full ${
            template.segment === 'cliente' ? 'bg-blue-100 text-blue-700' :
            template.segment === 'prospecto' ? 'bg-purple-100 text-purple-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {template.segment === 'cliente' ? '👤 Cliente' :
             template.segment === 'prospecto' ? '🔍 Prospecto' : '👥 Todos'}
          </span>
        </div>

        {connectedTemplates && connectedTemplates.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Conecta a →</p>
            <div className="space-y-1">
              {connectedTemplates.map((t, i) => {
                const tCat = getCategoryInfo(t.category);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs bg-green-50 rounded-lg px-2 py-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tCat.colorHex }} />
                    <span className="flex-1 truncate">{t.name}</span>
                    <span className="text-green-600 font-medium">→</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {incomingConnections.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Recibido de ←</p>
            <div className="space-y-1">
              {incomingConnections.map(({ from, action }, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg px-2 py-1.5">
                  <span className="text-blue-600 font-medium">←</span>
                  <span className="flex-1 truncate">{from.name}</span>
                  <span className="text-slate-400">({action.title})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={() => onCopy(template)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            {copiedId === template.id ? (
              <><span>✅</span> Copiado</>
            ) : (
              <><span>📋</span> Copiar</>
            )}
          </button>
          <button
            onClick={() => onEdit(template)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <span>✏️</span> Editar
          </button>
          <button
            onClick={() => onToggleActive(template.id)}
            className={`flex items-center justify-center gap-1 px-3 py-2 text-xs border rounded-lg transition ${
              template.is_active
                ? 'border-green-300 text-green-600 hover:bg-green-50'
                : 'border-slate-300 text-slate-400 hover:bg-slate-50'
            }`}
          >
            {template.is_active ? <><span>🟢</span> Activo</> : <><span>⚪</span> Inactivo</>}
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="flex items-center justify-center px-3 py-2 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}