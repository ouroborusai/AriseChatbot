import { getSupabaseAdmin } from '../supabase-admin';
import { 
  sendWhatsAppMessage, 
  sendWhatsAppInteractiveButtons, 
  sendWhatsAppListMessage, 
  sendWhatsAppDocument 
} from '../whatsapp-service';
import { Action, TemplateContext } from '../../app/components/templates/types';
import { TemplateService } from './template-service';

export class ActionService {
  /**
   * Ejecuta las acciones de una plantilla evaluando condiciones y enviando la respuesta adecuada
   */
  static async executeActions(
    phoneNumber: string,
    actions: Action[],
    context: TemplateContext
  ): Promise<boolean> {
    // 1. Procesar acciones de tipo 'show_document' primero (tienen prioridad)
    for (const action of actions) {
      if (action.type === 'show_document' && action.condition?.required_document_type) {
        const docType = action.condition.required_document_type;
        const { data: doc } = await getSupabaseAdmin()
          .from('client_documents')
          .select('id, title, file_url, file_name, storage_bucket, storage_path')
          .eq('contact_id', context.contact.id)
          .or(`file_type.eq.${docType},title.ilike.%${docType}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (doc) {
          await sendWhatsAppDocument(phoneNumber, doc.file_url, doc.title);
          return true; // Acción ejecutada con éxito
        } else if (action.else_action?.message) {
          await sendWhatsAppMessage(phoneNumber, action.else_action.message);
          return true;
        }
      }
    }

    // 2. Evaluar acciones finales (filtradas por el condition-engine)
    // Nota: getFinalActions viene de condition-engine, pero la ejecución es aquí
    // Para evitar dependencias circulares, pasamos el resultado de getFinalActions si es necesario, 
    // o lo importamos aquí.
    return false;
  }

  /**
   * Envía la respuesta interactiva (Lista o Botones) basada en las acciones filtradas
   */
  static async sendInteractiveResponse(
    phoneNumber: string,
    content: string,
    buttons: any[],
    listAction: any | null,
    elseActions: any[],
    context: TemplateContext
  ): Promise<void> {
    // 1. Manejar else_actions cuando no hay botones visibles
    if (buttons.length === 0 && elseActions.length > 0) {
      const firstElseAction = elseActions[0];
      if (firstElseAction.type === 'show_message' && firstElseAction.message) {
        await sendWhatsAppMessage(phoneNumber, firstElseAction.message);
        return;
      }
    }

    // 2. Enviar lista si existe
    if (listAction) {
      console.log('[ActionService] Detectada acción de lista:', listAction.title);
      // Intentar obtener opciones de description (prioridad, ahí guarda el TemplateEditor el JSON) o content
      const listContent = listAction.description || listAction.content || '[]';
      const options = TemplateService.parseListContent(listContent, context);
      
      if (options.length > 0) {
        console.log(`[ActionService] Enviando lista con ${options.length} opciones`);
        await sendWhatsAppListMessage(phoneNumber, {
          body: content,
          buttonText: listAction.title || 'Seleccionar',
          sections: [{
            title: 'Opciones',
            rows: options.map((o: any) => ({
              id: o.id || 'opt',
              title: o.title || 'Opción',
              description: o.description || ''
            }))
          }]
        });
        return;
      } else {
        console.warn('[ActionService] La acción de lista no tiene opciones válidas tras parsear');
      }
    }

    // 3. Enviar botones (máx 3)
    if (buttons.length > 0) {
      console.log(`[ActionService] Enviando ${buttons.length} botones`);
      const buttonPayloads = buttons.slice(0, 3).map(b => ({
        id: b.id || 'btn',
        title: (b.title || 'Opción').substring(0, 20)
      }));
      await sendWhatsAppInteractiveButtons(phoneNumber, content, buttonPayloads);
      return;
    } 
    
    if (listAction) {
      // Si llegamos aquí y había un listAction pero no se envió, y no hay botones, 
      // enviamos al menos el mensaje de texto para no dejar al usuario en blanco
      console.log('[ActionService] No hay botones y la lista falló, enviando texto plano como fallback');
      await sendWhatsAppMessage(phoneNumber, content);
    }
  }
}
