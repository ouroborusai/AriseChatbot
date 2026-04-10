'use client';

import { useState, useMemo } from 'react';
import { Template } from './types';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [simulation, setSimulation] = useState<SimulationStep[]>([]);

  const rootTemplates = useMemo(() => {
    return templates.filter(t => {
      const hasIncomingConnection = templates.some(other => 
        other.actions?.some(a => a.next_template_id === t.id)
      );
      return !hasIncomingConnection;
    }).sort((a, b) => (a.priority || 50) - (b.priority || 50));
  }, [templates]);

  const startSimulation = (template: Template) => {
    setSelectedTemplateId(template.id);
    setCurrentStep(0);
    setSimulation([{
      step: 0,
      template: template,
      response: template.content
    }]);
  };

  const nextStep = () => {
    const current = simulation[currentStep];
    if (!current || !current.template.actions || current.template.actions.length === 0) {
      return;
    }

    const nextAction = current.template.actions[0];
    if (nextAction.next_template_id) {
      const nextTemplate = templates.find(t => t.id === nextAction.next_template_id);
      if (nextTemplate) {
        const newStep: SimulationStep = {
          step: simulation.length,
          template: nextTemplate,
          userAction: nextAction.title,
          response: nextTemplate.content
        };
        setSimulation([...simulation, newStep]);
        setCurrentStep(simulation.length);
      }
    }
  };

  const resetSimulation = () => {
    setSelectedTemplateId(null);
    setCurrentStep(0);
    setSimulation([]);
  };

  if (templates.length === 0) {
    return (
      <div className="card-base p-4">
        <p className="text-sm text-slate-500">No hay plantillas disponibles</p>
      </div>
    );
  }

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">🔄 Simulación de Flujos</h3>
        {selectedTemplateId && (
          <button onClick={resetSimulation} className="text-xs text-slate-500 hover:text-slate-700">
            Reiniciar
          </button>
        )}
      </div>

      {!selectedTemplateId ? (
        <>
          <p className="text-xs text-slate-500">Selecciona una plantilla inicial para simular el flujo:</p>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {rootTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => startSimulation(template)}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-green-400 hover:bg-green-50 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{template.name}</span>
                  <span className={`w-2 h-2 rounded-full ${template.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                </div>
                <p className="text-xs text-slate-500 truncate">{template.content.slice(0, 40)}...</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <span className="text-xs font-medium text-slate-500">Pasos: {currentStep + 1}/{simulation.length}</span>
            <div className="flex-1" />
            <button
              onClick={nextStep}
              disabled={currentStep >= simulation.length - 1 || !simulation[currentStep]?.template.actions?.length}
              className="text-xs px-2 py-1 bg-green-600 text-white rounded disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {simulation.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  idx === currentStep ? 'border-green-400 bg-green-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400">#{step.step + 1}</span>
                  <span className="text-sm font-medium text-slate-900">{step.template.name}</span>
                </div>
                {step.userAction && (
                  <div className="text-xs text-blue-600 mb-1">
                    ← Usuario: {step.userAction}
                  </div>
                )}
                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                  {step.response.slice(0, 100)}{step.response.length > 100 ? '...' : ''}
                </div>
                {step.template.actions && step.template.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {step.template.actions.map((action, aIdx) => (
                      <span key={aIdx} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {action.title}
                        {action.next_template_id && ' →'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}