/**
 * Menu Handler - Manejo de menús interactivos de WhatsApp
 *
 * Maneja el envío de menús de bienvenida y navegación principal.
 * Extiende de BaseHandler para acceder a métodos comunes y evaluación de condiciones.
 */

import { getSupabaseAdmin } from '../supabase-admin';
import { sendWhatsAppInteractiveButtons, sendWhatsAppListMessage, sendWhatsAppMessage } from '../whatsapp-service';
import { BUTTON_IDS, Contact, Company, HandlerResponse } from '../types';
import { BaseHandler, buildContext } from './base-handler';
import { TemplateContext, Action } from '../../app/components/templates/types';
import { TemplateService } from '@/lib/services/template-service';
import { getFinalActions } from '@/lib/services/condition-engine';

const WELCOME_KEYWORDS = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'buenas', 'saludos'];

/**
 * Handler especializado para menús
 */
export class MenuHandler extends BaseHandler {
  constructor(context: TemplateContext) {
    super(context);
  }

  /**
   * Verifica si un texto es un saludo
   */
  isGreeting(text: string): boolean {
    const normalized = text.trim().toLowerCase();
    return WELCOME_KEYWORDS.some((keyword) => normalized.includes(keyword));
  }

  /**
   * Envía menú de bienvenida según el segmento
   */
  async sendWelcomeMenu(phoneNumber: string): Promise<void> {
    // Enriquecer contexto con datos frescos
    await this.enrichContext();

    if (this.isClient()) {
      await this.sendClientMenu(phoneNumber);
    }
  }

  /**
   * Menú para clientes con acciones condicionales
   */
  private async sendClientMenu(phoneNumber: string): Promise<void> {
    const name = this.context.contact.name?.trim() || 'cliente';

    // Verificar si tiene documentos usando método de BaseHandler
    const hasDocs = await this.hasDocuments();

    const greetingText = hasDocs
      ? `¡Hola ${name}! 👋 Tengo tus documentos listos. ¿Qué necesitas?`
      : `¡Hola ${name}! 👋 ¿En qué puedo ayudarte hoy?`;

    // Definir acciones con condiciones
    const actions: Action[] = [
      {
        type: 'button',
        id: BUTTON_IDS.EXISTING_DOCS,
        title: '📄 Ver mis documentos',
        conditions: {
          show_if: [{ field: 'has_documents', operator: 'exists', value: true }],
          else_action: { type: 'hide_button' }
        }
      },
      {
        type: 'button',
        id: BUTTON_IDS.EXISTING_REQUEST_DOC,
        title: '📋 Solicitar documento',
        conditions: {
          show_if: [{ field: 'has_documents', operator: 'exists', value: false }],
          else_action: { type: 'hide_button' }
        }
      },
      {
        type: 'button',
        id: BUTTON_IDS.EXISTING_TAX,
        title: '🧾 IVAs declarados'
      },
      {
        type: 'button',
        id: BUTTON_IDS.CHECK_REQUEST_STATUS,
        title: '🔎 Mis solicitudes'
      },
      {
        type: 'button',
        id: BUTTON_IDS.BOOK_APPT,
        title: '📅 Agendar Cita'
      },
      {
        type: 'button',
        id: BUTTON_IDS.EXISTING_HUMAN,
        title: '📞 Hablar con asesor'
      },
    ];

    // Evaluar condiciones y obtener acciones finales
    const { buttons, listAction } = getFinalActions(actions, this.context);

    // Si hay lista, enviar lista (description tiene prioridad, ahí guarda el TemplateEditor el JSON)
    if (listAction) {
      const listContent = listAction.description || listAction.content || '[]';
      const options = TemplateService.parseListContent(listContent, this.context);
      await sendWhatsAppListMessage(phoneNumber, {
        body: greetingText,
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
    }

// Enviar botones (máximo 3)
    await sendWhatsAppInteractiveButtons(
      phoneNumber,
      greetingText,
      buttons.slice(0, 3).map(b => ({ id: b.id || 'btn', title: b.title || 'Opción' }))
    );
  }

  /**
   * Procesa botones del menú principal
   */
  async handleMenuButton(
    interactive: string,
    phoneNumber: string,
    contact: Contact,
    companies: Company[],
    activeCompanyId: string | null
  ): Promise<HandlerResponse> {
    // Actualizar contexto con la información más reciente
    this.updateContext({
      contact: { ...this.context.contact, ...contact },
      companies,
      activeCompanyId,
    });

    // Menú cliente: Ver documentos
    if (interactive === BUTTON_IDS.EXISTING_DOCS) {
      await this.sendDocumentsCategoryMenu(phoneNumber);
      return { handled: true };
    }

    // Menú cliente: Solicitar documento
    if (interactive === BUTTON_IDS.EXISTING_REQUEST_DOC) {
      const msg = '¿Qué documento necesitas? Describe el tipo y período que buscas.';
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    // Menú cliente: IVAs declarados
    if (interactive === BUTTON_IDS.EXISTING_TAX) {
      await this.sendTaxDocMenu(phoneNumber);
      return { handled: true };
    }

    // Menú cliente: Hablar con asesor
    if (interactive === BUTTON_IDS.EXISTING_HUMAN) {
      const msg = 'Entiendo. Un asesor especializado de MTZ se comunicará contigo desde este número en breve.';
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    // Menú cliente: Estado de solicitudes
    if (interactive === BUTTON_IDS.CHECK_REQUEST_STATUS) {
      const msg = 'Para consultar una solicitud, envía el código que te dimos. Ejemplo: DOC-1234-ABCD';
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    // Menú prospecto: Cotizar
    if (interactive === BUTTON_IDS.NEW_QUOTE) {
      const msg = 'Para cotizar, dime tu actividad económica y cuántos documentos/emisiones tienes al mes (aprox.).';
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    // Menú prospecto: Más información
    if (interactive === BUTTON_IDS.NEW_INFO) {
      const msg = '¿Te interesa contabilidad, impuestos, nómina o regularizaciones?';
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    // Menú prospecto: Estado solicitud
    if (interactive === BUTTON_IDS.CHECK_REQUEST_STATUS) {
      const msg = 'Para consultar una solicitud, envía el código que te dimos. Ejemplo: COT-1234-ABCD';
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    // Menú prospecto: Hablar con asesor
    if (interactive === BUTTON_IDS.NEW_HUMAN) {
      const msg = 'Entiendo. Un asesor especializado de MTZ se comunicará contigo desde este número en breve.';
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    return { handled: false };
  }

  /**
   * Menú de categorías de documentos
   */
  private async sendDocumentsCategoryMenu(phoneNumber: string): Promise<void> {
    // Obtener documentos actualizados
    await this.enrichContext();

    const docs = this.context.documents;

    if (docs.length === 0) {
      await sendWhatsAppMessage(
        phoneNumber,
        '📋 No tengo documentos cargados para ti aún. ¿Prefieres solicitar alguno o hablar con un asesor?'
      );
      return;
    }

    // Si hay más de 3 tipos de documentos, usar List Message
    const docTypes = new Set(docs.map(d => d.document_type || 'general'));

    if (docTypes.size > 3) {
      const rows = docs.slice(0, 10).map(doc => ({
        id: `doc_${doc.id}`,
        title: doc.title.substring(0, 24),
        description: doc.file_name || 'Ver documento'
      }));

      await sendWhatsAppListMessage(phoneNumber, {
        body: `📄 Tienes ${docs.length} documentos disponibles. ¿Cuál ver?`,
        buttonText: 'Ver documento',
        sections: [{
          title: 'Mis Documentos',
          rows
        }]
      });
      return;
    }

    // Agrupar por tipo y mostrar botones
    const ivaDocs = docs.filter(d => d.document_type === 'iva');
    const rentaDocs = docs.filter(d => d.document_type === 'renta');
    const balanceDocs = docs.filter(d => d.document_type === 'balance');

    const buttons: { id: string; title: string }[] = [];

    if (ivaDocs.length > 0) {
      buttons.push({ id: 'show_iva', title: `🧾 IVA: ${ivaDocs[0].title.substring(0, 20)}` });
    }
    if (rentaDocs.length > 0) {
      buttons.push({ id: 'show_renta', title: `📊 Renta: ${rentaDocs[0].title.substring(0, 20)}` });
    }
    if (balanceDocs.length > 0) {
      buttons.push({ id: 'show_balance', title: `📈 Balance: ${balanceDocs[0].title.substring(0, 20)}` });
    }

    buttons.push({ id: BUTTON_IDS.EXISTING_REQUEST_DOC, title: '📋 Solicitar otro' });
    buttons.push({ id: BUTTON_IDS.EXISTING_HUMAN, title: '📞 Hablar con asesor' });

    await sendWhatsAppInteractiveButtons(
      phoneNumber,
      `📄 Tienes ${docs.length} documentos disponibles. ¿Cuál ver?`,
      buttons.slice(0, 3)
    );
  }

  /**
   * Menú de impuestos (IVAs)
   */
  private async sendTaxDocMenu(phoneNumber: string): Promise<void> {
    const ivaDocs = await this.getDocumentsByType('iva');

    if (ivaDocs.length === 0) {
      await sendWhatsAppMessage(
        phoneNumber,
        '🧾 No tengo IVAs declarados cargados aún. ¿Prefieres solicitar uno o hablar con un asesor?'
      );
      return;
    }

    // Si hay más de 3 IVAs, usar List Message
    if (ivaDocs.length > 3) {
      const rows = ivaDocs.slice(0, 10).map(doc => ({
        id: `iva_${doc.id}`,
        title: doc.title.substring(0, 24),
        description: 'Ver documento'
      }));

      rows.push({ id: 'iva_request', title: '📋 Solicitar IVA', description: 'Pedir nuevo IVA' });
      rows.push({ id: BUTTON_IDS.EXISTING_HUMAN, title: '📞 Hablar con asesor', description: 'Contacto directo' });

      await sendWhatsAppListMessage(phoneNumber, {
        body: `🧾 Tienes ${ivaDocs.length} IVAs disponibles. ¿Cuál quieres ver?`,
        buttonText: 'Ver IVA',
        sections: [{
          title: 'Mis IVAs',
          rows
        }]
      });
      return;
    }

    const buttons = ivaDocs.map(doc => ({
      id: `iva_${doc.id}`,
      title: doc.title.substring(0, 25)
    }));

    buttons.push({ id: BUTTON_IDS.EXISTING_REQUEST_DOC, title: '📋 Solicitar IVA' });
    buttons.push({ id: BUTTON_IDS.EXISTING_HUMAN, title: '📞 Hablar con asesor' });

    await sendWhatsAppInteractiveButtons(
      phoneNumber,
      `🧾 Tienes ${ivaDocs.length} IVAs disponibles. ¿Cuál quieres ver?`,
      buttons.slice(0, 3)
    );
  }

  /**
   * Derivación a humano (común para ambos)
   */
  async deriveToHuman(phoneNumber: string): Promise<void> {
    const msg = 'Entiendo. Un asesor especializado de MTZ se comunicará contigo desde este número en breve. Gracias por tu paciencia.';
    await sendWhatsAppMessage(phoneNumber, msg);
  }
}

// Funciones exportadas para compatibilidad con código existente
export function isGreeting(text: string): boolean {
  const handler = new MenuHandler({
    contact: { id: '', phone_number: '' },
    companies: [],
    activeCompanyId: null,
    documents: [],
    lastAction: null,
    conversationHistory: [],
    redirectCount: 0,
  });
  return handler.isGreeting(text);
}

export async function sendWelcomeMenu(
  phoneNumber: string,
  contact: Contact
): Promise<void> {
  const { buildContext } = await import('./base-handler');
  const context = await buildContext(phoneNumber, contact.id, '');
  const handler = new MenuHandler(context);
  return handler.sendWelcomeMenu(phoneNumber);
}

export async function handleMenuButton(
  interactive: string,
  phoneNumber: string,
  contact: Contact,
  companies: Company[],
  activeCompanyId: string | null
): Promise<HandlerResponse> {
  const { buildContext } = await import('./base-handler');
  const context = await buildContext(phoneNumber, contact.id, '');
  const handler = new MenuHandler(context);
  return handler.handleMenuButton(interactive, phoneNumber, contact, companies, activeCompanyId);
}

export async function deriveToHuman(phoneNumber: string): Promise<void> {
  const handler = new MenuHandler({
    contact: { id: '', phone_number: '' },
    companies: [],
    activeCompanyId: null,
    documents: [],
    lastAction: null,
    conversationHistory: [],
    redirectCount: 0,
  });
  return handler.deriveToHuman(phoneNumber);
}
