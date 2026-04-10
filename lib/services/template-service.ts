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

    // Verificar segmento
    if (template.segment && template.segment !== 'todos' && template.segment !== segment) {
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
    const { data: templates } = await getSupabaseAdmin()
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(20);

    if (!templates) return null;

    for (const t of templates) {
      if (!t.actions || t.actions.length === 0) continue;
      if (t.segment && t.segment !== 'todos' && t.segment !== segment) continue;

      const matchedAction = t.actions.find((a: any) => a.id === actionId);
      if (matchedAction && matchedAction.next_template_id) {
        return await this.findTemplateById(matchedAction.next_template_id, segment);
      }
    }
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
      .limit(10);

    if (!templates) return null;

    for (const t of templates) {
      if (!t.trigger) continue;

      const triggers = t.trigger.split(',').map((s: string) => s.trim().toLowerCase());
      if (triggers.some((tr: string) => lowerText.includes(tr))) {
        if (t.segment && t.segment !== 'todos' && t.segment !== segment) continue;
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
    let result = content;

    // Nombre del contacto
    result = result.replace('{{nombre}}', context.contact.name || 'cliente');

    // Cantidad de documentos
    if (context.documents) {
      result = result.replace('{{document_count}}', String(context.documents.length));

      // Lista general de documentos
      if (result.includes('{{documents_list}}')) {
        const docsList = context.documents.map((d) => ({
          id: d.id,
          title: d.title?.slice(0, 24) || 'Documento',
          description: new Date(d.created_at).toLocaleDateString('es-CL')
        }));
        result = result.replace('{{documents_list}}', JSON.stringify(docsList));
      }

      // Lista de IVA
      if (result.includes('{{iva_list}}')) {
        const ivaDocs = context.documents.filter((d) => 
          d.document_type === 'iva' || d.title?.toLowerCase().includes('iva')
        );
        const ivaList = ivaDocs.slice(0, 12).map((d) => ({
          id: d.id,
          title: d.title?.slice(0, 24) || 'IVA',
          description: new Date(d.created_at).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
        }));
        result = result.replace('{{iva_list}}', JSON.stringify(ivaList));
      }
    }

    return result;
  }

  /**
   * Procesa el contenido de una acción de lista, reemplazando variables y parseando a JSON
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
