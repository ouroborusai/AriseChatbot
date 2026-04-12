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
      console.log(`[ContextService] 🏗️ Construyendo contexto para ${contact.name}...`);
      
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
      if (hasCompanies && currentSegment !== 'cliente') {
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
        metadata: contact.metadata || {},
      };

      console.log(`[ContextService] ✅ Contexto listo: ${result.contact.segment.toUpperCase()}`);
      return result;

    } catch (globalError: any) {
      console.error('[ContextService] ❌ ERROR CRÍTICO:', globalError.message);
      // Fallback mínimo de emergencia
      return {
        contact: { ...contact, segment: 'prospecto' as any },
        companies: [],
        activeCompanyId: null,
        documents: [],
        serviceRequests: [],
        metadata: {}
      };
    }
  }

  /**
   * Helper para extraer historial simplificado para servicios (p. ej. AI)
   */
  static async getConversationHistory(conversationId: string) {
    const { data } = await getSupabaseAdmin()
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    return data || [];
  }

  /**
   * Helper para obtener el último botón presionado
   */
  static getLastButtonFromHistory(history: any[]): string | null {
    const lastUserMsg = history.find(m => m.role === 'user' && m.content.includes('[button:'));
    if (!lastUserMsg) return null;
    
    const match = lastUserMsg.content.match(/\[button:(.*?)\]/);
    return match ? match[1] : null;
  }
}
