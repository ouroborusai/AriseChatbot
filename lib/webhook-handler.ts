/**
 * Webhook Handler - Versión Simplificada con Gemini
 * La IA maneja las respuestas directamente, solo mantenemos saludos y detección de ayuda humana
 */

import { generateAssistantReply, getSystemPromptCached } from './ai-service';
import { sendWhatsAppDocument, sendWhatsAppInteractiveButtons, sendWhatsAppMessage } from './whatsapp-service';
import {
  getLatestClientDocuments,
  findLatestClientDocumentByQuery,
  listCompaniesForContact,
  getActiveCompanyForConversation,
  setActiveCompanyForConversation,
  getOrCreateContact,
  getOrCreateConversation,
  saveMessage,
  getConversationHistory,
} from './database-service';
import { getSupabaseAdmin } from './supabase-admin';

type InboundMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
};

const WELCOME_KEYWORDS = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'buenas', 'saludos'];
const HUMAN_KEYWORDS = ['humano', 'asesor', 'urgente', 'multa', 'fiscalización', 'fiscalizacion', 'sii', 'demanda', 'reclamo'];

const BTN_EXISTING_DOCS = 'btn_existing_docs';
const BTN_EXISTING_TAX = 'btn_existing_tax';
const BTN_EXISTING_HUMAN = 'btn_existing_human';
const BTN_EXISTING_REQUEST_DOC = 'btn_existing_request_doc';

const BTN_NEW_QUOTE = 'btn_new_quote';
const BTN_NEW_INFO = 'btn_new_info';
const BTN_NEW_HUMAN = 'btn_new_human';

// Document menu (2 niveles)
const BTN_DOC_CAT_TAX = 'btn_doc_cat_tax';
const BTN_DOC_CAT_ACCOUNTING = 'btn_doc_cat_accounting';
const BTN_DOC_CAT_PAYROLL_CONTRACTS = 'btn_doc_cat_payroll_contracts';

const BTN_DOC_IVA = 'btn_doc_iva';
const BTN_DOC_RENTA = 'btn_doc_renta';
const BTN_DOC_BALANCE = 'btn_doc_balance';

const BTN_DOC_LIQUIDACIONES = 'btn_doc_liquidaciones';
const BTN_DOC_CONTRATOS = 'btn_doc_contratos';

const BTN_SELECT_COMPANY = 'btn_select_company';
const BTN_COMPANY_FREE_TEXT = 'btn_company_free_text';
const COMPANY_BTN_PREFIX = 'company:';

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase();
}

function isGreeting(message: string): boolean {
  const normalized = normalizeMessage(message);
  return WELCOME_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function wantsHumanAgent(message: string): boolean {
  const normalized = normalizeMessage(message);
  return HUMAN_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function wantsChangeCompany(message: string): boolean {
  const m = normalizeMessage(message);
  return m.includes('cambiar empresa') || m.includes('otra empresa') || m === 'empresa' || m === 'empresas';
}

function isKnownClient(contact: { name?: string; segment?: string }): boolean {
  if (contact.segment && contact.segment.toLowerCase() === 'cliente') return true;
  return Boolean(contact.name && contact.name.trim().length > 0);
}

function getLastButtonFromHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const c = history[i]?.content || '';
    if (c.startsWith('[button:') && c.endsWith(']')) {
      return c.slice('[button:'.length, -1);
    }
  }
  return null;
}

async function sendDocumentsCategoryMenu(phoneNumber: string): Promise<void> {
  await sendWhatsAppInteractiveButtons(
    phoneNumber,
    '¿Qué tipo de documento necesitas?',
    [
      { id: BTN_DOC_CAT_TAX, title: '🧾 Impuestos' },
      { id: BTN_DOC_CAT_ACCOUNTING, title: '📊 Balance' },
      { id: BTN_DOC_CAT_PAYROLL_CONTRACTS, title: '📄 Contratos / Nómina' },
    ]
  );
}

async function sendTaxDocMenu(phoneNumber: string): Promise<void> {
  await sendWhatsAppInteractiveButtons(
    phoneNumber,
    'Selecciona el documento de impuestos:',
    [
      { id: BTN_DOC_IVA, title: 'IVA (mes)' },
      { id: BTN_DOC_RENTA, title: 'Renta (año)' },
      { id: BTN_EXISTING_HUMAN, title: '📞 Asesor' },
    ]
  );
}

async function sendPayrollContractsMenu(phoneNumber: string): Promise<void> {
  await sendWhatsAppInteractiveButtons(
    phoneNumber,
    'Selecciona una opción:',
    [
      { id: BTN_DOC_LIQUIDACIONES, title: '💰 Liquidaciones' },
      { id: BTN_DOC_CONTRATOS, title: '📄 Contratos' },
      { id: BTN_EXISTING_HUMAN, title: '📞 Asesor' },
    ]
  );
}

async function sendDocumentIfAvailable(
  phoneNumber: string,
  conversationId: string,
  contactId: string,
  activeCompanyId: string | null,
  query: string,
  notFoundMessage: string
): Promise<boolean> {
  const doc = await findLatestClientDocumentByQuery(contactId, query, activeCompanyId);
  if (!doc) {
    await saveMessage(conversationId, 'assistant', notFoundMessage);
    await sendWhatsAppMessage(phoneNumber, notFoundMessage);
    return false;
  }

  let url: string | null = null;
  if (doc.storage_bucket && doc.storage_path) {
    const { data, error } = await getSupabaseAdmin()
      .storage
      .from(doc.storage_bucket)
      .createSignedUrl(doc.storage_path, 60 * 10);
    if (error || !data?.signedUrl) {
      const msg = 'Encontré tu documento, pero falló la generación del enlace seguro. Te derivamos con un asesor.';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      return false;
    }
    url = data.signedUrl;
  } else if (doc.file_url) {
    url = doc.file_url;
  }

  if (!url) {
    const msg = `Encontré "${doc.title}" pero no tiene URL configurada.`;
    await saveMessage(conversationId, 'assistant', msg);
    await sendWhatsAppMessage(phoneNumber, msg);
    return false;
  }

  await sendWhatsAppDocument(
    phoneNumber,
    url,
    doc.file_name || `${doc.title}.pdf`,
    `Aquí tienes: ${doc.title}`
  );
  await saveMessage(conversationId, 'assistant', `Documento enviado: ${doc.title}`);
  return true;
}

async function sendCompanySelectionMenu(
  phoneNumber: string,
  companies: Array<{ id: string; legal_name: string }>
): Promise<void> {
  const firstTwo = companies.slice(0, 2);
  const buttons = [
    ...firstTwo.map((c) => ({ id: `${COMPANY_BTN_PREFIX}${c.id}`, title: c.legal_name.slice(0, 20) })),
    { id: BTN_COMPANY_FREE_TEXT, title: '📝 Escribir empresa' },
  ].slice(0, 3);

  await sendWhatsAppInteractiveButtons(
    phoneNumber,
    '¿Para qué empresa necesitas la gestión?',
    buttons
  );
}

async function sendWelcomeMenu(phoneNumber: string, contact: { id?: string; name?: string; segment?: string }): Promise<void> {
  if (isKnownClient(contact)) {
    const name = contact.name?.trim() || 'cliente';
    const docs = await getLatestClientDocuments(contact.id || '', 1).catch(() => []);
    const hasDocs = docs.length > 0;

    const buttons = [
      ...(hasDocs
        ? [{ id: BTN_EXISTING_DOCS, title: '📄 Mis documentos' as const }]
        : [{ id: BTN_EXISTING_REQUEST_DOC, title: '📎 Solicitar documento' as const }]),
      { id: BTN_EXISTING_TAX, title: '🧾 Mis impuestos' },
      { id: BTN_EXISTING_HUMAN, title: '📞 Hablar con asesor' },
    ];

    await sendWhatsAppInteractiveButtons(
      phoneNumber,
      `Hola ${name}. ¿Qué necesitas hoy?`,
      buttons
    );
    return;
  }

  await sendWhatsAppInteractiveButtons(
    phoneNumber,
    'Hola. Bienvenido a MTZ Consultores Tributarios. ¿Cómo te gustaría iniciar?',
    [
      { id: BTN_NEW_QUOTE, title: '💼 Quiero cotizar' },
      { id: BTN_NEW_INFO, title: '📝 Más información' },
      { id: BTN_NEW_HUMAN, title: '📞 Hablar con asesor' },
    ]
  );
}

/**
 * Procesa un mensaje inbound de WhatsApp - Gemini maneja casi todo
 */
export async function handleInboundUserMessage(messageData: InboundMessage): Promise<void> {
  const phoneNumber = messageData.from;
  const text = messageData.text?.body?.trim();
  const interactive =
    messageData.interactive?.button_reply?.id ||
    messageData.interactive?.list_reply?.id;

  console.log('🚀 WEBHOOK: Mensaje de', phoneNumber, '- Texto:', text?.slice(0, 50));

  if (!phoneNumber) {
    console.log('❌ Ignorado: falta teléfono');
    return;
  }

  // Ignorar números del sistema
  const ignoreFrom = process.env.WHATSAPP_IGNORE_INBOUND_FROM?.trim();
  if (ignoreFrom && phoneNumber.includes(ignoreFrom)) {
    console.log('❌ Ignorado: número del sistema');
    return;
  }

  try {
    // 1. Contacto y conversación
    const contact = await getOrCreateContact(phoneNumber);
    const conversationId = await getOrCreateConversation(phoneNumber, contact.id);

    // Empresas vinculadas
    const companies = await listCompaniesForContact(contact.id);
    const activeCompanyId = await getActiveCompanyForConversation(conversationId);

    // 2. Guardar mensaje del usuario (texto o interacción)
    if (text) {
      await saveMessage(conversationId, 'user', text);
    } else if (interactive) {
      await saveMessage(conversationId, 'user', `[button:${interactive}]`);
    } else {
      console.log('❌ Ignorado: mensaje sin texto ni interacción');
      return;
    }

    // Selección de empresa (botones)
    if (interactive && interactive.startsWith(COMPANY_BTN_PREFIX)) {
      const companyId = interactive.slice(COMPANY_BTN_PREFIX.length);
      await setActiveCompanyForConversation(conversationId, companyId);
      const msg = 'Perfecto. Ya seleccioné la empresa para esta conversación.';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      await sendWelcomeMenu(phoneNumber, { ...contact, id: contact.id });
      return;
    }

    if (interactive === BTN_COMPANY_FREE_TEXT) {
      const msg = 'Escribe el nombre (o parte) de la empresa tal como aparece en tu lista.';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    // 3. ¿Quiere hablar con humano?
    if ((text && wantsHumanAgent(text)) || interactive === BTN_EXISTING_HUMAN || interactive === BTN_NEW_HUMAN) {
      const humanMessage = 'Entiendo. Un asesor especializado de MTZ se comunicará contigo desde este número en breve. Gracias por tu paciencia.';
      await saveMessage(conversationId, 'assistant', humanMessage);
      await sendWhatsAppMessage(phoneNumber, humanMessage);
      console.log('✅ Derivado a humano');
      return;
    }

    // Si es cliente conocido y tiene múltiples empresas, exigir selección (sin IA)
    if (isKnownClient(contact) && companies.length > 1) {
      const mustChoose = !activeCompanyId;
      const askedToChange = text ? wantsChangeCompany(text) : false;
      if (mustChoose || interactive === BTN_SELECT_COMPANY || askedToChange) {
        await sendCompanySelectionMenu(phoneNumber, companies);
        return;
      }
    } else if (isKnownClient(contact) && companies.length === 1 && !activeCompanyId) {
      // Auto-fijar empresa si hay solo una
      await setActiveCompanyForConversation(conversationId, companies[0].id);
    }

    // Selección por texto libre de empresa
    if (text && isKnownClient(contact) && companies.length > 1 && !activeCompanyId) {
      const q = text.trim().toLowerCase();
      const match = companies.find((c) => c.legal_name.toLowerCase().includes(q));
      if (match) {
        await setActiveCompanyForConversation(conversationId, match.id);
        const msg = `Listo. Empresa seleccionada: ${match.legal_name}`;
        await saveMessage(conversationId, 'assistant', msg);
        await sendWhatsAppMessage(phoneNumber, msg);
        await sendWelcomeMenu(phoneNumber, { ...contact, id: contact.id });
        return;
      }
    }

    // 4. Saludo inicial / primera guía: SIEMPRE menú (sin Gemini)
    if (text && isGreeting(text)) {
      // Si es un saludo o un mensaje normal sin selección previa, guiamos con menú.
      await sendWelcomeMenu(phoneNumber, { ...contact, id: contact.id });
      console.log('✅ Menú de bienvenida enviado');
      return;
    }

    // 5. Acciones para clientes existentes
    if (interactive === BTN_EXISTING_DOCS) {
      await sendDocumentsCategoryMenu(phoneNumber);
      return;
    }

    if (interactive === BTN_EXISTING_REQUEST_DOC) {
      const msg = '¿Qué documento necesitas? (por ejemplo: “Declaración IVA Marzo 2026”, “F29”, “Balance”, “Contrato”)';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    // Menús de documentos (categorías)
    if (interactive === BTN_DOC_CAT_TAX) {
      await sendTaxDocMenu(phoneNumber);
      return;
    }
    if (interactive === BTN_DOC_CAT_ACCOUNTING) {
      // Balance directo por año
      const msg = '¿Qué año de balance necesitas? (ej: 2025)';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }
    if (interactive === BTN_DOC_CAT_PAYROLL_CONTRACTS) {
      await sendPayrollContractsMenu(phoneNumber);
      return;
    }

    // Selección de doc específico (pedimos período)
    if (interactive === BTN_DOC_IVA) {
      const msg = 'Indica el período IVA en formato YYYY-MM (ej: 2026-03).';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }
    if (interactive === BTN_DOC_RENTA) {
      const msg = 'Indica el año de Renta (ej: 2025).';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }
    if (interactive === BTN_DOC_LIQUIDACIONES) {
      const msg = 'Indica mes (YYYY-MM) y nombre del trabajador. Ej: "2026-03 Juan Perez".';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }
    if (interactive === BTN_DOC_CONTRATOS) {
      const msg = '¿Qué contrato necesitas? (ej: "servicio contable", "nómina", "otro") y año si aplica.';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    if (interactive === BTN_EXISTING_TAX) {
      const msg = 'Perfecto. ¿De qué período necesitas información (mes/año) y sobre qué impuesto?';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    // 6. Prospectos
    if (interactive === BTN_NEW_QUOTE) {
      const msg = 'Para cotizar: ¿tu actividad económica y cuántos documentos/emisiones tienes al mes (aprox.)?';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }
    if (interactive === BTN_NEW_INFO) {
      const msg = '¿Te interesa contabilidad, impuestos, nómina o regularizaciones?';
      await saveMessage(conversationId, 'assistant', msg);
      await sendWhatsAppMessage(phoneNumber, msg);
      return;
    }

    // Router por último botón (si el usuario responde con texto al período)
    if (text) {
      const history = await getConversationHistory(phoneNumber);
      const lastBtn = getLastButtonFromHistory(history);
      const companyIdForDocs = await getActiveCompanyForConversation(conversationId);

      // IVA YYYY-MM
      if (lastBtn === BTN_DOC_IVA) {
        const period = text.trim();
        const ok = /^\d{4}-\d{2}$/.test(period);
        if (!ok) {
          const msg = 'Formato inválido. Usa YYYY-MM (ej: 2026-03).';
          await saveMessage(conversationId, 'assistant', msg);
          await sendWhatsAppMessage(phoneNumber, msg);
          return;
        }
        await sendDocumentIfAvailable(
          phoneNumber,
          conversationId,
          contact.id,
          companyIdForDocs,
          `iva ${period}`,
          `No tengo cargado el IVA ${period} todavía. ¿Quieres que un asesor lo gestione?`
        );
        return;
      }

      // Renta YYYY
      if (lastBtn === BTN_DOC_RENTA) {
        const year = text.trim();
        const ok = /^\d{4}$/.test(year);
        if (!ok) {
          const msg = 'Formato inválido. Usa solo el año (ej: 2025).';
          await saveMessage(conversationId, 'assistant', msg);
          await sendWhatsAppMessage(phoneNumber, msg);
          return;
        }
        await sendDocumentIfAvailable(
          phoneNumber,
          conversationId,
          contact.id,
          companyIdForDocs,
          `renta ${year}`,
          `No tengo cargada la Renta ${year} todavía. ¿Quieres que un asesor lo gestione?`
        );
        return;
      }

      // Balance YYYY (lo pedimos desde BTN_DOC_CAT_ACCOUNTING)
      if (lastBtn === BTN_DOC_CAT_ACCOUNTING || lastBtn === BTN_DOC_BALANCE) {
        const year = text.trim();
        const ok = /^\d{4}$/.test(year);
        if (!ok) {
          const msg = 'Formato inválido. Usa solo el año (ej: 2025).';
          await saveMessage(conversationId, 'assistant', msg);
          await sendWhatsAppMessage(phoneNumber, msg);
          return;
        }
        await sendDocumentIfAvailable(
          phoneNumber,
          conversationId,
          contact.id,
          companyIdForDocs,
          `balance ${year}`,
          `No tengo cargado el Balance ${year} todavía. ¿Quieres que un asesor lo gestione?`
        );
        return;
      }

      // Liquidaciones: "YYYY-MM Nombre Apellido"
      if (lastBtn === BTN_DOC_LIQUIDACIONES) {
        const m = text.trim().match(/^(\d{4}-\d{2})\s+(.+)$/);
        if (!m) {
          const msg = 'Formato inválido. Ejemplo: "2026-03 Juan Perez".';
          await saveMessage(conversationId, 'assistant', msg);
          await sendWhatsAppMessage(phoneNumber, msg);
          return;
        }
        const period = m[1];
        const employee = m[2].trim();
        await sendDocumentIfAvailable(
          phoneNumber,
          conversationId,
          contact.id,
          companyIdForDocs,
          `liquidacion ${period} ${employee}`,
          `No tengo cargada la liquidación ${period} de ${employee}. ¿Quieres que un asesor lo gestione?`
        );
        return;
      }

      // Contratos: texto libre
      if (lastBtn === BTN_DOC_CONTRATOS) {
        await sendDocumentIfAvailable(
          phoneNumber,
          conversationId,
          contact.id,
          companyIdForDocs,
          `contrato ${text.trim()}`,
          'No encuentro ese contrato cargado todavía. ¿Quieres que un asesor lo gestione?'
        );
        return;
      }
    }

    // 7. Fallback: solo aquí usamos Gemini (consulta abierta / conversación)
    const systemPrompt = await getSystemPromptCached();
    const history = await getConversationHistory(phoneNumber);
    const aiResponse = await generateAssistantReply(systemPrompt, history, text || '');

    await saveMessage(conversationId, 'assistant', aiResponse);
    await sendWhatsAppMessage(phoneNumber, aiResponse);

    console.log('✅ Respuesta Gemini enviada');

  } catch (error) {
    console.error('💥 ERROR:', error);
    throw error;
  }
}
