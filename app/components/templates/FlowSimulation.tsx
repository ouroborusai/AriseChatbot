'use client';

import { useState, useMemo } from 'react';
import { Template, Action } from './types';

interface FlowSimulationProps {
  templates: Template[];
}

type SimulationStep = {
  step: number;
  template: Template;
  userAction?: string;
  response: string;
};

export default function FlowSimulation({ templates }: FlowSimulationProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [simulation, setSimulation] = useState<SimulationStep[]>([]);
  const [customResponse, setCustomResponse] = useState('');
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  // Encontrar plantillas raíz (sin incoming)
  const rootTemplates = useMemo(() => {
    return templates.filter(t => {
      const hasIncomingConnection = templates.some(other => 
        other.actions?.some(a => a.next_template_id === t.id)
      );
      return !hasIncomingConnection;
    }).sort((a, b) => (a.priority || 50) - (b.priority || 50));
  }, [templates]);

  // Construir el árbol de niveles
  const templateLevels = useMemo(() => {
    const levels: Map<number, Template[]> = new Map();
    
    const calculateLevel = (nodeId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);
      
      const node = templates.find(t => t.id === nodeId);
      if (!node) return 0;
      
      const outgoing = node.actions?.filter(a => a.next_template_id) || [];
      if (outgoing.length === 0) return 0;
      
      let maxLevel = 0;
      outgoing.forEach(action => {
        if (action.next_template_id) {
          const childLevel = calculateLevel(action.next_template_id, new Set(visited));
          maxLevel = Math.max(maxLevel, childLevel + 1);
        }
      });
      
      return maxLevel;
    };
    
    templates.forEach(t => {
      const level = calculateLevel(t.id);
      if (!levels.has(level)) levels.set(level, []);
      levels.get(level)?.push(t);
    });
    
    return levels;
  }, [templates]);

  const startSimulation = (template: Template) => {
    setSelectedTemplateId(template.id);
    setCurrentStepIndex(0);
    setSimulation([{
      step: 0,
      template: template,
      response: template.content
    }]);
    setWaitingForResponse(false);
  };

  const nextStep = (action?: Action) => {
    if (!action?.next_template_id) {
      setWaitingForResponse(true);
      return;
    }
    
    const nextTemplate = templates.find(t => t.id === action.next_template_id);
    if (nextTemplate) {
      const newStep: SimulationStep = {
        step: simulation.length,
        template: nextTemplate,
        userAction: action.title,
        response: nextTemplate.content
      };
      setSimulation([...simulation, newStep]);
      setCurrentStepIndex(simulation.length);
    }
  };

  const resetSimulation = () => {
    setSelectedTemplateId(null);
    setCurrentStepIndex(0);
    setSimulation([]);
    setWaitingForResponse(false);
  };

  const currentStep = simulation[currentStepIndex];
  const currentActions = currentStep?.template.actions?.filter(a => a.next_template_id) || [];

  if (templates.length === 0) {
    return (
      <div className="card-base p-4">
        <p className="text-sm text-slate-500">No hay plantillas disponibles</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header con selector de inicio */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">▶️ Simular Conversación</h3>
          {simulation.length > 0 && (
            <button onClick={resetSimulation} className="text-xs text-slate-500 hover:text-slate-700">
              🔄 Reiniciar
            </button>
          )}
        </div>

        {!selectedTemplateId ? (
          <div>
            <p className="text-xs text-slate-500 mb-3">Selecciona por dónde empezar:</p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {rootTemplates.slice(0, 10).map(template => (
                <button
                  key={template.id}
                  onClick={() => startSimulation(template)}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-green-400 hover:bg-green-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{template.name}</span>
                    {(template.actions?.length || 0) > 0 && (
                      <span className="text-[10px] text-green-600">
                        {template.actions?.filter(a => a.next_template_id).length} →
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{template.content.slice(0, 40)}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Inicio:</span>
            <button onClick={resetSimulation} className="text-xs text-green-600 hover:underline">
              {currentStep?.template.name}
            </button>
            <span className="text-xs text-slate-400">→ {simulation.length} pasos</span>
          </div>
        )}
      </div>

      {/* Pasos de la simulación */}
      {simulation.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {simulation.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              const stepActions = step.template.actions?.filter(a => a.next_template_id) || [];
              
              return (
                <div
                  key={idx}
                  className={`rounded-xl border-2 transition-all ${
                    isActive 
                      ? 'border-green-400 bg-green-50 shadow-md' 
                      : isPast 
                        ? 'border-slate-200 bg-slate-50 opacity-70' 
                        : 'border-slate-100 bg-white'
                  }`}
                >
                  {/* Cabecera del paso */}
                  <div className={`px-4 py-2 rounded-t-lg flex items-center justify-between ${
                    isActive ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{step.template.name}</span>
                    </div>
                    {step.template.segment !== 'todos' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        step.template.segment === 'cliente' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {step.template.segment === 'cliente' ? '👤' : '🔍'}
                      </span>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-4">
                    {/* Si hubo acción del usuario */}
                    {step.userAction && (
                      <div className="mb-3 flex items-start gap-2">
                        <span className="text-blue-500 text-sm">👤</span>
                        <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">
                          {step.userAction}
                        </div>
                      </div>
                    )}
                    
                    {/* Respuesta del bot */}
                    <div className="mb-3 flex items-start gap-2">
                      <span className="text-green-500 text-sm">🤖</span>
                      <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 whitespace-pre-line">
                        {step.response}
                      </div>
                    </div>

                    {/* Acciones disponibles (solo para el paso activo) */}
                    {isActive && stepActions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-2">Selecciona una opción:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {stepActions.map((action, aIdx) => (
                            <button
                              key={aIdx}
                              onClick={() => nextStep(action)}
                              className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-green-400 hover:bg-green-50 text-sm transition"
                            >
                              {action.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Indicador de fin de flujo */}
                    {isActive && stepActions.length === 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 text-center">
                        <span className="text-xs text-slate-400">Fin del flujo</span>
                        <button
                          onClick={resetSimulation}
                          className="ml-2 text-xs text-green-600 hover:underline"
                        >
                          🔄 Nuevo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Panel de estado de conexión */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            📊 {templates.filter(t => t.actions?.some(a => a.next_template_id)).length} plantillas con acciones
          </span>
          <span className="text-slate-500">
            {rootTemplates.length} puntos de inicio
          </span>
        </div>
      </div>
    </div>
  );
}