'use client';

import { Template, Category, Action } from './types';
import { getCategoryInfo } from './constants';

interface FlowNodeProps {
  template: Template;
  x: number;
  y: number;
  selected: boolean;
  onClick: () => void;
  incomingConnections: { from: Template; action: Action }[];
}

export default function FlowNode({ template, x, y, selected, onClick, incomingConnections }: FlowNodeProps) {
  const cat = getCategoryInfo(template.category);

  return (
    <div
      onClick={onClick}
      className="absolute cursor-pointer transition-all duration-200"
      style={{ left: x, top: y }}
    >
      <div
        className={`w-44 rounded-xl border-2 shadow-lg transition-all hover:scale-105 ${
          selected ? 'ring-4 ring-green-400 ring-offset-2' : ''
        } ${!template.is_active ? 'opacity-50' : ''}`}
        style={{ borderColor: cat.colorHex, backgroundColor: 'white' }}
      >
        {/* Header con categoría */}
        <div
          className="text-white text-xs px-3 py-2 rounded-t-lg flex items-center gap-2"
          style={{ backgroundColor: cat.colorHex }}
        >
          <span>{cat.icon}</span>
          <span className="truncate font-medium">{cat.name}</span>
        </div>

        {/* Contenido */}
        <div className="p-3">
          <p className="text-sm font-bold text-slate-900 truncate">{template.name}</p>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.content}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {template.trigger && (
              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                🔑 {template.trigger}
              </span>
            )}
            {template.segment !== 'todos' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                template.segment === 'cliente' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {template.segment === 'cliente' ? '👤' : '🔍'}
              </span>
            )}
          </div>
        </div>

        {/* Botones */}
        {template.actions && template.actions.length > 0 && (
          <div className="px-3 pb-3">
            <div className="flex flex-wrap gap-1">
              {template.actions.slice(0, 4).map((action, i) => (
                <span
                  key={i}
                  className={`text-[10px] px-2 py-1 rounded-full flex items-center gap-1 ${
                    action.next_template_id ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span>{action.title}</span>
                  {action.next_template_id && <span className="font-bold">→</span>}
                </span>
              ))}
              {template.actions.length > 4 && (
                <span className="text-[10px] text-slate-400 py-1">+{template.actions.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Indicador de estado */}
        <div className="absolute -top-1 -right-1">
          <div className={`w-3 h-3 rounded-full border-2 border-white ${template.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
        </div>
      </div>

      {/* Conexiones entrantes */}
      {incomingConnections.length > 0 && (
        <div className="absolute -left-32 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <div className="flex flex-col gap-0.5">
            {incomingConnections.slice(0, 3).map(({ from, action }, i) => (
              <div key={i} className="text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5 shadow-sm whitespace-nowrap flex items-center gap-1">
                <span className="text-slate-400">←</span>
                <span className="text-slate-600 truncate max-w-[80px]">{action.title}</span>
              </div>
            ))}
            {incomingConnections.length > 3 && (
              <div className="text-[10px] text-slate-400 text-center">+{incomingConnections.length - 3} más</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
