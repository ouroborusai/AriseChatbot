/**
 * Documents Handler - Manejo de documentos y PDFs
 *
 * Maneja la búsqueda, filtrado y envío de documentos a través de WhatsApp.
 * Extiende de BaseHandler para acceder a métodos comunes.
 */

import { getSupabaseAdmin } from '../supabase-admin';
import { sendWhatsAppDocument, sendWhatsAppMessage, sendWhatsAppInteractiveButtons, sendWhatsAppListMessage } from '../whatsapp-service';
import { BUTTON_IDS, HandlerResponse, Contact, Company } from '../types';
import { BaseHandler } from './base-handler';
import { TemplateContext } from '../../app/components/templates/types';
import { ContextService } from '../services/context-service';

/**
 * Handler especializado para documentos
 */
export class DocumentsHandler extends BaseHandler {
  constructor(context: TemplateContext) {
    super(context);
  }

  /**
   * Envía documento por ID
   */
  async sendDocumentById(
    phoneNumber: string,
    conversationId: string,
    docId: string
  ): Promise<HandlerResponse> {
    console.log('[DocumentsHandler] Buscando documento:', docId);

    const { data: doc, error } = await getSupabaseAdmin()
      .from('client_documents')
      .select('*')
      .eq('id', docId)
      .maybeSingle();

    if (error || !doc) {
      const msg = 'No encontré ese documento. ¿Prefieres solicitarlo o hablar con un asesor?';
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    // Verificar permisos (el documento debe pertenecer al contacto)
    if (doc.contact_id !== this.context.contact.id) {
      console.warn('[DocumentsHandler] Intento de acceso a documento ajeno');
      const msg = 'No tengo acceso a ese documento.';
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    let url: string | null = null;

    // Intentar generar URL firmada
    if (doc.storage_bucket && doc.storage_path) {
      const { data, error: urlError } = await getSupabaseAdmin()
        .storage
        .from(doc.storage_bucket)
        .createSignedUrl(doc.storage_path, 60 * 10); // 10 minutos

      if (urlError || !data?.signedUrl) {
        console.error('[DocumentsHandler] Error al generar URL:', urlError);
        const msg = 'Encontré tu documento, pero falló el enlace. Un asesor te contactará.';
        await sendWhatsAppMessage(phoneNumber, msg);
        return { handled: true };
      }
      url = data.signedUrl;
    } else if (doc.file_url) {
      url = doc.file_url;
    }

    if (!url) {
      const msg = `Encontré "${doc.title}" pero no tiene archivo disponible.`;
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    // Enviar documento
    await sendWhatsAppDocument(
      phoneNumber,
      url,
      doc.file_name || `${doc.title}.pdf`,
      `Aquí tienes: ${doc.title}`
    );

    // Ofrecer enviarlo por email
    await sendWhatsAppInteractiveButtons(
      phoneNumber,
      '¿También lo necesitas en tu correo? 📧',
      [
        { id: `${BUTTON_IDS.SEND_BY_EMAIL}_${doc.id}`, title: 'Enviar a mi Email' },
        { id: BUTTON_IDS.EXISTING_DOCS, title: '📁 Ver otros' },
        { id: 'menu_principal_cliente', title: '🏠 Menú Inicio' }
      ]
    );

    console.log('[DocumentsHandler] Documento enviado y ofrecido mail:', doc.title);
    return { handled: true };
  }

  /**
   * Busca y envía documento por query de texto
   */
  async sendDocumentByQuery(
    phoneNumber: string,
    conversationId: string,
    query: string
  ): Promise<HandlerResponse> {
    console.log('[DocumentsHandler] Buscando documento:', query);

    const { data: doc } = await getSupabaseAdmin()
      .from('client_documents')
      .select('*')
      .eq('contact_id', this.context.contact.id)
      .eq('company_id', this.context.activeCompanyId || null)
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!doc) {
      const msg = `No tengo "${query}" cargado todavía. ¿Quieres que un asesor lo gestione?`;
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    return await this.sendDocumentById(phoneNumber, conversationId, doc.id);
  }

  /**
   * Maneja botones de documentos específicos (iva_xxx, renta_xxx, etc.)
   */
  async handleDocumentButton(
    interactive: string,
    phoneNumber: string,
    conversationId: string
  ): Promise<HandlerResponse> {
    // Botones IVA específicos
    if (interactive.startsWith('iva_')) {
      const docId = interactive.replace('iva_', '');
      return await this.sendDocumentById(phoneNumber, conversationId, docId);
    }

    // Botones Renta específicos
    if (interactive.startsWith('renta_')) {
      const docId = interactive.replace('renta_', '');
      return await this.sendDocumentById(phoneNumber, conversationId, docId);
    }

    // Botones Balance específicos
    if (interactive.startsWith('balance_')) {
      const docId = interactive.replace('balance_', '');
      return await this.sendDocumentById(phoneNumber, conversationId, docId);
    }

    // Botones Liquidación específicos
    if (interactive.startsWith('liquidacion_')) {
      const docId = interactive.replace('liquidacion_', '');
      return await this.sendDocumentById(phoneNumber, conversationId, docId);
    }

    // Botones de documento genéricos
    if (interactive.startsWith('doc_')) {
      const docId = interactive.replace('doc_', '');
      return await this.sendDocumentById(phoneNumber, conversationId, docId);
    }

    // Botones "show_" para mostrar más documentos de un tipo
    if (interactive.startsWith('show_')) {
      const type = interactive.replace('show_', '');
      await this.showDocumentsByType(phoneNumber, type);
      return { handled: true };
    }

    return { handled: false };
  }

  /**
   * Maneja texto de período (cuando usuario escribe "2026-03" después de pedir IVA)
   */
  async handlePeriodText(
    text: string,
    lastButton: string | null,
    phoneNumber: string,
    conversationId: string
  ): Promise<HandlerResponse> {
    const period = text.trim();

    // IVA: formato YYYY-MM
    if (lastButton === BUTTON_IDS.DOC_IVA) {
      if (!/^\d{4}-\d{2}$/.test(period)) {
        await sendWhatsAppMessage(phoneNumber, 'Formato inválido. Usa YYYY-MM (ej: 2026-03).');
        return { handled: true };
      }
      return await this.sendDocumentByQuery(phoneNumber, conversationId, `iva ${period}`);
    }

    // Renta: formato YYYY
    if (lastButton === BUTTON_IDS.DOC_RENTA) {
      if (!/^\d{4}$/.test(period)) {
        await sendWhatsAppMessage(phoneNumber, 'Formato inválido. Usa solo el año (ej: 2025).');
        return { handled: true };
      }
      return await this.sendDocumentByQuery(phoneNumber, conversationId, `renta ${period}`);
    }

    // Balance: formato YYYY
    if (lastButton === BUTTON_IDS.DOC_CAT_ACCOUNTING || lastButton === BUTTON_IDS.DOC_BALANCE) {
      if (!/^\d{4}$/.test(period)) {
        await sendWhatsAppMessage(phoneNumber, 'Formato inválido. Usa solo el año (ej: 2025).');
        return { handled: true };
      }
      return await this.sendDocumentByQuery(phoneNumber, conversationId, `balance ${period}`);
    }

    // Liquidaciones: "YYYY-MM Nombre"
    if (lastButton === BUTTON_IDS.DOC_LIQUIDACIONES) {
      const m = period.match(/^(\d{4}-\d{2})\s+(.+)$/);
      if (!m) {
        await sendWhatsAppMessage(phoneNumber, 'Formato inválido. Ejemplo: "2026-03 Juan Perez".');
        return { handled: true };
      }
      return await this.sendDocumentByQuery(phoneNumber, conversationId, `liquidacion ${period}`);
    }

    return { handled: false };
  }

  /**
   * Muestra menú de documentos por tipo
   */
  async showDocumentsByType(
    phoneNumber: string,
    type: string
  ): Promise<void> {
    const docs = await this.getDocumentsByType(type);

    if (docs.length === 0) {
      await sendWhatsAppMessage(
        phoneNumber,
        `No tengo documentos de tipo "${type}" cargados aún. ¿Prefieres solicitar uno o hablar con un asesor?`
      );
      return;
    }

    // Si hay más de 3 documentos, usar List Message
    if (docs.length > 3) {
      const rows = docs.slice(0, 10).map(doc => ({
        id: `${type}_${doc.id}`,
        title: doc.title.substring(0, 24),
        description: doc.file_name || 'Ver documento'
      }));

      rows.push({ id: 'request_doc', title: '📋 Solicitar documento', description: 'Pedir nuevo' });
      rows.push({ id: BUTTON_IDS.EXISTING_HUMAN, title: '📞 Hablar con asesor', description: 'Contacto directo' });

      await sendWhatsAppListMessage(phoneNumber, {
        body: `📄 Tienes ${docs.length} documentos de tipo "${type}". ¿Cuál quieres ver?`,
        buttonText: 'Ver documento',
        sections: [{
          title: `Mis ${type}s`,
          rows
        }]
      });
      return;
    }

    // Usar botones interactivos
    const buttons = docs.map(doc => ({
      id: `${type}_${doc.id}`,
      title: doc.title.substring(0, 25)
    }));

    buttons.push({ id: BUTTON_IDS.EXISTING_REQUEST_DOC, title: '📋 Solicitar otro' });
    buttons.push({ id: BUTTON_IDS.EXISTING_HUMAN, title: '📞 Hablar con asesor' });

    await sendWhatsAppInteractiveButtons(
      phoneNumber,
      `📄 Tienes ${docs.length} documentos de tipo "${type}". ¿Cuál quieres ver?`,
      buttons
    );
  }

  /**
   * Muestra menú de categorías de documentos
   */
  async showDocumentsCategoryMenu(phoneNumber: string): Promise<void> {
    // Enriquecer contexto si no está actualizado
    if (this.context.documents.length === 0) {
      await this.enrichContext();
    }

    const docs = this.context.documents;

    if (docs.length === 0) {
      await sendWhatsAppMessage(
        phoneNumber,
        '📋 No tengo documentos cargados para ti aún. ¿Prefieres solicitar alguno o hablar con un asesor?'
      );
      return;
    }

    // Agrupar por tipo
    const ivaDocs = docs.filter(d => d.document_type === 'iva');
    const rentaDocs = docs.filter(d => d.document_type === 'renta');
    const balanceDocs = docs.filter(d => d.document_type === 'balance');
    const liquidacionDocs = docs.filter(d => d.document_type === 'liquidacion');

    // Usar lista si hay muchas categorías
    const categories = [
      ivaDocs.length > 0 ? { type: 'iva', count: ivaDocs.length, label: '🧾 IVAs' } : null,
      rentaDocs.length > 0 ? { type: 'renta', count: rentaDocs.length, label: '📊 Renta' } : null,
      balanceDocs.length > 0 ? { type: 'balance', count: balanceDocs.length, label: '📈 Balances' } : null,
      liquidacionDocs.length > 0 ? { type: 'liquidacion', count: liquidacionDocs.length, label: '👥 Nómina' } : null,
    ].filter(Boolean);

    if (categories.length === 0) {
      await sendWhatsAppMessage(phoneNumber, 'No tengo documentos categorizados. ¿Hablar con asesor?');
      return;
    }

    if (categories.length > 3) {
      // Usar lista
      const rows = categories.map(cat => ({
        id: `cat_${(cat as any).type}`,
        title: (cat as any).label,
        description: `${(cat as any).count} documentos`
      }));

      await sendWhatsAppListMessage(phoneNumber, {
        body: `📄 Tienes ${docs.length} documentos en ${categories.length} categorías.`,
        buttonText: 'Ver categorías',
        sections: [{
          title: 'Categorías',
          rows
        }]
      });
    } else {
      // Usar botones
      const buttons = categories.map(cat => ({
        id: `cat_${(cat as any).type}`,
        title: (cat as any).label
      }));

      buttons.push({ id: BUTTON_IDS.EXISTING_REQUEST_DOC, title: '📋 Solicitar documento' });

      await sendWhatsAppInteractiveButtons(
        phoneNumber,
        `📄 Tienes ${docs.length} documentos en ${categories.length} categorías.`,
        buttons
      );
    }
  }

  /**
   * Solicita documento (crea ticket de solicitud)
   */
  async requestDocument(
    phoneNumber: string,
    conversationId: string,
    description: string
  ): Promise<HandlerResponse> {
    const requestCode = `DOC-${Date.now().toString(36).toUpperCase()}`;

    const { error } = await getSupabaseAdmin()
      .from('service_requests')
      .insert({
        request_code: requestCode,
        contact_id: this.context.contact.id,
        conversation_id: conversationId,
        company_id: this.context.activeCompanyId || null,
        request_type: 'document',
        description: description,
        status: 'pending',
      });

    if (error) {
      console.error('[DocumentsHandler] Error al crear solicitud:', error);
      const msg = 'Hubo un problema al registrar tu solicitud. Un asesor te contactará pronto.';
      await sendWhatsAppMessage(phoneNumber, msg);
      return { handled: true };
    }

    const msg = `Solicitud registrada ✅\n\n📋 Código: ${requestCode}\n📌 Tipo: Documento\n⏳ Estado: Pendiente\n\nUn asesor te contactará pronto.`;
    await sendWhatsAppMessage(phoneNumber, msg);

    return { handled: true };
  }

  /**
   * Verifica si hay documentos de un tipo específico usando condiciones
   */
  async hasDocumentType(type: string): Promise<boolean> {
    const condition = {
      field: 'document_type' as const,
      operator: 'includes' as const,
      value: type,
    };

    // Actualizar contexto con documentos frescos
    await this.enrichContext();

    return this.evaluateCondition(condition);
  }
}

// Funciones exportadas para compatibilidad con el código existente
export async function handleDocumentButton(
  interactive: string,
  phoneNumber: string,
  conversationId: string,
  contact: Contact,
  companies: Company[],
  activeCompanyId: string | null
): Promise<HandlerResponse> {
  const context = await ContextService.buildContext(contact, companies, activeCompanyId, conversationId);
  const handler = new DocumentsHandler(context);
  return handler.handleDocumentButton(interactive, phoneNumber, conversationId);
}

export async function handlePeriodText(
  text: string,
  lastButton: string | null,
  phoneNumber: string,
  conversationId: string,
  contact: Contact,
  companies: Company[],
  activeCompanyId: string | null
): Promise<HandlerResponse> {
  const context = await ContextService.buildContext(contact, companies, activeCompanyId, conversationId);
  const handler = new DocumentsHandler(context);
  return handler.handlePeriodText(text, lastButton, phoneNumber, conversationId);
}

export async function handleDocCategoryButton(
  interactive: string,
  phoneNumber: string,
  contact: Contact,
  companies: Company[],
  activeCompanyId: string | null
): Promise<HandlerResponse> {
  const context = await ContextService.buildContext(contact, companies, activeCompanyId, '');
  const handler = new DocumentsHandler(context);

  if (interactive === BUTTON_IDS.DOC_CAT_TAX) {
    await handler.showDocumentsByType(phoneNumber, 'iva');
    return { handled: true };
  }

  if (interactive === BUTTON_IDS.DOC_CAT_ACCOUNTING) {
    await sendWhatsAppMessage(phoneNumber, '¿Qué año de balance necesitas? (ej: 2025)');
    return { handled: true };
  }

  if (interactive === BUTTON_IDS.DOC_CAT_PAYROLL_CONTRACTS) {
    await sendWhatsAppMessage(phoneNumber, 'Selecciona: 💰 Liquidaciones o 📄 Contratos');
    return { handled: true };
  }

  // Botones de documento específico (pedir período)
  if (interactive === BUTTON_IDS.DOC_IVA) {
    await sendWhatsAppMessage(phoneNumber, 'Indica el período IVA en formato YYYY-MM (ej: 2026-03).');
    return { handled: true };
  }

  if (interactive === BUTTON_IDS.DOC_RENTA) {
    await sendWhatsAppMessage(phoneNumber, 'Indica el año de Renta (ej: 2025).');
    return { handled: true };
  }

  if (interactive === BUTTON_IDS.DOC_LIQUIDACIONES) {
    await sendWhatsAppMessage(phoneNumber, 'Indica mes (YYYY-MM) y nombre del trabajador. Ej: "2026-03 Juan Perez".');
    return { handled: true };
  }

  if (interactive === BUTTON_IDS.DOC_CONTRATOS) {
    await sendWhatsAppMessage(phoneNumber, '¿Qué contrato necesitas? (ej: "servicio contable", "nómina", "otro")');
    return { handled: true };
  }

  return { handled: false };
}

export async function requestDocument(
  phoneNumber: string,
  conversationId: string,
  contact: Contact,
  companies: Company[],
  activeCompanyId: string | null,
  description: string
): Promise<HandlerResponse> {
  const context = await ContextService.buildContext(contact, companies, activeCompanyId, conversationId);
  const handler = new DocumentsHandler(context);
  return handler.requestDocument(phoneNumber, conversationId, description);
}

// Las funciones sendDocumentById y sendDocumentByQuery ahora son métodos de DocumentsHandler
// Para uso directo, instanciar el handler con el contexto apropiado
