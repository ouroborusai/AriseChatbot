'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Template, Action } from './types';
import { getCategoryInfo } from './constants';

interface ConnectionLine {
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label: string;
  color: string;
}

interface FlowCanvasProps {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
}

export default function FlowCanvas({ templates, selectedTemplateId, onSelectTemplate }: FlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showExportMenu, setShowExportMenu] = useState(false);

  const NODE_WIDTH = 176;
  const NODE_BASE_HEIGHT = 100;
  const COL_GAP = 220;
  const ROW_GAP = 160;
  const HEADER_HEIGHT = 100;

  const templatePositions = templates.reduce((acc, template, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    acc[template.id] = {
      x: 80 + col * COL_GAP,
      y: HEADER_HEIGHT + row * ROW_GAP,
    };
    return acc;
  }, {} as Record<string, { x: number; y: number }>);

  const connections: ConnectionLine[] = [];
  
  templates.forEach((template) => {
    const fromPos = templatePositions[template.id];
    if (!fromPos) return;

    template.actions?.forEach((action) => {
      if (action.next_template_id) {
        const toPos = templatePositions[action.next_template_id];
        if (toPos) {
          const cat = getCategoryInfo(template.category);
          connections.push({
            fromId: template.id,
            toId: action.next_template_id,
            fromX: fromPos.x + NODE_WIDTH,
            fromY: fromPos.y + NODE_BASE_HEIGHT / 2,
            toX: toPos.x,
            toY: toPos.y + NODE_BASE_HEIGHT / 2,
            label: action.title,
            color: cat.colorHex,
          });
        }
      }
    });
  });

  const maxX = Math.max(...templates.map(t => (templatePositions[t.id]?.x || 0) + NODE_WIDTH + 100), 800);
  const maxY = Math.max(...templates.map(t => (templatePositions[t.id]?.y || 0) + NODE_BASE_HEIGHT + 100), 600);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    try {
      e.preventDefault();
    } catch {
      // Ignore passive event listener warning
    }
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.3), 2));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 2));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.3));

  const exportToPNG = async () => {
    if (!containerRef.current) return;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = maxX * 2;
      canvas.height = maxY * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, maxX, maxY);
      
      ctx.font = '14px system-ui';
      ctx.fillStyle = '#64748b';
      for (let i = 0; i < maxY; i += 100) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(maxX, i);
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();
      }
      for (let i = 0; i < maxX; i += 200) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, maxY);
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();
      }

      templates.forEach(template => {
        const pos = templatePositions[template.id];
        const cat = getCategoryInfo(template.category);
        
        ctx.fillStyle = cat.colorHex;
        ctx.beginPath();
        ctx.roundRect(pos.x, pos.y, NODE_WIDTH, NODE_BASE_HEIGHT, 8);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px system-ui';
        ctx.fillText(template.name, pos.x + 10, pos.y + 20);
      });

      connections.forEach(conn => {
        const isHighlight = selectedTemplateId === conn.fromId || selectedTemplateId === conn.toId;
        ctx.beginPath();
        ctx.moveTo(conn.fromX, conn.fromY);
        const midX = (conn.fromX + conn.toX) / 2;
        ctx.bezierCurveTo(midX, conn.fromY, midX, conn.toY, conn.toX, conn.toY);
        ctx.strokeStyle = isHighlight ? '#22c55e' : '#94a3b8';
        ctx.lineWidth = isHighlight ? 3 : 2;
        ctx.stroke();
      });

      const link = document.createElement('a');
      link.download = `flow-mtz-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const exportToJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      templates: templates.map(t => ({
        ...t,
        position: templatePositions[t.id],
        outgoing: t.actions?.filter(a => a.next_template_id).map(a => ({
          action: a.title,
          target: a.next_template_id,
        })),
      })),
      connections: connections.map(c => ({
        from: c.fromId,
        to: c.toId,
        label: c.label,
      })),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `flow-mtz-${new Date().toISOString().split('T')[0]}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <div className="relative h-full">
      {/* Toolbar */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-white rounded-xl shadow-lg border border-slate-200 p-1">
        <button onClick={zoomOut} className="p-2 hover:bg-slate-100 rounded-lg" title="Alejar">
          ➖
        </button>
        <span className="text-xs font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} className="p-2 hover:bg-slate-100 rounded-lg" title="Acercar">
          ➕
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <button onClick={resetView} className="p-2 hover:bg-slate-100 rounded-lg text-xs" title="Restablecer vista">
          🏠
        </button>
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)} 
            className="p-2 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1"
            title="Exportar"
          >
            📥 Exportar
          </button>
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[140px] z-30">
              <button onClick={exportToPNG} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2">
                🖼️ Exportar PNG
              </button>
              <button onClick={exportToJSON} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2">
                📄 Exportar JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="relative h-[600px] overflow-hidden bg-slate-50 rounded-xl border border-slate-200 cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute inset-0"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Grid */}
          <svg className="absolute inset-0 pointer-events-none" width={maxX} height={maxY}>
            <defs>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              </pattern>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
              <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
              </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Connections */}
          <svg className="absolute inset-0 pointer-events-none" width={maxX} height={maxY}>
            {connections.map((conn, i) => {
              const isHighlighted = selectedTemplateId === conn.fromId || selectedTemplateId === conn.toId;
              const midX = (conn.fromX + conn.toX) / 2;
              
              return (
                <g key={`${conn.fromId}-${conn.toId}-${i}`}>
                  <path
                    d={`M ${conn.fromX} ${conn.fromY} C ${midX} ${conn.fromY}, ${midX} ${conn.toY}, ${conn.toX} ${conn.toY}`}
                    fill="none"
                    stroke={isHighlighted ? '#22c55e' : '#cbd5e1'}
                    strokeWidth={isHighlighted ? 3 : 2}
                    markerEnd={isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                    opacity={isHighlighted ? 1 : 0.6}
                  />
                  {conn.label && (
                    <g>
                      <rect
                        x={midX - 35}
                        y={conn.fromY - 10}
                        width="70"
                        height="18"
                        rx="4"
                        fill="white"
                        stroke={conn.color}
                        strokeWidth="1"
                      />
                      <text
                        x={midX}
                        y={conn.fromY + 4}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#475569"
                        fontWeight="500"
                      >
                        {conn.label.slice(0, 15)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          <div className="relative" style={{ width: maxX, height: maxY }}>
            {templates.map((template) => {
              const pos = templatePositions[template.id];
              if (!pos) return null;

              const cat = getCategoryInfo(template.category);
              const isSelected = selectedTemplateId === template.id;

              return (
                <div
                  key={template.id}
                  onClick={(e) => { e.stopPropagation(); onSelectTemplate(template.id); }}
                  className={`absolute cursor-pointer transition-all duration-200 ${isSelected ? 'z-10' : ''}`}
                  style={{ left: pos.x, top: pos.y }}
                >
                  <div
                    className={`w-44 rounded-xl border-2 shadow-lg transition-all hover:scale-105 hover:shadow-xl ${
                      isSelected ? 'ring-4 ring-green-400 ring-offset-2' : ''
                    } ${!template.is_active ? 'opacity-50' : ''}`}
                    style={{ borderColor: cat.colorHex, backgroundColor: 'white' }}
                  >
                    <div
                      className="text-white text-xs px-3 py-2 rounded-t-lg flex items-center gap-2"
                      style={{ backgroundColor: cat.colorHex }}
                    >
                      <span>{cat.icon}</span>
                      <span className="truncate font-medium">{cat.name}</span>
                    </div>

                    <div className="p-3">
                      <p className="text-sm font-bold text-slate-900 truncate">{template.name}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.content}</p>

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

                    <div className="absolute -top-1 -right-1">
                      <div className={`w-3 h-3 rounded-full border-2 border-white ${template.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Help text */}
      <p className="text-xs text-slate-400 mt-2 text-center">
        🖱️ Arrastra para mover • 🔍 Scroll para zoom • Click en nodo para ver detalles
      </p>
    </div>
  );
}
