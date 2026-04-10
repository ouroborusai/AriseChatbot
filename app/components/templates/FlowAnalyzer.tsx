'use client';

import { useMemo } from 'react';
import { Template } from './types';
import { WORKFLOWS } from './types';

interface FlowAnalyzerProps {
  templates: Template[];
}

type FlowNode = {
  template: Template;
  connections: { actionTitle: string; targetName: string; targetId: string }[];
  incoming: number;
};

export default function FlowAnalyzer({ templates }: FlowAnalyzerProps) {
  const flowData = useMemo(() => {
    const nodes: Map<string, FlowNode> = new Map();
    
    templates.forEach(t => {
      nodes.set(t.id, {
        template: t,
        connections: [],
        incoming: 0
      });
    });
    
    templates.forEach(t => {
      t.actions?.forEach(action => {
        if (action.next_template_id) {
          const target = nodes.get(action.next_template_id);
          if (target) {
            target.incoming++;
            nodes.get(t.id)?.connections.push({
              actionTitle: action.title || 'Acción',
              targetName: target.template.name,
              targetId: action.next_template_id
            });
          }
        }
      });
    });
    
    const workflowGroups = new Map<string, FlowNode[]>();
    WORKFLOWS.forEach(w => {
      workflowGroups.set(w.id, []);
    });
    
    nodes.forEach(node => {
      const wf = node.template.workflow || 'general';
      if (!workflowGroups.has(wf)) {
        workflowGroups.set(wf, []);
      }
      workflowGroups.get(wf)?.push(node);
    });
    
    return { nodes, workflowGroups };
  }, [templates]);

  const orphanTemplates = useMemo(() => {
    return templates.filter(t => {
      const hasOutgoing = t.actions?.some(a => a.next_template_id);
      const hasIncoming = templates.some(other => 
        other.actions?.some(a => a.next_template_id === t.id)
      );
      return !hasOutgoing && !hasIncoming;
    });
  }, [templates]);

  const templatesWithIssues = useMemo(() => {
    return templates.filter(t => {
      const brokenConnections = t.actions?.filter(a => 
        a.next_template_id && !templates.find(ft => ft.id === a.next_template_id)
      ) || [];
      return brokenConnections.length > 0;
    });
  }, [templates]);

  const getWorkflowColor = (workflowId: string) => {
    const wf = WORKFLOWS.find(w => w.id === workflowId);
    return wf?.colorHex || '#64748b';
  };

  if (templates.length === 0) {
    return <div className="card-base p-4"><p className="text-sm text-slate-500">No hay plantillas</p></div>;
  }

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">🔍 Análisis de Flujos</h3>
        <span className="text-xs text-slate-500">{templates.length} plantillas</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-lg font-bold text-slate-900">{templates.filter(t => t.actions?.length).length}</p>
          <p className="text-[10px] text-slate-500">Con acciones</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-lg font-bold text-slate-900">{templates.filter(t => t.trigger).length}</p>
          <p className="text-[10px] text-slate-500">Con trigger</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-lg font-bold text-slate-900">{orphanTemplates.length}</p>
          <p className="text-[10px] text-slate-500">Sin conexión</p>
        </div>
      </div>

      {/* Broken Connections */}
      {templatesWithIssues.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-red-700 mb-2">⚠️ Conexiones rotas:</h4>
          {templatesWithIssues.map(t => {
            const broken = t.actions?.filter(a => a.next_template_id && !templates.find(ft => ft.id === a.next_template_id)) || [];
            return (
              <div key={t.id} className="text-xs text-red-600">
                • {t.name}: {broken.map(a => a.next_template_id).join(', ')}
              </div>
            );
          })}
        </div>
      )}

      {/* Workflow Groups */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {Array.from(flowData.workflowGroups.entries()).map(([workflowId, nodes]) => {
          if (nodes.length === 0) return null;
          const wf = WORKFLOWS.find(w => w.id === workflowId);
          
          return (
            <div key={workflowId} className="border border-slate-200 rounded-lg overflow-hidden">
              <div 
                className="px-3 py-2 text-sm font-medium text-white flex items-center gap-2"
                style={{ backgroundColor: getWorkflowColor(workflowId) }}
              >
                <span>{wf?.icon}</span>
                <span>{wf?.name}</span>
                <span className="opacity-75 text-xs">({nodes.length})</span>
              </div>
              <div className="divide-y divide-slate-100">
                {nodes.sort((a, b) => (a.template.priority || 50) - (b.template.priority || 50)).map(node => (
                  <div key={node.template.id} className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">{node.template.name}</span>
                      <div className="flex items-center gap-2">
                        {node.template.trigger && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                            🔑 {node.template.trigger}
                          </span>
                        )}
                        {node.incoming > 0 && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            ← {node.incoming}
                          </span>
                        )}
                        {node.connections.length > 0 && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            → {node.connections.length}
                          </span>
                        )}
                      </div>
                    </div>
                    {node.connections.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {node.connections.map((conn, idx) => (
                          <span key={idx} className="text-[10px] text-slate-500">
                            {conn.actionTitle} → {conn.targetName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}