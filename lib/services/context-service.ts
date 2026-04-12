import { getSupabaseAdmin } from '../supabase-admin';
import { TemplateContext } from '../../app/components/templates/types';

export class ContextService {
  /**
   * Construye el contexto completo para la evaluación de plantillas y condiciones.
   * Acepta datos ya recuperados para evitar consultas redundantes a la base de datos.
   */
  static async buildContext(
    contact: any,
    companies: any[],
    activeCompanyId: string | null,
    conversationId: string
  ): Promise<TemplateContext> {
    // Lógica Industrial: Si tiene empresas vinculadas, ES CLIENTE (independiente de su etiqueta manual)
    const hasCompanies = companies && companies.length > 0;
    const effectiveSegment = hasCompanies ? 'cliente' : (contact.segment || 'prospecto');
    
    // Solo recuperamos lo que no tenemos: documentos e historial
    const [
      { data: documents },
      { data: messages }
    ] = await Promise.all([
      getSupabaseAdmin()
        .from('client_documents')
        .select('id, title, file_name, document_type, created_at')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false }),
      getSupabaseAdmin()
        .from('messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    // Si el segmento cambió dinámicamente, lo actualizamos en la base de datos para consistencia futura
    if (effectiveSegment === 'cliente' && contact.segment !== 'cliente') {
      console.log(`[ContextService] 🚀 Auto-ascendiendo contacto ${contact.phone_number} a CLIENTE por tener empresas vinculadas.`);
      getSupabaseAdmin()
        .from('contacts')
        .update({ segment: 'cliente' })
        .eq('id', contact.id)
        .then(({ error }) => { if (error) console.error('Error auto-update segment:', error.message); });
    }

    return {
      contact: {
        id: contact.id,
        name: contact.name,
        phone_number: contact.phone_number,
        segment: effectiveSegment,
      },
      companies: companies.map(c => ({
        id: c.id,
        legal_name: c.legal_name,
        tax_id: c.rut,
        metadata: c.metadata || {}
      })),
      activeCompanyId: activeCompanyId,
      documents: documents || [],
      lastAction: null,
      conversationHistory: (messages || []).reverse().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content || '',
        created_at: m.created_at
      })),
      redirectCount: 0,
      customVariables: {}
    };
  }

  /**
   * Obtiene el historial de mensajes para una conversación
   */
  static async getConversationHistory(conversationId: string) {
    const { data: msgs } = await getSupabaseAdmin()
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20);

    return (msgs || []).reverse().map(m => ({
      role: m.role,
      content: m.content || '',
    }));
  }

  /**
   * Identifica el último botón presionado en el historial
   */
  static getLastButtonFromHistory(history: Array<{ role: string; content: string }>): string | null {
    for (let i = history.length - 1; i >= 0; i--) {
      const c = history[i]?.content || '';
      if (c.startsWith('[button:') && c.endsWith(']')) {
        return c.slice('[button:'.length, -1);
      }
    }
    return null;
  }
}
