export interface NavigationState {
  visitedTemplates: string[];
  redirectCount: number;
  lastTemplateId?: string;
}

export class NavigationService {
  /**
   * Crea un nuevo estado de navegación
   */
  static createInitialState(): NavigationState {
    return {
      visitedTemplates: [],
      redirectCount: 0,
    };
  }

  /**
   * Registra la visita a un template y detecta loops
   * @returns { hasLoop: boolean }
   */
  static recordVisit(templateId: string, state: NavigationState): { hasLoop: boolean } {
    state.visitedTemplates.push(templateId);
    state.lastTemplateId = templateId;

    // Detectar loop: si el template aparece más de 3 veces en el historial reciente
    const occurrences = state.visitedTemplates.filter(id => id === templateId).length;
    
    return {
      hasLoop: occurrences >= 3
    };
  }

  /**
   * Incrementa el contador de redirecciones
   * @returns { exceededLimit: boolean }
   */
  static incrementRedirect(state: NavigationState): { exceededLimit: boolean } {
    state.redirectCount++;
    return {
      exceededLimit: state.redirectCount > 5
    };
  }
}
