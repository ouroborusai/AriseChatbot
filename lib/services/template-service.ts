import { getSupabaseAdmin } from '../supabase-admin';
import {
  Template,
  TemplateContext,
  TemplateSegment,
} from '../../app/components/templates/types';

export class TemplateService {
  /**
   * Busca una plantilla por su ID y verifica que esté activa y sea para el segmento correcto
   */
  static async findTemplateById(
    templateId: string,
    segment?: string | null
  ): Promise<Template | null> {
    const { data: template } = await getSupabaseAdmin()
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .maybeSingle();

    if (!template) return null;

    // Verificar segmento (Case-insensitive)
    const normalizedSegment = segment?.toLowerCase() || 'todos';
    const templateSegment = template.segment?.toLowerCase() || 'todos';

    if (templateSegment !== 'todos' && templateSegment !== normalizedSegment) {
      return null;
    }

    return template as Template;
  }

  /**
   * Busca una plantilla que tenga una acción con el ID dado
   * Útil para navegación por next_template_id
   */
  static async findTemplateByActionId(
    actionId: string,
    segment?: string | null
  ): Promise<Template | null> {
    console.log(`[TemplateService] 🔍 Buscando actionId: "${actionId}" para segmento: ${segment || 'todos'}`);

    // 1. INTENTO DE COINCIDENCIA DIRECTA: ¿El ID es directamente una plantilla? (NUEVO)
    const directTemplate = await this.findTemplateById(actionId, segment);
    if (directTemplate) {
      console.log(`[TemplateService] ✅ Coincidencia DIRECTA por ID de plantilla: "${actionId}"`);
      return directTemplate;
    }

    const { data: templates } = await getSupabaseAdmin()
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(50);

    if (!templates) {
      console.log(`[TemplateService] ❌ No se encontraron plantillas activas`);
      return null;
    }

    for (const t of templates) {
      if (!t.actions || t.actions.length === 0) continue;
      if (t.segment && t.segment !== 'todos' && t.segment !== segment) continue;

      for (const action of t.actions) {
        // 1. Caso: El ID coincide directamente con la acción (botón o lista completa)
        if (action.id === actionId && action.next_template_id) {
          console.log(`[TemplateService] ✅ Coincidencia directa en acción "${action.id}" del template "${t.name}" → ${action.next_template_id}`);
          return await this.findTemplateById(action.next_template_id, segment);
        }

        // 2. Caso: Es una lista y el ID podría coincidir con una de sus opciones (JSON en description o content)
        const listContent = action.content || action.description;
        if (action.type === 'list' && listContent) {
          try {
            // Intentar parsear el contenido como JSON si es un string
            const options = typeof listContent === 'string' ? JSON.parse(listContent) : listContent;
            
            if (Array.isArray(options)) {
              const matchedOption = options.find((opt: any) => opt.id === actionId);
              if (matchedOption && matchedOption.next_template_id) {
                console.log(`[TemplateService] ✅ Coincidencia en LISTA "${action.id}" del template "${t.name}" → Opción: "${matchedOption.title}" → ${matchedOption.next_template_id}`);
                return await this.findTemplateById(matchedOption.next_template_id, segment);
              }
            }
          } catch (e) {
            console.warn(`[TemplateService] ⚠️ Error parseando contenido de lista en template "${t.name}":`, e);
          }
        }
      }
    }

    console.log(`[TemplateService] ❌ No se encontró coincidencia para actionId: "${actionId}"`);
    return null;
  }

  /**
   * Busca plantillas que coincidan con el trigger (palabras clave)
   */
  static async findTemplateByTrigger(
    text: string,
    segment?: string | null
  ): Promise<Template | null> {
    const lowerText = text.toLowerCase().trim();

    const { data: templates } = await getSupabaseAdmin()
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(100); // Aumentado para soportar más flujos y comandos

    if (!templates) return null;

    for (const t of templates) {
      if (!t.trigger) continue;

      const triggers = t.trigger.split(',').map((s: string) => s.trim().toLowerCase());
      if (triggers.some((tr: string) => lowerText.includes(tr))) {
        const normalizedSegment = segment?.toLowerCase() || 'todos';
        const templateSegment = t.segment?.toLowerCase() || 'todos';

        if (templateSegment !== 'todos' && templateSegment !== normalizedSegment) continue;
        return t as Template;
      }
    }
    return null;
  }

  /**
   * Reemplaza variables dinámicas en el contenido de la plantilla
   * Variables soportadas: {{nombre}}, {{document_count}}, {{documents_list}}, {{iva_list}}
   */
  static replaceVariables(content: string, context: TemplateContext): string {
    if (!content) return '';
    let result = content;

    // 1. Nombre del contacto (Normalizado)
    const rawName = context.contact?.name || 'cliente';
    const friendlyName = String(rawName).split(' ')[0].trim();
    const capitalizedName = friendlyName.charAt(0).toUpperCase() + friendlyName.slice(1).toLowerCase();
    
    result = result.split('{{nombre}}').join(capitalizedName);
    result = result.split('{{name}}').join(capitalizedName); // Aliases
    
    // 2. Datos de la Empresa Activa
    const activeComp = context.companies?.find(c => c.id === context.activeCompanyId) || context.companies?.[0];
    const companyName = activeComp?.legal_name || 'tu empresa';
    const companyRut = activeComp?.tax_id || (activeComp as any)?.rut || 'RUT pendiente';

    result = result.split('{{empresa}}').join(companyName);
    result = result.split('{{legal_name}}').join(companyName); // Aliases
    result = result.split('{{rut}}').join(companyRut);

    // 3. Documentos y Resúmenes
    if (context.documents) {
      result = result.split('{{document_count}}').join(String(context.documents.length));

      if (result.includes('{{documents_list}}')) {
        const docsList = context.documents.map((d) => ({
          id: `doc_${d.id}`,
          title: String(d.title || 'Documento').slice(0, 24),
          description: d.created_at ? new Date(d.created_at).toLocaleDateString('es-CL') : 'Reciente'
        }));
        result = result.split('{{documents_list}}').join(JSON.stringify(docsList));
      }
    }

    if (result.includes('{{financial_summary}}')) {
      const summary = (activeComp as any)?.metadata?.financial_summary;
      if (summary && summary.whatsapp_proposal) {
        result = result.split('{{financial_summary}}').join(summary.whatsapp_proposal);
      } else {
        result = result.split('{{financial_summary}}').join(`Aquí tienes el resumen de ${companyName}.`);
      }
    }

    return result;
  }

  /**
   * Procesa el contenido de una acción de lista, reemplazando variables y parseando a JSON.
   * 
   * NOTA: En WhatsApp, las Listas Interactivas muestran filas de opciones, pero las acciones
   * como "Volver" o "Solicitar" deben definirse como acciones de tipo 'button' por separado
   * en la plantilla. Asegúrate de que cada template con una lista también incluya al menos
   * un botón de navegación (ej: { type: 'button', title: '← Volver', ... }) para una mejor UX.
   * 
   * Ejemplo correcto:
   *   actions: [
   *     { type: 'list', title: 'Documentos', description: 'Lista', content: '{{doc_list}}' },
   *     { type: 'button', id: 'btn_volver', title: '← Volver', next_template_id: 'menu_principal' }
   *   ]
   */
  static parseListContent(content: string, context: TemplateContext): any[] {
    try {
      const processed = this.replaceVariables(content, context);
      return JSON.parse(processed);
    } catch (e) {
      console.error('[TemplateService] Error parsing list content:', e);
      return [];
    }
  }
}
