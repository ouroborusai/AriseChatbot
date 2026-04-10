// lib/handlers/documents-handler.ts
// Maneja documentos, PDFs, envío de archivos

import { getSupabaseAdmin } from '../supabase-admin';
import { sendWhatsAppDocument, sendWhatsAppMessage, sendWhatsAppInteractiveButtons, sendWhatsAppListMessage } from '../whatsapp-service';
import { BUTTON_IDS, HandlerResponse } from './types';

// Enviar documento por ID
export async function sendDocumentById(
  phoneNumber: string,
  conversationId: string,
  docId: string
): Promise<HandlerResponse> {
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

  let url: string | null = null;
  
  // Intentar generar URL firmada
  if (doc.storage_bucket && doc.storage_path) {
    const { data, error: urlError } = await getSupabaseAdmin()
      .storage
      .from(doc.storage_bucket)
      .createSignedUrl(doc.storage_path, 60 * 10); // 10 minutos
    
    if (urlError || !data?.signedUrl) {
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

  return { handled: true };
}

// Buscar documento por query (IVA, Renta, Balance, etc.)
export async function sendDocumentByQuery(
  phoneNumber: string,
  conversationId: string,
  contactId: string,
  companyId: string | null,
  query: string
): Promise<HandlerResponse> {
  const { data: doc } = await getSupabaseAdmin()
    .from('client_documents')
    .select('*')
    .eq('contact_id', contactId)
    .eq('company_id', companyId || null)
    .ilike('title', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!doc) {
    const msg = `No tengo "${query}" cargado todavía. ¿Quieres que un asesor lo gestione?`;
    await sendWhatsAppMessage(phoneNumber, msg);
    return { handled: true };
  }

  // Reutilizar sendDocumentById
  return await sendDocumentById(phoneNumber, conversationId, doc.id);
}

// Manejar botones de documentos (iva_xxx, renta_xxx, etc.)
export async function handleDocumentButton(
  interactive: string,
  phoneNumber: string,
  conversationId: string
): Promise<HandlerResponse> {
  // Botones IVA específicos
  if (interactive.startsWith('iva_')) {
    const docId = interactive.replace('iva_', '');
    return await sendDocumentById(phoneNumber, conversationId, docId);
  }

  // Botones Renta específicos
  if (interactive.startsWith('renta_')) {
    const docId = interactive.replace('renta_', '');
    return await sendDocumentById(phoneNumber, conversationId, docId);
  }

  // Botones Balance específicos
  if (interactive.startsWith('balance_')) {
    const docId = interactive.replace('balance_', '');
    return await sendDocumentById(phoneNumber, conversationId, docId);
  }

  // Botones Liquidación específicos
  if (interactive.startsWith('liquidacion_')) {
    const docId = interactive.replace('liquidacion_', '');
    return await sendDocumentById(phoneNumber, conversationId, docId);
  }

  // Botones "show_" para mostrar más documentos de un tipo
  if (interactive.startsWith('show_')) {
    // Por ahora responder con mensaje simple
    await sendWhatsAppMessage(phoneNumber, 'Contáctanos para más documentos.');
    return { handled: true };
  }

  return { handled: false };
}

// Manejar texto de período (cuando usuario escribe "2026-03" después de pedir IVA)
export async function handlePeriodText(
  text: string,
  lastButton: string | null,
  phoneNumber: string,
  conversationId: string,
  contactId: string,
  companyId: string | null
): Promise<HandlerResponse> {
  // IVA: formato YYYY-MM
  if (lastButton === BUTTON_IDS.DOC_IVA) {
    const period = text.trim();
    if (!/^\d{4}-\d{2}$/.test(period)) {
      await sendWhatsAppMessage(phoneNumber, 'Formato inválido. Usa YYYY-MM (ej: 2026-03).');
      return { handled: true };
    }
    return await sendDocumentByQuery(phoneNumber, conversationId, contactId, companyId, `iva ${period}`);
  }

  // Renta: formato YYYY
  if (lastButton === BUTTON_IDS.DOC_RENTA) {
    const year = text.trim();
    if (!/^\d{4}$/.test(year)) {
      await sendWhatsAppMessage(phoneNumber, 'Formato inválido. Usa solo el año (ej: 2025).');
      return { handled: true };
    }
    return await sendDocumentByQuery(phoneNumber, conversationId, contactId, companyId, `renta ${year}`);
  }

  // Balance: formato YYYY
  if (lastButton === BUTTON_IDS.DOC_CAT_ACCOUNTING || lastButton === BUTTON_IDS.DOC_BALANCE) {
    const year = text.trim();
    if (!/^\d{4}$/.test(year)) {
      await sendWhatsAppMessage(phoneNumber, 'Formato inválido. Usa solo el año (ej: 2025).');
      return { handled: true };
    }
    return await sendDocumentByQuery(phoneNumber, conversationId, contactId, companyId, `balance ${year}`);
  }

  // Liquidaciones: "YYYY-MM Nombre"
  if (lastButton === BUTTON_IDS.DOC_LIQUIDACIONES) {
    const m = text.trim().match(/^(\d{4}-\d{2})\s+(.+)$/);
    if (!m) {
      await sendWhatsAppMessage(phoneNumber, 'Formato inválido. Ejemplo: "2026-03 Juan Perez".');
      return { handled: true };
    }
    const period = m[1];
    const employee = m[2].trim();
    return await sendDocumentByQuery(phoneNumber, conversationId, contactId, companyId, `liquidacion ${period} ${employee}`);
  }

  return { handled: false };
}

// Solicitar documento (crear ticket)
export async function requestDocument(
  phoneNumber: string,
  conversationId: string,
  contactId: string,
  description: string,
  companyId: string | null
): Promise<HandlerResponse> {
  const requestCode = `DOC-${Date.now().toString(36).toUpperCase()}`;
  
  const { error } = await getSupabaseAdmin()
    .from('service_requests')
    .insert({
      request_code: requestCode,
      contact_id: contactId,
      conversation_id: conversationId,
      company_id: companyId || null,
      request_type: 'document',
      description: description,
      status: 'pending',
    });

  if (error) {
    console.error('[RequestDoc] Error:', error);
    const msg = 'Hubo un problema al registrar tu solicitud. Un asesor te contactará pronto.';
    await sendWhatsAppMessage(phoneNumber, msg);
    return { handled: true };
  }

  const msg = `Solicitud registrada ✅\n\n📋 Código: ${requestCode}\n📌 Tipo: Documento\n⏳ Estado: Pendiente\n\nUn asesor te contactará pronto.`;
  await sendWhatsAppMessage(phoneNumber, msg);

  return { handled: true };
}

// Menú de categorías de documentos
export async function handleDocCategoryButton(
  interactive: string,
  phoneNumber: string,
  contactId: string,
  companyId: string | null
): Promise<HandlerResponse> {
  if (interactive === BUTTON_IDS.DOC_CAT_TAX) {
    await sendTaxDocMenu(phoneNumber, contactId, companyId);
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

// Función auxiliar para menú de IVAs
async function sendTaxDocMenu(
  phoneNumber: string,
  contactId: string,
  companyId: string | null
): Promise<void> {
  const { data: ivaDocs } = await getSupabaseAdmin()
    .from('client_documents')
    .select('id, title, file_url')
    .eq('contact_id', contactId)
    .eq('company_id', companyId || null)
    .ilike('title', '%iva%')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!ivaDocs || ivaDocs.length === 0) {
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
    rows.push({ id: 'human', title: '📞 Hablar con asesor', description: 'Contacto directo' });

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
    title: doc.title
  }));

  buttons.push({ id: BUTTON_IDS.EXISTING_REQUEST_DOC, title: '📋 Solicitar IVA' });
  buttons.push({ id: BUTTON_IDS.EXISTING_HUMAN, title: '📞 Hablar con asesor' });

  await sendWhatsAppInteractiveButtons(
    phoneNumber,
    `🧾 Tienes ${ivaDocs.length} IVAs disponibles. ¿Cuál quieres ver?`,
    buttons
  );
}