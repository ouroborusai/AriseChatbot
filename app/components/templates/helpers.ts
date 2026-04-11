import { Category, ServiceType } from './types';
import { CATEGORIES, SERVICE_TYPES, WORKFLOWS } from './config';

/**
 * Funciones auxiliares para plantillas
 */

export function getCategoryInfo(catId: string): Category {
  return CATEGORIES.find(c => c.id === catId) || CATEGORIES[6];
}

export function getServiceInfo(serviceId?: string): ServiceType | undefined {
  return SERVICE_TYPES.find(s => s.id === serviceId);
}

export function getWorkflowInfo(workflowId?: string) {
  return WORKFLOWS.find(w => w.id === workflowId);
}
