import { getSupabaseAdmin } from '../supabase-admin';
import { 
  getLatestClientDocuments, 
  getServiceRequestsForContact 
} from '../database-service';
import { 
  Contact, 
  Company, 
  ClientDocument, 
  ServiceRequest 
} from '../types';
import { TemplateContext } from '@/app/components/templates/types';

export class ContextService {
  /**
   * Construye el contexto completo para una conversación, incluyendo datos de contacto,
   * empresas vinculadas, documentos y estado actual de navegación.
   */
  static async buildContext(
    contact: Contact,
    companies: Company[],
    activeCompanyId: string | null,
    conversationId: string
  ): Promise<TemplateContext> {
    try {
      const displayName = contact.name || contact.phone_number || 'cliente';
      console.log(`[ContextService] 🏗️ Construyendo contexto para ${displayName}...`);
      
      // 1. Obtener documentos recientes (Blindado)
      let documents: ClientDocument[] = [];
      try {
        documents = await getLatestClientDocuments(contact.id);
      } catch (e) {
        console.warn('[ContextService] ⚠️ No se pudieron cargar documentos:', e);
      }

      // 2. Determinar segmento efectivo (Lógica industrial: si tiene empresas es CLIENTE)
      const hasCompanies = (companies || []).length > 0;
      const currentSegment = contact.segment || 'prospecto';
      let effectiveSegment = hasCompanies ? 'cliente' : currentSegment;

      // Sincronizar segmento en DB si hay cambio a cliente
      if (hasCompanies && currentSegment !== 'cliente' && contact.id) {
        console.log(`[ContextService] 📈 Promocionando a ${contact.name} como CLIENTE`);
        await getSupabaseAdmin()
          .from('contacts')
          .update({ segment: 'cliente' })
          .eq('id', contact.id);
      }

      // 3. Obtener solicitudes de servicio (Blindado)
      let serviceRequests: ServiceRequest[] = [];
      try {
        serviceRequests = await getServiceRequestsForContact(contact.id);
      } catch (e) {
        console.warn('[ContextService] ⚠️ No se pudieron cargar solicitudes:', e);
      }

      // 4. Obtener historial (Necesario para TemplateContext)
      const { data: messages } = await getSupabaseAdmin()
        .from('messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20);

      const conversationHistory = (messages || []).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        created_at: m.created_at
      }));

      // Inferencia de última acción
      const lastAction = this.getLastActionFromHistory(conversationHistory);

      const result: TemplateContext = {
        contact: {
          ...contact,
          segment: effectiveSegment as any,
        },
        companies: (companies || []).map(c => ({
          id: c.id,
          legal_name: c.legal_name,
          tax_id: c.rut || (c as any).rut || 'RUT no disponible',
          metadata: c.metadata || {},
        })),
        activeCompanyId,
        documents,
        serviceRequests,
        lastAction,
        conversationHistory,
        redirectCount: 0,
        customVariables: contact.metadata || {},
      };

      console.log(`[ContextService] ✅ Contexto listo: ${(result.contact.segment || 'prospecto').toUpperCase()}`);
      return result;

    } catch (globalError: any) {
      console.error('[ContextService] ❌ ERROR CRÍTICO:', globalError.message);
      // Fallback mínimo de emergencia 100% compatible con TemplateContext
      return {
        contact: { ...contact, segment: 'prospecto' as any },
        companies: [],
        activeCompanyId: null,
        documents: [],
        serviceRequests: [],
        lastAction: null,
        conversationHistory: [],
        redirectCount: 0,
        customVariables: {}
      };
    }
  }

  /**
   * Helper para extraer la última acción del historial
   */
  private static getLastActionFromHistory(history: any[]): string | null {
    for (let i = history.length - 1; i >= 0; i--) {
      const content = history[i].content;
      if (content.startsWith('[interactive:')) {
        return content.replace('[interactive:', '').replace(']', '');
      }
    }
    return null;
  }
}
