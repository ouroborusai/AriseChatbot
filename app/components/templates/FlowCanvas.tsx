'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Template, Action } from './types';
import { getCategoryInfo } from './helpers';
import FlowNode from './FlowNode';

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

// Clave para localStorage
const STORAGE_KEY = 'mtz_template_positions';

export default function FlowCanvas({ templates, selectedTemplateId, onSelectTemplate }: FlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Estado para nodos arrastrables
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const [hasLoadedPositions, setHasLoadedPositions] = useState(false);

  // Refs para rastrear coordenadas de eventos que no necesitan re-render inmediato
  const nodeDragOffset = useRef({ x: 0, y: 0 });
  const nodeClickStart = useRef({ x: 0, y: 0 });

  // Cargar posiciones guardadas en localStorage (solo una vez al montar)
  useEffect(() => {
    if (hasLoadedPositions || templates.length === 0) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setNodePositions(parsed);
        setHasLoadedPositions(true);
        return;
      }
    } catch (e) {
      console.warn('[FlowCanvas] Error cargando posiciones:', e);
    }

    // Si no hay guardado o falló, usar posiciones por defecto
    const defaultPositions: Record<string, NodePosition> = {};
    templates.forEach((template, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      defaultPositions[template.id] = {
        x: 80 + col * COL_GAP,
        y: HEADER_HEIGHT + row * ROW_GAP,
      };
    });
    setNodePositions(defaultPositions);
    setHasLoadedPositions(true);
  }, []); // Solo ejecutar al montar, no cuando cambian templates

  // Guardar posiciones en localStorage cuando cambien
  useEffect(() => {
    if (hasLoadedPositions && Object.keys(nodePositions).length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nodePositions));
      } catch (e) {
        console.warn('[FlowCanvas] Error guardando posiciones:', e);
      }
    }
  }, [nodePositions, hasLoadedPositions]);

  // Solo agregar nuevos nodos que no existían (no reorganizar los existentes)
  useEffect(() => {
    if (!hasLoadedPositions) return;

    setNodePositions((prev) => {
      const nextPositions = { ...prev };
      let hasChanges = false;

      templates.forEach((template) => {
        if (!nextPositions[template.id]) {
          hasChanges = true;
          // Buscar posición cercana no ocupada
          const existingCount = Object.keys(nextPositions).length;
          const col = existingCount % 4;
          const row = Math.floor(existingCount / 4);
          nextPositions[template.id] = {
            x: 80 + col * COL_GAP,
            y: HEADER_HEIGHT + row * ROW_GAP,
          };
        }
      });

      return hasChanges ? nextPositions : prev;
    });
  }, []); // Solo verificar una vez, no en cada cambio de templates

  // Calcular conexiones
  const connections = useMemo(() => {
    const conns: ConnectionLine[] = [];
    templates.forEach((template) => {
      const fromPos = nodePositions[template.id];
      if (!fromPos) return;

      template.actions?.forEach((action) => {
        const cat = getCategoryInfo(template.category);

        // 1. Conexiones de botones directos
        if (action.next_template_id) {
          const toPos = nodePositions[action.next_template_id];
          if (toPos) {
            conns.push({
              fromId: template.id,
              toId: action.next_template_id,
              fromX: fromPos.x + NODE_WIDTH,
              fromY: fromPos.y + NODE_BASE_HEIGHT / 2,
              toX: toPos.x,
              toY: toPos.y + NODE_BASE_HEIGHT / 2,
              label: action.title || 'Botón',
              color: cat.colorHex,
            });
          }
        }

        // 2. Conexiones desde opciones de lista
        if (action.type === 'list' && action.description) {
          try {
            const listOptions = JSON.parse(action.description) as any[];
            listOptions.forEach((opt: any) => {
              if (opt.next_template_id) {
                const toPos = nodePositions[opt.next_template_id];
                if (toPos) {
                  conns.push({
                    fromId: template.id,
                    toId: opt.next_template_id,
                    fromX: fromPos.x + NODE_WIDTH,
                    fromY: fromPos.y + NODE_BASE_HEIGHT / 2,
                    toX: toPos.x,
                    toY: toPos.y + NODE_BASE_HEIGHT / 2,
                    label: opt.title || 'Opción',
                    color: cat.colorHex,
                  });
                }
              }
            });
          } catch (e) {
            // Ignorar errores de parseo
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
        const pixelLocalX = e.clientX - rect.left - position.x - nodeDragOffset.current.x;
        const pixelLocalY = e.clientY - rect.top - position.y - nodeDragOffset.current.y;
        
        const scaleAdjustedX = pixelLocalX / scale;
        const scaleAdjustedY = pixelLocalY / scale;
        
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
    const rect = e.currentTarget.getBoundingClientRect();
    nodeDragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    nodeClickStart.current = { x: e.clientX, y: e.clientY };
    setDraggingNode(nodeId);
  }, []);

  const handleNodeClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    const dx = Math.abs(e.clientX - nodeClickStart.current.x);
    const dy = Math.abs(e.clientY - nodeClickStart.current.y);
    if (dx > 5 || dy > 5) {
      return; // Fue un arrastre, no un click
    }
    onSelectTemplate(nodeId);
  }, [onSelectTemplate]);

  // Botones de zoom
  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 2.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev * 0.8, 0.3));
  const handleZoomReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  // Auto-organizar nodos en formato de flujo
  const handleAutoLayout = useCallback(() => {
    // 1. Construir grafo de dependencias
    const incoming: Map<string, number> = new Map();
    const children: Map<string, string[]> = new Map();

    templates.forEach(t => {
      incoming.set(t.id, 0);
      children.set(t.id, []);
    });

    templates.forEach(t => {
      t.actions?.forEach(action => {
        // Conexiones directas de botones
        if (action.next_template_id && incoming.has(action.next_template_id)) {
          incoming.set(action.next_template_id, (incoming.get(action.next_template_id) || 0) + 1);
          children.get(t.id)?.push(action.next_template_id);
        }
        // Conexiones de listas
        if (action.type === 'list' && action.description) {
          try {
            const opts = JSON.parse(action.description);
            opts.forEach((opt: any) => {
              if (opt.next_template_id && incoming.has(opt.next_template_id)) {
                incoming.set(opt.next_template_id, (incoming.get(opt.next_template_id) || 0) + 1);
                children.get(t.id)?.push(opt.next_template_id);
              }
            });
          } catch {}
        }
      });
    });

    // 2. Asignar niveles (BFS desde raíces)
    const levels: Map<string, number> = new Map();
    const queue: string[] = [];

    // Raíces = nodos sin incoming
    incoming.forEach((count, id) => {
      if (count === 0) {
        levels.set(id, 0);
        queue.push(id);
      }
    });

    // Si no hay raíces (ciclo), empezar con el primero
    if (queue.length === 0 && templates.length > 0) {
      levels.set(templates[0].id, 0);
      queue.push(templates[0].id);
    }

    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];
      const currentLevel = levels.get(current) || 0;

      children.get(current)?.forEach(child => {
        if (!levels.has(child)) {
          levels.set(child, currentLevel + 1);
          queue.push(child);
        }
      });
    }

    // 3. Agrupar por niveles
    const levelGroups: Map<number, string[]> = new Map();
    levels.forEach((level, id) => {
      if (!levelGroups.has(level)) levelGroups.set(level, []);
      levelGroups.get(level)?.push(id);
    });

    // 4. Calcular posiciones
    const newPositions: Record<string, NodePosition> = {};
    const maxLevel = Math.max(...Array.from(levelGroups.keys()), 0);
    const levelHeight = ROW_GAP;
    const totalWidth = Math.max(...Array.from(levelGroups.values()).map(g => g.length), 1) * COL_GAP;

    levelGroups.forEach((nodeIds, level) => {
      const y = HEADER_HEIGHT + level * levelHeight;
      const levelWidth = nodeIds.length * COL_GAP;
      const startX = (totalWidth - levelWidth) / 2 + COL_GAP / 2;

      nodeIds.forEach((id, idx) => {
        newPositions[id] = {
          x: startX + idx * COL_GAP,
          y,
        };
      });
    });

    // Animación suave de transición
    setNodePositions(newPositions);
    setPosition({ x: 0, y: 0 });
    setScale(1);
  }, [templates]);

  return (
    <div className="relative h-full">
      {/* Toolbar de controles */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-2">
        {/* Zoom */}
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-md border border-slate-200 p-1">
          <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center text-sm hover:bg-slate-100 rounded" title="Zoom out">➖</button>
          <span className="text-xs text-slate-500 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center text-sm hover:bg-slate-100 rounded" title="Zoom in">➕</button>
          <button onClick={handleZoomReset} className="w-8 h-8 flex items-center justify-center text-xs hover:bg-slate-100 rounded text-slate-500" title="Reset">⟲</button>
        </div>

        {/* Auto Layout */}
        <button
          onClick={handleAutoLayout}
          className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-2 rounded-lg shadow-md hover:from-indigo-600 hover:to-purple-600 transition-all text-xs font-bold"
          title="Organizar nodos automáticamente en formato de flujo"
        >
          <span>✨</span>
          <span>Auto</span>
        </button>
      </div>

      {/* Instrucciones + Leyenda */}
      <div className="absolute bottom-2 left-2 z-20 space-y-2">
        {/* Controles */}
        <div className="text-xs text-slate-400 bg-white/80 px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
          <span className="font-black">🎮 Controles:</span>
          <span className="ml-2">🖱️ Arrastra = Mover</span>
          <span className="mx-1">|</span>
          <span>🎯 Click = Seleccionar</span>
          <span className="mx-1">|</span>
          <span>📦 Drag = Reposicionar</span>
          <span className="mx-1">|</span>
          <span>🖱️ Scroll = Zoom</span>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (confirm('¿Resetear posiciones de todos los nodos? Se perderá tu organización actual.')) {
                localStorage.removeItem(STORAGE_KEY);
                setHasLoadedPositions(false);
                window.location.reload();
              }
            }}
            className="text-xs bg-white/90 hover:bg-white text-slate-600 px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition-all font-medium"
          >
            🔄 Reset Posiciones
          </button>
        </div>

        {/* Leyenda de Colores */}
        <div className="text-xs bg-white/90 px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
          <span className="font-black text-slate-500">📊 Categorías:</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-green-500 to-green-600"></span>
              <span className="text-slate-600">Bienvenida</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="text-slate-600">Documentos</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-slate-600">Trámites</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-slate-600">Cobranza</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <span className="text-slate-600">General</span>
            </span>
          </div>
        </div>

        {/* Estados */}
        <div className="text-xs bg-white/90 px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
          <span className="font-black text-slate-500">💡 Estados:</span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-slate-600">Activo</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              <span className="text-slate-600">Inactivo</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-green-500"></span>
              <span className="text-slate-600">Conexión</span>
            </span>
          </div>
        </div>
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
            <defs>
              {/* Gradientes para cada color de categoría */}
              <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#16a34a" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-orange" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fb923c" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#9333ea" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f87171" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-slate" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#475569" stopOpacity="1" />
              </linearGradient>
            </defs>

            {connections.map((conn, idx) => {
              const midX = (conn.fromX + conn.toX) / 2;
              const controlY1 = conn.fromY + (conn.toY - conn.fromY) * 0.4;
              const controlY2 = conn.fromY + (conn.toY - conn.fromY) * 0.6;

              // Determinar gradiente según color
              let gradientId = 'grad-slate';
              if (conn.color.includes('22c55e') || conn.color.includes('16a34a') || conn.color.includes('green')) gradientId = 'grad-green';
              else if (conn.color.includes('fb923c') || conn.color.includes('ea580c') || conn.color.includes('orange')) gradientId = 'grad-orange';
              else if (conn.color.includes('c084fc') || conn.color.includes('9333ea') || conn.color.includes('purple')) gradientId = 'grad-purple';
              else if (conn.color.includes('f87171') || conn.color.includes('dc2626') || conn.color.includes('red')) gradientId = 'grad-red';

              return (
                <g key={`${conn.fromId}-${conn.toId}-${idx}`}>
                  {/* Sombra suave */}
                  <path
                    d={`M ${conn.fromX} ${conn.fromY} C ${midX} ${conn.fromY}, ${midX} ${conn.toY}, ${conn.toX} ${conn.toY}`}
                    fill="none"
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="drop-shadow-sm"
                  />
                  {/* Línea principal con gradiente */}
                  <path
                    d={`M ${conn.fromX} ${conn.fromY} C ${midX} ${conn.fromY}, ${midX} ${conn.toY}, ${conn.toX} ${conn.toY}`}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="6,4"
                    markerEnd="url(#arrowhead)"
                    className="transition-all duration-300"
                  />
                  {/* Label de la conexión */}
                  {conn.label && conn.label.length <= 20 && (
                    <g>
                      <rect
                        x={midX - conn.label.length * 3.5}
                        y={(conn.fromY + conn.toY) / 2 - 10}
                        width={conn.label.length * 7 + 8}
                        height={18}
                        rx={4}
                        fill="white"
                        opacity={0.9}
                      />
                      <text
                        x={midX}
                        y={(conn.fromY + conn.toY) / 2 + 3}
                        textAnchor="middle"
                        className="text-[10px] font-bold fill-slate-600"
                        style={{ fontSize: '10px' }}
                      >
                        {conn.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodos */}
          {templates.map((template) => {
            const pos = nodePositions[template.id];
            if (!pos) return null;

            const isSelected = selectedTemplateId === template.id;

            // Calcular conexiones salientes
            let outgoingCount = template.actions?.filter(a => a.next_template_id).length || 0;
            template.actions?.forEach(a => {
              if (a.type === 'list' && a.description) {
                try {
                  const opts = JSON.parse(a.description);
                  outgoingCount += opts.filter((o: any) => o.next_template_id).length;
                } catch {}
              }
            });

            // Calcular conexiones entrantes
            const incomingCount = templates.filter(t => {
              // Verificar acciones directas
              const hasDirectConnection = t.actions?.some(a => a.next_template_id === template.id);
              if (hasDirectConnection) return true;

              // Verificar conexiones en listas
              const hasListConnection = t.actions?.some(a => {
                if (a.type !== 'list' || !a.description) return false;
                try {
                  const opts = JSON.parse(a.description);
                  return opts.some((o: any) => o.next_template_id === template.id);
                } catch { return false; }
              });
              return hasListConnection;
            }).length;

            return (
              <FlowNode
                key={template.id}
                template={template}
                x={pos.x}
                y={pos.y}
                width={NODE_WIDTH}
                selected={isSelected}
                onClick={handleNodeClick}
                onMouseDown={handleNodeMouseDown}
                outgoingCount={outgoingCount}
                incomingCount={incomingCount}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}