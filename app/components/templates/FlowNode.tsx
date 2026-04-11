'use client';

import { Template } from './types';
import { getCategoryInfo } from './helpers';
import React from 'react';

interface FlowNodeProps {
  template: Template;
  x: number;
  y: number;
  width: number;
  selected: boolean;
  onClick: (e: React.MouseEvent, id: string) => void;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  outgoingCount: number;
  incomingCount?: number;
}

const FlowNodeComponent: React.FC<FlowNodeProps> = ({
  template,
  x,
  y,
  width,
  selected,
  onClick,
  onMouseDown,
  outgoingCount,
  incomingCount = 0
}) => {
  const cat = getCategoryInfo(template.category);

  return (
    <div
      onClick={(e) => onClick(e, template.id)}
      onMouseDown={(e) => onMouseDown(e, template.id)}
      className={`absolute cursor-pointer rounded-2xl border transition-all duration-200 group ${
        selected
          ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] ring-4 ring-green-500/10 z-20 scale-[1.02]'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-xl hover:scale-[1.01] z-10'
      }`}
      style={{
        left: x,
        top: y,
        width: width,
        backgroundColor: 'white',
      }}
    >
      {/* Header con color dinámico */}
      <div
        className={`px-3 py-2 rounded-t-2xl flex items-center gap-2 transition-all duration-200 ${
          selected
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg'
            : cat.id === 'general'
              ? 'bg-slate-400'
              : cat.id === 'bienvenida'
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : cat.id === 'documentos'
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                  : cat.id === 'tramites'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                    : cat.id === 'cobranza'
                      ? 'bg-gradient-to-r from-red-400 to-red-500'
                      : cat.id === 'servicios'
                        ? 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                        : cat.colorHex
        }`}
      >
        <span className="text-white text-xs drop-shadow-sm">{cat.icon}</span>
        <span className="text-white text-[10px] font-black uppercase tracking-wider truncate flex-1 drop-shadow-sm">
          {template.name}
        </span>
        {template.is_active && (
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-sm" />
        )}
      </div>

      {/* Contenido Visual */}
      <div className="p-3">
        <p className="text-[10px] leading-relaxed text-slate-500 font-medium line-clamp-2 mb-2">
          {template.content}
        </p>

        {/* Conexiones / Acciones */}
        <div className="flex flex-wrap gap-1">
          {template.actions && template.actions.length > 0 ? (
            template.actions.slice(0, 2).map((action, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-md"
              >
                <span className={action.next_template_id ? 'text-green-500' : ''}>●</span>
                <span className="truncate max-w-[50px]">{action.title}</span>
              </div>
            ))
          ) : (
            <span className="text-[8px] text-slate-300 italic font-bold">Solo Texto</span>
          )}
          {template.actions && template.actions.length > 2 && (
            <span className="text-[8px] text-slate-400 font-black">+{template.actions.length - 2}</span>
          )}
        </div>
      </div>

      {/* Footer del Nodo: Info Técnica */}
      <div className="px-3 py-1.5 border-t border-slate-50 flex items-center justify-between">
        {template.trigger ? (
          <div className="flex items-center gap-1 text-[8px] font-black text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
            <span>🔑</span>
            <span className="truncate max-w-[60px]">{template.trigger}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400">
            <span>📊</span>
            <span>{cat.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {incomingCount > 0 && (
            <div className="flex items-center gap-0.5 text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              <span>←</span>
              <span>{incomingCount}</span>
            </div>
          )}
          <span className="text-[8px] font-black text-slate-300 uppercase">
            {template.id.slice(0, 5)}
          </span>
        </div>
      </div>

      {/* Puntos de conexión */}
      {outgoingCount > 0 && (
        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 border-2 border-white rounded-full shadow-sm transition-transform group-hover:scale-125" />
      )}
      {incomingCount > 0 && (
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 border-2 border-white rounded-full shadow-sm transition-transform group-hover:scale-125" />
      )}
    </div>
  );
};

export default React.memo(FlowNodeComponent);
