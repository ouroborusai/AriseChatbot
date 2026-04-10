/**
 * Condition Engine - Motor de evaluación de condiciones para templates WhatsApp
 *
 * Este módulo evalúa condiciones dinámicas para mostrar/ocultar acciones
 * y templates basados en el contexto del usuario.
 *
 * @module condition-engine
 */

import {
  Condition,
  ConditionField,
  ConditionOperator,
  Action,
  ActionConditions,
  ElseAction,
  Template,
  TemplateRule,
  TemplateContext,
  RequiredContext,
} from '../../app/components/templates/types';

/**
 * Resultado de evaluar una acción con condiciones
 */
export interface ActionEvaluationResult {
  /** La acción es visible y debe mostrarse */
  isVisible: boolean;
  /** Acción original (puede ser modificada con redirect) */
  action: Action;
  /** Acción alternativa si no se cumplen condiciones */
  elseAction?: ElseAction;
  /** Razón del resultado (para debugging) */
  reason?: string;
  /** Template de redirección si else_action es redirect */
  redirectTemplateId?: string;
}

/**
 * Resultado de evaluar reglas de un template
 */
export interface TemplateEvaluationResult {
  /** El template es válido para el contexto actual */
  isValid: boolean;
  /** Template a usar (puede ser fallback) */
  template: Template;
  /** Razón del resultado (para debugging) */
  reason?: string;
  /** Template de fallback si no se cumplen reglas */
  fallbackTemplateId?: string;
}

/**
 * Evalúa una condición individual contra el contexto
 *
 * @param condition - La condición a evaluar
 * @param context - El contexto actual del usuario
 * @returns boolean - true si la condición se cumple
 */
export function evaluateCondition(condition: Condition, context: TemplateContext): boolean {
  const { field, operator, value, customFn } = condition;

  // Si hay función personalizada, usarla directamente
  if (customFn) {
    try {
      return customFn(context);
    } catch (error) {
      console.error('[ConditionEngine] Error en customFn:', error);
      return false;
    }
  }

  // Obtener el valor del campo según el tipo
  let fieldValue: any;

  switch (field) {
    case 'segment':
      fieldValue = context.contact.segment;
      break;
    case 'has_documents':
      fieldValue = context.documents && context.documents.length > 0;
      break;
    case 'has_company':
      fieldValue = context.activeCompanyId !== null;
      break;
    case 'document_count':
      fieldValue = context.documents?.length || 0;
      break;
    case 'document_type':
      // Verificar si existe al menos un documento del tipo especificado
      const targetType = typeof value === 'string' ? value.toLowerCase() : '';
      fieldValue = context.documents?.some(d =>
        d.document_type?.toLowerCase() === targetType ||
        d.title.toLowerCase().includes(targetType)
      ) || false;
      break;
    case 'company_count':
      fieldValue = context.companies?.length || 0;
      break;
    case 'last_action':
      fieldValue = context.lastAction;
      break;
    case 'conversation_count':
      fieldValue = context.conversationHistory?.length || 0;
      break;
    case 'custom':
      // Para custom, el valor debe ser procesado por customFn
      return false;
    default:
      console.warn('[ConditionEngine] Campo desconocido:', field);
      return false;
  }

  // Evaluar según el operador
  return evaluateOperator(fieldValue, operator, value);
}

/**
 * Evalúa un operador contra un valor
 */
function evaluateOperator(
  fieldValue: any,
  operator: ConditionOperator,
  value?: string | number | boolean | string[]
): boolean {
  switch (operator) {
    case 'equals':
      return fieldValue === value;

    case 'not_equals':
      return fieldValue !== value;

    case 'greater_than':
      if (typeof fieldValue !== 'number' || typeof value !== 'number') return false;
      return fieldValue > value;

    case 'less_than':
      if (typeof fieldValue !== 'number' || typeof value !== 'number') return false;
      return fieldValue < value;

    case 'greater_or_equal':
      if (typeof fieldValue !== 'number' || typeof value !== 'number') return false;
      return fieldValue >= value;

    case 'less_or_equal':
      if (typeof fieldValue !== 'number' || typeof value !== 'number') return false;
      return fieldValue <= value;

    case 'includes':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(value as any);
      }
      if (typeof fieldValue === 'string' && typeof value === 'string') {
        return fieldValue.toLowerCase().includes(value.toLowerCase());
      }
      return false;

    case 'not_includes':
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(value as any);
      }
      if (typeof fieldValue === 'string' && typeof value === 'string') {
        return !fieldValue.toLowerCase().includes(value.toLowerCase());
      }
      return true;

    case 'exists':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== false;

    case 'not_exists':
      return fieldValue === null || fieldValue === undefined || fieldValue === false;

    default:
      console.warn('[ConditionEngine] Operador desconocido:', operator);
      return false;
  }
}

/**
 * Evalúa múltiples condiciones con lógica AND u OR
 *
 * @param conditions - Array de condiciones a evaluar
 * @param context - Contexto actual
 * @param logic - Lógica a aplicar (AND u OR)
 * @returns boolean - true si las condiciones se cumplen según la lógica
 */
export function evaluateMultipleConditions(
  conditions: Condition[],
  context: TemplateContext,
  logic: 'AND' | 'OR' = 'AND'
): boolean {
  if (!conditions || conditions.length === 0) {
    return true; // Sin condiciones = siempre true
  }

  const results = conditions.map(condition => {
    const result = evaluateCondition(condition, context);
    console.log(`[ConditionEngine] Condición ${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}: ${result}`);
    return result;
  });

  if (logic === 'AND') {
    return results.every(r => r === true);
  } else {
    return results.some(r => r === true);
  }
}

/**
 * Evalúa las condiciones de una acción y determina si es visible
 *
 * @param action - La acción a evaluar
 * @param context - Contexto actual del usuario
 * @returns ActionEvaluationResult - Resultado de la evaluación
 */
export function evaluateActionConditions(
  action: Action,
  context: TemplateContext
): ActionEvaluationResult {
  // Si no tiene condiciones, la acción es visible
  if (!action.conditions) {
    return {
      isVisible: true,
      action,
      reason: 'Sin condiciones - visible por defecto',
    };
  }

  const { show_if, logic = 'AND', else_action } = action.conditions;

  // Evaluar condiciones show_if
  const shouldShow = show_if
    ? evaluateMultipleConditions(show_if, context, logic)
    : true;

  if (shouldShow) {
    return {
      isVisible: true,
      action,
      reason: 'Condiciones cumplidas',
    };
  }

  // No se cumplieron las condiciones - aplicar else_action
  if (else_action) {
    switch (else_action.type) {
      case 'hide_button':
        return {
          isVisible: false,
          action,
          elseAction: else_action,
          reason: 'Condiciones no cumplidas - hide_button',
        };

      case 'show_message':
        // La acción se oculta pero se retorna mensaje alternativo
        return {
          isVisible: false,
          action,
          elseAction: else_action,
          reason: 'Condiciones no cumplidas - show_message',
        };

      case 'redirect':
        // Redirigir a otro template
        return {
          isVisible: false,
          action,
          elseAction: else_action,
          redirectTemplateId: else_action.redirect_template_id,
          reason: 'Condiciones no cumplidas - redirect',
        };
    }
  }

  // Sin else_action definido - ocultar por defecto
  return {
    isVisible: false,
    action,
    reason: 'Condiciones no cumplidas - sin else_action',
  };
}

/**
 * Filtra acciones visibles basadas en el contexto
 *
 * @param actions - Array de acciones a filtrar
 * @param context - Contexto actual
 * @returns Acciones que son visibles según las condiciones
 */
export function filterVisibleActions(
  actions: Action[],
  context: TemplateContext
): ActionEvaluationResult[] {
  const results: ActionEvaluationResult[] = [];

  for (const action of actions) {
    const evaluation = evaluateActionConditions(action, context);
    results.push(evaluation);
  }

  return results;
}

/**
 * Evalúa las reglas de un template
 *
 * @param template - Template a evaluar
 * @param context - Contexto actual
 * @returns TemplateEvaluationResult - Resultado de la evaluación
 */
export function evaluateTemplateRules(
  template: Template,
  context: TemplateContext
): TemplateEvaluationResult {
  // Si no tiene reglas, el template es válido
  if (!template.rules) {
    return {
      isValid: true,
      template,
      reason: 'Sin reglas - válido por defecto',
    };
  }

  const { required_context, fallback_template_id } = template.rules;

  if (required_context) {
    const contextValid = evaluateRequiredContext(required_context, context);

    if (!contextValid) {
      return {
        isValid: false,
        template,
        fallbackTemplateId: fallback_template_id,
        reason: 'Contexto requerido no cumplido',
      };
    }
  }

  return {
    isValid: true,
    template,
    reason: 'Reglas cumplidas',
  };
}

/**
 * Evalúa si el contexto requerido se cumple
 */
function evaluateRequiredContext(
  required: RequiredContext,
  context: TemplateContext
): boolean {
  // Verificar segmento
  if (required.required_segment) {
    if (context.contact.segment !== required.required_segment) {
      console.log('[ConditionEngine] Segmento no coincide:', context.contact.segment, '!=', required.required_segment);
      return false;
    }
  }

  // Verificar empresa
  if (required.has_company === true) {
    if (!context.activeCompanyId) {
      console.log('[ConditionEngine] Requiere empresa pero no hay activeCompanyId');
      return false;
    }
  }

  // Verificar documentos
  if (required.has_documents === true) {
    if (!context.documents || context.documents.length === 0) {
      console.log('[ConditionEngine] Requiere documentos pero no hay');
      return false;
    }
  }

  // Verificar cantidad mínima de documentos
  if (required.min_document_count !== undefined) {
    const docCount = context.documents?.length || 0;
    if (docCount < required.min_document_count) {
      console.log('[ConditionEngine] Documentos insuficientes:', docCount, '<', required.min_document_count);
      return false;
    }
  }

  // Verificar tipo de documento específico
  if (required.required_document_type) {
    const docType = required.required_document_type;
    const hasType = context.documents?.some(d =>
      d.document_type === docType ||
      d.title.toLowerCase().includes(docType.toLowerCase())
    );
    if (!hasType) {
      console.log('[ConditionEngine] No hay documentos del tipo:', docType);
      return false;
    }
  }

  return true;
}

/**
 * Convierte más de 3 botones a un mensaje de lista
 * WhatsApp permite máximo 3 botones, el resto debe ir en lista
 *
 * @param actions - Acciones a convertir
 * @returns Acciones convertidas (máx 3 botones + 1 lista si corresponde)
 */
export function convertButtonsToList(actions: Action[]): Action[] {
  // 1. Separar listas explícitas de botones
  const listActions = actions.filter(a => a.type === 'list');
  const buttonActions = actions.filter(a => a.type === 'button');

  // 2. Si hay al menos una lista explícita, priorizar esa lista y sus botones
  if (listActions.length > 0) {
    // Retornamos la primera lista y hasta 2 botones adicionales (WhatsApp permite 3 items totales en interactive)
    // Pero usualmente se prefiere enviar solo la lista si existe para evitar confusión
    return [listActions[0], ...buttonActions.slice(0, 2)];
  }

  // 3. Si no hay lista pero hay más de 3 botones, convertir el excedente
  if (buttonActions.length > 3) {
    const visibleButtons = buttonActions.slice(0, 2); // Dejamos 2 botones visibles
    const remainingButtons = buttonActions.slice(2);  // El resto a la lista

    const listFromButtons: Action = {
      type: 'list',
      id: 'more_options_list',
      title: 'Más opciones',
      content: JSON.stringify(remainingButtons.map(b => ({
        id: b.id,
        title: b.title,
        description: b.description || '',
      }))),
    };

    return [...visibleButtons, listFromButtons];
  }

  return actions;
}

/**
 * Obtiene acciones finales para enviar a WhatsApp
 * Aplica filtrado de condiciones y conversión a lista si corresponde
 *
 * @param actions - Acciones originales del template
 * @param context - Contexto actual
 * @returns Acciones procesadas listas para enviar
 */
export function getFinalActions(
  actions: Action[],
  context: TemplateContext
): {
  buttons: Action[];
  listAction?: Action;
  elseActions: ElseAction[];
  redirectTemplateId?: string;
} {
  const evaluations = filterVisibleActions(actions, context);

  const visibleActions: Action[] = [];
  const elseActions: ElseAction[] = [];
  let redirectTemplateId: string | undefined;

  // Procesar resultados de evaluación
  for (const evaluation of evaluations) {
    if (evaluation.isVisible) {
      // No incluimos show_document aquí porque se procesa antes en ActionService.executeActions
      if (evaluation.action.type !== 'show_document') {
        visibleActions.push(evaluation.action);
      }
    } else if (evaluation.elseAction) {
      elseActions.push(evaluation.elseAction);
      if (evaluation.elseAction.type === 'redirect' && evaluation.redirectTemplateId) {
        redirectTemplateId = evaluation.redirectTemplateId;
      }
    }
  }

  // Aplicar lógica de conversión si es necesario (limitar a lo que WhatsApp soporta)
  const processed = convertButtonsToList(visibleActions);
  
  const finalButtons = processed.filter(a => a.type === 'button');
  const listAction = processed.find(a => a.type === 'list');

  return {
    buttons: finalButtons,
    listAction,
    elseActions,
    redirectTemplateId,
  };
}

/**
 * Detecta posibles loops infinitos en la navegación
 *
 * @param templateId - ID del template actual
 * @param history - Historial de templates visitados
 * @param maxAttempts - Máximo de intentos permitidos
 * @returns boolean - true si hay loop detectado
 */
export function detectLoop(
  templateId: string,
  history: string[],
  maxAttempts: number = 3
): boolean {
  const count = history.filter(id => id === templateId).length;
  return count >= maxAttempts;
}
