'use client';

import { useState, useMemo } from 'react';
import { Template } from './types';
import { WORKFLOWS } from './config';

interface FlowMapProps {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
}

type FlowNode = Template & {
  level: number;
  parents: string[];
};

export default function FlowMap({ templates, selectedTemplateId, onSelectTemplate }: FlowMapProps) {
  const [segmentFilter, setSegmentFilter] = useState<'cliente' | 'prospecto' | 'todos'>('cliente');

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => 
      segmentFilter === 'todos' || 
      t.segment === segmentFilter || 
      t.segment === 'todos'
    );
  }, [templates, segmentFilter]);

  // Construir el árbol de flujos
  const flowTree = useMemo(() => {
    const nodes: Map<string, FlowNode> = new Map();
    const edges: { from: string; to: string; label: string; fromLevel: number; toLevel: number }[] = [];

    // Agregar todos los nodos
    filteredTemplates.forEach(t => {
      nodes.set(t.id, { ...t, level: 0, parents: [] });
    });

    // Calcular niveles
    const calculateLevel = (nodeId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);
      
      const node = nodes.get(nodeId);
      if (!node) return 0;

      let allTargets: string[] = [];
      node.actions?.forEach(action => {
        if (action.next_template_id) allTargets.push(action.next_template_id);
        if (action.type === 'list' && action.description) {
          try {
            const opts = JSON.parse(action.description);
            opts.forEach((o: any) => { if (o.next_template_id) allTargets.push(o.next_template_id); });
          } catch {}
        }
      });

      if (allTargets.length === 0) return 0;

      let maxLevel = 0;
      allTargets.forEach(targetId => {
        if (nodes.has(targetId)) {
          const childLevel = calculateLevel(targetId, new Set(visited));
          maxLevel = Math.max(maxLevel, childLevel + 1);
        }
      });

      return maxLevel;
    };

    // Encontrar nodos raíz
    const rootNodes = filteredTemplates.filter(t => {
      const hasIncoming = filteredTemplates.some(other => {
        let targets: string[] = [];
        other.actions?.forEach(a => {
          if (a.next_template_id) targets.push(a.next_template_id);
          if (a.type === 'list' && a.description) {
            try {
              const opts = JSON.parse(a.description);
              opts.forEach((o: any) => { if (o.next_template_id) targets.push(o.next_template_id); });
            } catch {}
          }
        });
        return targets.includes(t.id);
      });
      return !hasIncoming;
    });

    // Calcular niveles desde raíces
    rootNodes.forEach(root => {
      calculateLevel(root.id);
    });

    // Asignar niveles a todos los nodos
    const leveledNodes = new Map<string, FlowNode>();
    nodes.forEach((node, id) => {
      const level = calculateLevel(id);
      leveledNodes.set(id, { ...node, level });
    });

    // Construir bordes
    filteredTemplates.forEach(t => {
      const fromLevel = leveledNodes.get(t.id)?.level || 0;
      t.actions?.forEach(action => {
        if (action.next_template_id && leveledNodes.has(action.next_template_id)) {
          const toLevel = leveledNodes.get(action.next_template_id)?.level || 0;
          edges.push({ 
            from: t.id, 
            to: action.next_template_id, 
            label: action.title || 'Botón',
            fromLevel,
            toLevel 
          });
        }
        if (action.type === 'list' && action.description) {
          try {
            const opts = JSON.parse(action.description);
            opts.forEach((o: any) => {
              if (o.next_template_id && leveledNodes.has(o.next_template_id)) {
                const toLevel = leveledNodes.get(o.next_template_id)?.level || 0;
                edges.push({
                  from: t.id,
                  to: o.next_template_id,
                  label: o.title || 'Opción',
                  fromLevel,
                  toLevel
                });
              }
            });
          } catch {}
        }
      });
    });

    return { nodes: leveledNodes, edges };
  }, [filteredTemplates]);

  // Agrupar por nivel
  const levels = useMemo(() => {
    const result: Map<number, FlowNode[]> = new Map();
    flowTree.nodes.forEach(node => {
      const level = node.level;
      if (!result.has(level)) result.set(level, []);
      result.get(level)?.push(node);
    });
    return Array.from(result.entries()).sort((a, b) => a[0] - b[0]);
  }, [flowTree]);

  const getWorkflowColor = (workflowId?: string) => {
    const wf = WORKFLOWS.find(w => w.id === workflowId);
    return wf?.colorHex || '#64748b';
  };

  if (filteredTemplates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">No hay plantillas para mostrar</p>
      </div>
    );
  }

  // Encontrar conexiones para cada nivel
  const getConnectionsForLevel = (level: number) => {
    return flowTree.edges.filter(e => e.fromLevel === level);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filtro simple */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-200 bg-white">
        <span className="text-sm font-medium text-slate-700">Ver flujo para:</span>
        <div className="flex gap-1">
          {[
            { id: 'cliente', label: '👤 Clientes' },
            { id: 'prospecto', label: '🔍 Prospectos' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setSegmentFilter(opt.id as 'cliente' | 'prospecto')}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                segmentFilter === opt.id 
                  ? 'bg-green-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-slate-400">{levels.length} niveles</span>
      </div>

      {/* Mapa mental horizontal con scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-12 min-w-max pb-4">
          {levels.map(([level, nodes]) => (
            <div key={level} className="flex flex-col items-center min-w-[200px]">
              {/* Header del nivel */}
              <div className="mb-3 px-4 py-1.5 bg-slate-100 rounded-full">
                <span className="text-xs font-semibold text-slate-600">
                  {level === 0 ? '🎯 INICIO' : `Nivel ${level}`}
                </span>
              </div>

              {/* Nodos de este nivel */}
              <div className="flex flex-col gap-4 w-full">
                {nodes.sort((a, b) => (a.priority || 50) - (b.priority || 50)).map(node => {
                  const isSelected = selectedTemplateId === node.id;
                  const color = getWorkflowColor(node.workflow);

                  let outgoingCount = node.actions?.filter(a => a.next_template_id).length || 0;
                  node.actions?.forEach(a => {
                    if (a.type === 'list' && a.description) {
                      try {
                        const opts = JSON.parse(a.description);
                        outgoingCount += opts.filter((o: any) => o.next_template_id).length;
                      } catch {}
                    }
                  });

                  const incomingCount = flowTree.edges.filter(e => e.to === node.id).length;

                  return (
                    <div
                      key={node.id}
                      onClick={() => onSelectTemplate(node.id)}
                      className={`w-full p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                        isSelected 
                          ? 'border-green-500 bg-green-50 shadow-green-200' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {node.name}
                        </span>
                        {!node.is_active && (
                          <span className="text-[10px] bg-slate-100 text-slate-400 px-1 rounded">Inactivo</span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                        {node.content.slice(0, 50)}...
                      </p>

                      {/* Acciones/botones */}
                      {node.actions && node.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {node.actions.slice(0, 4).map((action, idx) => (
                            <span 
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded truncate max-w-[90px]"
                              title={action.title}
                            >
                              {action.title}
                            </span>
                          ))}
                          {node.actions.length > 4 && (
                            <span className="text-[10px] text-slate-400">
                              +{node.actions.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Indicadores de flujo */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                        {outgoingCount > 0 && (
                          <span className="text-[10px] text-green-600 font-medium">
                            ➔ {outgoingCount}
                          </span>
                        )}
                        {incomingCount > 0 && (
                          <span className="text-[10px] text-blue-600 font-medium">
                            ⬅ {incomingCount}
                          </span>
                        )}
                        {node.trigger && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">
                            🔑
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Líneas de conexión hacia siguiente nivel */}
              {level < levels.length - 1 && getConnectionsForLevel(level).length > 0 && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-slate-300" />
                  <div className="text-xs text-slate-400 mt-1">
                    {getConnectionsForLevel(level).length} ➔
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda de workflows */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex flex-wrap gap-4 justify-center">
          {WORKFLOWS.map(w => (
            <div key={w.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.colorHex }} />
              <span className="text-xs text-slate-500">{w.icon} {w.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}