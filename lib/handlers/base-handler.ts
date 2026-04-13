/**
 * BaseHandler - Clase base para todos los handlers del sistema
 *
 * Proporciona métodos comunes para acceso a datos del contexto
 * y evaluación de condiciones.
 *
 * @module base-handler
 */

import { getSupabaseAdmin } from '../supabase-admin';
import {
  TemplateContext,
  Condition,
  Action,
  Template,
} from '../../app/components/templates/types';
import {
  Contact,
  Company,
  ClientDocument,
  Message,
} from '../types';
import {
  evaluateCondition,
  evaluateMultipleConditions,
  filterVisibleActions,
  getFinalActions,
} from '@/lib/services/condition-engine';

/**
 * Documento con tipo inferido (Extiende ClientDocument para soportar document_type)
 */
export interface TypedDocument extends ClientDocument {
  document_type?: string;
}

/**
 * Resultado de operación de handler
 */
export interface BaseHandlerResult {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Clase base para handlers
 *
 * Proporciona métodos comunes para:
 * - Acceso a documentos filtrados por tipo
 * - Verificación de existencia de documentos
 * - Verificación de empresa activa
 * - Conteo de empresas
 * - Evaluación de condiciones
 */
export abstract class BaseHandler {
  protected context: TemplateContext;

  constructor(context: TemplateContext) {
    this.context = context;
  }

  /**
   * Registra una respuesta del asistente en el historial y base de datos
   * @param text Texto de la respuesta
   * @param conversationId ID de la conversación
   */
  async saveAssistantResponse(text: string, conversationId: string): Promise<void> {
    try {
      const { saveMessage } = await import('../database-service');
      await saveMessage(conversationId, 'assistant', text);
    } catch (error) {
      console.error('[BaseHandler] Error al guardar respuesta del asistente:', error);
    }
  }

  /**
   * Obtiene el contexto actual
   */
  getContext(): TemplateContext {
    return this.context;
  }

  /**
   * Actualiza el contexto (útil para cambios en runtime)
   */
  updateContext(partial: Partial<TemplateContext>): void {
    this.context = { ...this.context, ...partial };
  }

  /**
   * Obtiene documentos filtrados por tipo
   *
   * @param type - Tipo de documento a buscar (iva, renta, balance, liquidacion, etc.)
   * @returns Array de documentos del tipo especificado
   */
  async getDocumentsByType(type: string): Promise<TypedDocument[]> {
    const typeLower = type.toLowerCase().trim();

    try {
      const { data, error } = await getSupabaseAdmin()
        .from('client_documents')
        .select('*')
        .eq('contact_id', this.context.contact.id)
        .eq('company_id', this.context.activeCompanyId || null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[BaseHandler] Error al obtener documentos:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Filtrar por tipo (coincidencia parcial en título o tipo explícito)
      return data.filter(doc => {
        const titleLower = doc.title.toLowerCase();
        const docType = doc.document_type?.toLowerCase() || '';

        return (
          docType === typeLower ||
          titleLower.includes(typeLower) ||
          titleLower.includes(typeLower.replace('s', '')) // Plurales
        );
      }).map(doc => ({
        ...doc,
        document_type: doc.document_type || this.inferDocumentType(doc.title),
      }));
    } catch (error) {
      console.error('[BaseHandler] Excepción en getDocumentsByType:', error);
      return [];
    }
  }

  /**
   * Infiere el tipo de documento basado en el título
   */
  private inferDocumentType(title: string): string {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('iva') || titleLower.includes('f29')) return 'iva';
    if (titleLower.includes('renta') || titleLower.includes('f22')) return 'renta';
    if (titleLower.includes('balance')) return 'balance';
    if (titleLower.includes('liquidacion') || titleLower.includes('sueldo')) return 'liquidacion';
    if (titleLower.includes('contrato')) return 'contrato';
    if (titleLower.includes('certificado')) return 'certificado';

    return 'general';
  }

  /**
   * Verifica si el contacto tiene documentos disponibles
   *
   * @param type - Tipo específico opcional
   * @returns true si tiene documentos
   */
  async hasDocuments(type?: string): Promise<boolean> {
    if (type) {
      const docs = await this.getDocumentsByType(type);
      return docs.length > 0;
    }

    try {
      const { data, error } = await getSupabaseAdmin()
        .from('client_documents')
        .select('id')
        .eq('contact_id', this.context.contact.id)
        .eq('company_id', this.context.activeCompanyId || null)
        .limit(1);

      if (error) {
        console.error('[BaseHandler] Error en hasDocuments:', error);
        return false;
      }

      return data !== null && data.length > 0;
    } catch (error) {
      console.error('[BaseHandler] Excepción en hasDocuments:', error);
      return false;
    }
  }

  /**
   * Obtiene la cantidad de documentos disponibles
   *
   * @param type - Tipo específico opcional
   * @returns Cantidad de documentos
   */
  async getDocumentCount(type?: string): Promise<number> {
    if (type) {
      const docs = await this.getDocumentsByType(type);
      return docs.length;
    }

    try {
      const { count, error } = await getSupabaseAdmin()
        .from('client_documents')
        .select('*', { count: 'exact', head: true })
        .eq('contact_id', this.context.contact.id)
        .eq('company_id', this.context.activeCompanyId || null);

      if (error) {
        console.error('[BaseHandler] Error en getDocumentCount:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[BaseHandler] Excepción en getDocumentCount:', error);
      return 0;
    }
  }

  /**
   * Verifica si hay una empresa activa seleccionada
   *
   * @returns true si hay empresa activa
   */
  hasActiveCompany(): boolean {
    return this.context.activeCompanyId !== null;
  }

  /**
   * Obtiene la cantidad de empresas vinculadas al contacto
   *
   * @returns Cantidad de empresas
   */
  getCompanyCount(): number {
    return this.context.companies?.length || 0;
  }

  /**
   * Obtiene la empresa activa
   *
   * @returns Datos de la empresa activa o null
   */
  getActiveCompany(): { id: string; legal_name: string } | null {
    if (!this.context.activeCompanyId) {
      return null;
    }

    return this.context.companies.find(c => c.id === this.context.activeCompanyId) || null;
  }

  /**
   * Verifica si el contacto es cliente (vs prospecto)
   *
   * @returns true si es cliente
   */
  isClient(): boolean {
    return this.context.contact.segment === 'cliente';
  }

  /**
   * Verifica si el contacto es prospecto
   *
   * @returns true si es prospecto
   */
  isProspect(): boolean {
    return this.context.contact.segment === 'prospecto';
  }

  /**
   * Evalúa una condición individual
   *
   * @param condition - Condición a evaluar
   * @returns Resultado de la evaluación
   */
  evaluateCondition(condition: Condition): boolean {
    return evaluateCondition(condition, this.context);
  }

  /**
   * Evalúa múltiples condiciones con lógica AND u OR
   *
   * @param conditions - Condiciones a evaluar
   * @param logic - Lógica (AND u OR)
   * @returns true si se cumplen las condiciones
   */
  evaluateConditions(conditions: Condition[], logic: 'AND' | 'OR' = 'AND'): boolean {
    return evaluateMultipleConditions(conditions, this.context, logic);
  }

  /**
   * Filtra acciones visibles basadas en condiciones
   *
   * @param actions - Acciones a filtrar
   * @returns Acciones filtradas con información de evaluación
   */
  filterActions(actions: Action[]) {
    return filterVisibleActions(actions, this.context);
  }

  /**
   * Obtiene acciones finales procesadas para enviar a WhatsApp
   *
   * @param actions - Acciones originales
   * @returns Objeto con botones, lista y acciones else
   */
  getFinalActions(actions: Action[]) {
    return getFinalActions(actions, this.context);
  }

  /**
   * Obtiene el historial de acciones recientes
   *
   * @param limit - Límite de acciones a retornar
   * @returns Array de últimas acciones
   */
  getRecentActions(limit: number = 5): string[] {
    const history = this.context.conversationHistory || [];
    const actions: string[] = [];

    for (let i = history.length - 1; i >= 0 && actions.length < limit; i--) {
      const content = history[i].content;
      if (content.startsWith('[button:')) {
        const actionId = content.replace('[button:', '').replace(']', '');
        actions.push(actionId);
      }
    }

    return actions;
  }

  /**
   * Obtiene la última acción realizada
   *
   * @returns ID de la última acción o null
   */
  getLastAction(): string | null {
    return this.context.lastAction;
  }

  /**
   * Verifica si se realizó una acción específica recientemente
   *
   * @param actionId - ID de la acción a buscar
   * @param lookback - Cantidad de acciones hacia atrás para buscar
   * @returns true si la acción se encontró
   */
  wasActionPerformed(actionId: string, lookback: number = 5): boolean {
    const recent = this.getRecentActions(lookback);
    return recent.includes(actionId);
  }

  /**
   * Construye contexto enriquecido con datos de la DB
   * Este método es útil para actualizar el contexto antes de evaluar
   */
  async enrichContext(): Promise<void> {
    // Actualizar documentos
    const { data: docs } = await getSupabaseAdmin()
      .from('client_documents')
      .select('id, title, file_name, created_at')
      .eq('contact_id', this.context.contact.id)
      .eq('company_id', this.context.activeCompanyId || null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (docs) {
      this.context.documents = docs.map(d => ({
        id: d.id,
        title: d.title,
        file_name: d.file_name,
        document_type: this.inferDocumentType(d.title),
        created_at: d.created_at,
      }));
    }

    // Actualizar última acción desde el historial
    const lastAction = this.getLastAction();
    if (!lastAction) {
      const recent = this.getRecentActions(1);
      if (recent.length > 0) {
        this.context.lastAction = recent[0];
      }
    }
  }
}

/**
 * Crea un contexto vacío para inicialización
 */
export function createEmptyContext(): TemplateContext {
  return {
    contact: { id: '', phone_number: '' },
    companies: [],
    activeCompanyId: null,
    documents: [],
    serviceRequests: [],
    lastAction: null,
    conversationHistory: [],
    redirectCount: 0,
    customVariables: {},
  };
}

/**
 * Construye contexto completo desde datos de la DB
 */
export async function buildContext(
  phoneNumber: string,
  contactId: string,
  conversationId: string
): Promise<TemplateContext> {
  const context = createEmptyContext();

  // Obtener contacto
  const { data: contact } = await getSupabaseAdmin()
    .from('contacts')
    .select('id, name, phone_number, segment')
    .eq('id', contactId)
    .single();

  if (contact) {
    context.contact = contact;
  }

  // Obtener empresas mediante tabla relacional (SSOT)
  const { data: companiesRel } = await getSupabaseAdmin()
    .from('contact_companies')
    .select(`
      companies (
        id,
        legal_name,
        rut,
        metadata
      )
    `)
    .eq('contact_id', contactId);

  if (companiesRel) {
    context.companies = (companiesRel as any[])
      .map(r => r.companies)
      .filter(Boolean)
      .map(c => ({
        id: c.id,
        legal_name: c.legal_name,
        tax_id: c.rut, // Mapear rut a tax_id para retrocompatibilidad con el tipo TemplateContext
        metadata: c.metadata || {}
      }));
  }

  // Obtener empresa activa
  const { data: conversation } = await getSupabaseAdmin()
    .from('conversations')
    .select('active_company_id')
    .eq('id', conversationId)
    .single();

  if (conversation) {
    context.activeCompanyId = conversation.active_company_id || null;
  }

  // Obtener documentos
  const { data: docs } = await getSupabaseAdmin()
    .from('client_documents')
    .select('id, title, file_name, created_at')
    .eq('contact_id', contactId)
    .eq('company_id', context.activeCompanyId || null)
    .order('created_at', { ascending: false });

  if (docs) {
    context.documents = docs.map(d => ({
      id: d.id,
      title: d.title,
      file_name: d.file_name,
      document_type: inferDocumentType(d.title),
      created_at: d.created_at,
    }));
  }

  // Obtener historial
  const { data: messages } = await getSupabaseAdmin()
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(50);

  if (messages) {
    context.conversationHistory = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      created_at: m.created_at,
    }));
  }

  // Última acción
  const lastAction = getLastActionFromHistory(context.conversationHistory);
  context.lastAction = lastAction;

  return context;
}

/**
 * Helper para inferir tipo de documento
 */
function inferDocumentType(title: string): string {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('iva') || titleLower.includes('f29')) return 'iva';
  if (titleLower.includes('renta') || titleLower.includes('f22')) return 'renta';
  if (titleLower.includes('balance')) return 'balance';
  if (titleLower.includes('liquidacion') || titleLower.includes('sueldo')) return 'liquidacion';
  if (titleLower.includes('contrato')) return 'contrato';
  if (titleLower.includes('certificado')) return 'certificado';

  return 'general';
}

/**
 * Extrae la última acción del historial
 */
function getLastActionFromHistory(history: Array<{ role: string; content: string }>): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const content = history[i].content;
    if (content.startsWith('[button:')) {
      return content.replace('[button:', '').replace(']', '');
    }
    if (content.startsWith('[list:')) {
      return content.replace('[list:', '').replace(']', '');
    }
  }
  return null;
}
