// lib/handlers/menu-handler.ts
// Maneja el envío de menús interactivos

import { getSupabaseAdmin } from '../supabase-admin';
import { sendWhatsAppInteractiveButtons, sendWhatsAppMessage } from '../whatsapp-service';
import { BUTTON_IDS, Contact, Company, HandlerResponse } from './types';

const WELCOME_KEYWORDS = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'buenas', 'saludos'];

export function isGreeting(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return WELCOME_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

// Envía menú de bienvenida según el segmento
export async function sendWelcomeMenu(
  phoneNumber: string,
  contact: Contact
): Promise<void> {
  if (contact.segment === 'cliente') {
    await sendClientMenu(phoneNumber, contact);
  } else {
    await sendProspectMenu(phoneNumber);
  }
}

// Menú para clientes
async function sendClientMenu(phoneNumber: string, contact: Contact): Promise<void> {
  const name = contact.name?.trim() || 'cliente';
  
  // Verificar si tiene documentos
  const { data: docs } = await getSupabaseAdmin()
    .from('client_documents')
    .select('id')
    .eq('contact_id', contact.id)
    .limit(1);

  const hasDocs = docs && docs.length > 0;

  const greetingText = hasDocs
    ? `¡Hola ${name}! 👋 Tengo tus documentos listos. ¿Qué necesitas?`
    : `¡Hola ${name}! 👋 No tengo documentos cargados aún. ¿Qué necesitas?`;

  const buttons = [
    ...(hasDocs
      ? [{ id: BUTTON_IDS.EXISTING_DOCS, title: '📄 Ver mis documentos' as const }]
      : [{ id: BUTTON_IDS.EXISTING_REQUEST_DOC, title: '📋 Solicitar documento' as const }]),
    { id: BUTTON_IDS.EXISTING_TAX, title: '🧾 IVAs declarados' },
    { id: BUTTON_IDS.CHECK_REQUEST_STATUS, title: '🔎 Mis solicitudes' },
    { id: BUTTON_IDS.EXISTING_HUMAN, title: '📞 Hablar con asesor' },
  ];

  await sendWhatsAppInteractiveButtons(phoneNumber, greetingText, buttons);
}

// Menú para prospectos
async function sendProspectMenu(phoneNumber: string): Promise<void> {
  await sendWhatsAppInteractiveButtons(
    phoneNumber,
    '¡Hola! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte?',
    [
      { id: BUTTON_IDS.NEW_QUOTE, title: '💼 Quiero cotizar' },
      { id: BUTTON_IDS.NEW_INFO, title: '📝 Más información' },
      { id: BUTTON_IDS.CHECK_REQUEST_STATUS, title: '🔎 Estado solicitud' },
      { id: BUTTON_IDS.NEW_HUMAN, title: '📞 Hablar con asesor' },
    ]
  );
}

// Procesar botones del menú
export async function handleMenuButton(
  interactive: string,
  phoneNumber: string,
  contact: Contact,
  companies: Company[],
  activeCompanyId: string | null
): Promise<HandlerResponse> {
  // Menú cliente: Ver documentos
  if (interactive === BUTTON_IDS.EXISTING_DOCS) {
    await sendDocumentsCategoryMenu(phoneNumber, contact.id, activeCompanyId);
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
    await sendTaxDocMenu(phoneNumber, contact.id, activeCompanyId);
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

// Menú de categorías de documentos
async function sendDocumentsCategoryMenu(
  phoneNumber: string,
  contactId: string,
  companyId: string | null
): Promise<void> {
  const { data: docs } = await getSupabaseAdmin()
    .from('client_documents')
    .select('id, title, file_name, created_at')
    .eq('contact_id', contactId)
    .eq('company_id', companyId || null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!docs || docs.length === 0) {
    await sendWhatsAppMessage(
      phoneNumber,
      '📋 No tengo documentos cargados para ti aún. ¿Prefieres solicitar alguno o hablar con un asesor?'
    );
    return;
  }

  // Agrupar por tipo
  const ivaDocs = docs.filter(d => d.title.toLowerCase().includes('iva'));
  const rentaDocs = docs.filter(d => d.title.toLowerCase().includes('renta'));
  const balanceDocs = docs.filter(d => d.title.toLowerCase().includes('balance'));

  const buttons: { id: string; title: string }[] = [];

  if (ivaDocs.length > 0) {
    buttons.push({ id: 'show_iva', title: `🧾 IVA: ${ivaDocs[0].title}` });
  }
  if (rentaDocs.length > 0) {
    buttons.push({ id: 'show_renta', title: `📊 Renta: ${rentaDocs[0].title}` });
  }
  if (balanceDocs.length > 0) {
    buttons.push({ id: 'show_balance', title: `📈 Balance: ${balanceDocs[0].title}` });
  }

  buttons.push({ id: BUTTON_IDS.EXISTING_REQUEST_DOC, title: '📋 Solicitar otro' });
  buttons.push({ id: BUTTON_IDS.EXISTING_HUMAN, title: '📞 Hablar con asesor' });

  await sendWhatsAppInteractiveButtons(
    phoneNumber,
    `📄 Tienes ${docs.length} documentos disponibles. ¿Cuál ver?`,
    buttons
  );
}

// Menú de impuestos (IVAs)
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
    .limit(6);

  if (!ivaDocs || ivaDocs.length === 0) {
    await sendWhatsAppMessage(
      phoneNumber,
      '🧾 No tengo IVAs declarados cargados aún. ¿Prefieres solicitar uno o hablar con un asesor?'
    );
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

// Derivación a humano (común para ambos)
export async function deriveToHuman(phoneNumber: string): Promise<void> {
  const msg = 'Entiendo. Un asesor especializado de MTZ se comunicará contigo desde este número en breve. Gracias por tu paciencia.';
  await sendWhatsAppMessage(phoneNumber, msg);
}