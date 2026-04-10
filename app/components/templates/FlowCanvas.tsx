'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
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

interface NodePosition {
  x: number;
  y: number;
}

interface FlowCanvasProps {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
}

const NODE_WIDTH = 180;
const NODE_BASE_HEIGHT = 90;
const COL_GAP = 240;
const ROW_GAP = 140;
const HEADER_HEIGHT = 80;

export default function FlowCanvas({ templates, selectedTemplateId, onSelectTemplate }: FlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Estado para nodos arrastrables
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});

  // Inicializar posiciones si no existen
  const initializePositions = useCallback(() => {
    if (Object.keys(nodePositions).length === 0) {
      const initial: Record<string, NodePosition> = {};
      templates.forEach((template, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        initial[template.id] = {
          x: 80 + col * COL_GAP,
          y: HEADER_HEIGHT + row * ROW_GAP,
        };
      });
      setNodePositions(initial);
    }
  }, [templates, nodePositions]);

  useMemo(() => { initializePositions(); }, [initializePositions]);

  // Calcular conexiones
  const connections = useMemo(() => {
    const conns: ConnectionLine[] = [];
    templates.forEach((template) => {
      const fromPos = nodePositions[template.id];
      if (!fromPos) return;

      template.actions?.forEach((action) => {
        if (action.next_template_id) {
          const toPos = nodePositions[action.next_template_id];
          if (toPos) {
            const cat = getCategoryInfo(template.category);
            conns.push({
              fromId: template.id,
              toId: action.next_template_id,
              fromX: fromPos.x + NODE_WIDTH,
              fromY: fromPos.y + NODE_BASE_HEIGHT / 2,
              toX: toPos.x,
              toY: toPos.y + NODE_BASE_HEIGHT / 2,
              label: action.title || 'Acción',
              color: cat.colorHex,
            });
          }
        }
      });
    });
    return conns;
  }, [templates, nodePositions]);

  const maxX = Math.max(...templates.map(t => (nodePositions[t.id]?.x || 0) + NODE_WIDTH + 200), 1000);
  const maxY = Math.max(...templates.map(t => (nodePositions[t.id]?.y || 0) + NODE_BASE_HEIGHT + 200), 600);

  // Zoom con scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    try { e.preventDefault(); } catch {}
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.3), 2.5));
  }, []);

  // Mover canvas
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && e.target === e.currentTarget) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
    if (draggingNode && nodePositions[draggingNode]) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const scaleAdjustedX = (e.clientX - rect.left - position.x) / scale;
        const scaleAdjustedY = (e.clientY - rect.top - position.y) / scale;
        setNodePositions(prev => ({
          ...prev,
          [draggingNode]: { x: scaleAdjustedX, y: scaleAdjustedY }
        }));
      }
    }
  }, [isDraggingCanvas, dragStart, draggingNode, position, scale, nodePositions]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);
    setDraggingNode(null);
  }, []);

  // Arrastrar nodo individual
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNode(nodeId);
  }, []);

  // Botones de zoom
  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 2.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev * 0.8, 0.3));
  const handleZoomReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  return (
    <div className="relative h-full">
      {/* Toolbar de zoom */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-white rounded-lg shadow-md border border-slate-200 p-1">
        <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center text-sm hover:bg-slate-100 rounded" title="Zoom out">➖</button>
        <span className="text-xs text-slate-500 w-12 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center text-sm hover:bg-slate-100 rounded" title="Zoom in">➕</button>
        <button onClick={handleZoomReset} className="w-8 h-8 flex items-center justify-center text-xs hover:bg-slate-100 rounded text-slate-500" title="Reset">⟲</button>
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-2 left-2 z-20 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded">
        🖱️ Arrastra el canvas para mover | 🎯 Click en nodo para selecionar | 📦 Arrastra nodos para repositionar | 🖱️ Scroll para zoom
      </div>

      <div 
        ref={containerRef}
        className="relative h-full overflow-hidden bg-slate-50 rounded-xl border border-slate-200 cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <div 
          className="absolute inset-0"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Grid de fondo */}
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
            <rect width={maxX} height={maxY} fill="url(#grid)" />
          </svg>

          {/* Líneas de conexión */}
          <svg className="absolute inset-0 pointer-events-none" width={maxX} height={maxY}>
            {connections.map((conn, idx) => {
              const midX = (conn.fromX + conn.toX) / 2;
              return (
                <g key={`${conn.fromId}-${conn.toId}-${idx}`}>
                  <path
                    d={`M ${conn.fromX} ${conn.fromY} Q ${midX} ${conn.fromY} ${midX} ${(conn.fromY + conn.toY) / 2} T ${conn.toX} ${conn.toY}`}
                    fill="none"
                    stroke={conn.color}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}
          </svg>

          {/* Nodos */}
          {templates.map((template) => {
            const pos = nodePositions[template.id];
            if (!pos) return null;
            
            const cat = getCategoryInfo(template.category);
            const isSelected = selectedTemplateId === template.id;
            const outgoingCount = template.actions?.filter(a => a.next_template_id).length || 0;

            return (
              <div
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                onMouseDown={(e) => handleNodeMouseDown(e, template.id)}
                className={`absolute cursor-pointer rounded-xl border-2 transition-shadow ${
                  isSelected 
                    ? 'border-green-500 shadow-lg shadow-green-200 z-10' 
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: NODE_WIDTH,
                  backgroundColor: 'white',
                }}
              >
                {/* Header con color */}
                <div 
                  className="px-3 py-2 rounded-t-lg flex items-center gap-2"
                  style={{ backgroundColor: cat.colorHex }}
                >
                  <span className="text-white text-sm">{cat.icon}</span>
                  <span className="text-white text-xs font-medium truncate flex-1">
                    {template.name}
                  </span>
                </div>

                {/* Contenido */}
                <div className="p-2">
                  <p className="text-xs text-slate-600 line-clamp-2 mb-1">
                    {template.content.slice(0, 50)}...
                  </p>
                  
                  {/* Acciones/Botones */}
                  {template.actions && template.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.actions.slice(0, 3).map((action, idx) => (
                        <span 
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded truncate max-w-[80px]"
                          title={action.title}
                        >
                          {action.title}
                        </span>
                      ))}
                      {template.actions.length > 3 && (
                        <span className="text-[10px] text-slate-400">
                          +{template.actions.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Indicador de conexiones */}
                {outgoingCount > 0 && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px]">
                    {outgoingCount}
                  </div>
                )}

                {/* Trigger */}
                {template.trigger && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                    🔑
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}