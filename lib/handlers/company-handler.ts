// lib/handlers/company-handler.ts
// Maneja selección de empresa

import { getSupabaseAdmin } from '../supabase-admin';
import { sendWhatsAppMessage, sendWhatsAppInteractiveButtons } from '../whatsapp-service';
import { BUTTON_IDS, Company, HandlerResponse } from './types';

const COMPANY_PREFIX = 'company_';

// Manejar selección de empresa por botón
export async function handleCompanyButton(
  interactive: string,
  phoneNumber: string,
  conversationId: string,
  companies: Company[]
): Promise<HandlerResponse> {
  // Botón de empresa específica (company_<id>)
  if (interactive.startsWith(COMPANY_PREFIX)) {
    const companyId = interactive.replace(COMPANY_PREFIX, '');
    
    await getSupabaseAdmin()
      .from('conversations')
      .update({ active_company_id: companyId })
      .eq('id', conversationId);

    const selectedCompany = companies.find(c => c.id === companyId);
    const msg = selectedCompany 
      ? `Perfecto. Empresa seleccionada: ${selectedCompany.legal_name}`
      : 'Empresa seleccionada.';
    
    await sendWhatsAppMessage(phoneNumber, msg);
    return { handled: true };
  }

  // Botón para escribir empresa
  if (interactive === BUTTON_IDS.COMPANY_FREE_TEXT) {
    await sendWhatsAppMessage(
      phoneNumber,
      'Escribe el nombre (o parte) de la empresa tal como aparece en tu lista.'
    );
    return { handled: true };
  }

  // Botón de selección de empresa
  if (interactive === BUTTON_IDS.SELECT_COMPANY) {
    await sendCompanySelectionMenu(phoneNumber, companies);
    return { handled: true };
  }

  return { handled: false };
}

// Manejar texto libre para seleccionar empresa
export async function handleCompanyText(
  text: string,
  phoneNumber: string,
  conversationId: string,
  companies: Company[]
): Promise<HandlerResponse> {
  if (companies.length <= 1) {
    return { handled: false }; // No necesita selección
  }

  const query = text.trim().toLowerCase();
  const match = companies.find(c => c.legal_name.toLowerCase().includes(query));

  if (match) {
    await getSupabaseAdmin()
      .from('conversations')
      .update({ active_company_id: match.id })
      .eq('id', conversationId);

    await sendWhatsAppMessage(
      phoneNumber,
      `Perfecto. Empresa seleccionada: ${match.legal_name}`
    );
    return { handled: true };
  }

  // No encontró coincidencia
  await sendWhatsAppMessage(
    phoneNumber,
    'No encontré esa empresa. ¿Podrías escribir el nombre más exacto?'
  );
  return { handled: true };
}

// Auto-seleccionar empresa si solo hay una
export async function autoSelectCompany(
  conversationId: string,
  companies: Company[]
): Promise<string | null> {
  if (companies.length === 1) {
    const companyId = companies[0].id;
    
    await getSupabaseAdmin()
      .from('conversations')
      .update({ active_company_id: companyId })
      .eq('id', conversationId);

    return companyId;
  }

  return null;
}

// Mostrar menú de selección de empresa
async function sendCompanySelectionMenu(
  phoneNumber: string,
  companies: Company[]
): Promise<void> {
  const firstTwo = companies.slice(0, 2);
  
  const buttons = [
    ...firstTwo.map(c => ({ 
      id: `${COMPANY_PREFIX}${c.id}`, 
      title: c.legal_name.slice(0, 25) 
    })),
    { id: BUTTON_IDS.COMPANY_FREE_TEXT, title: '📝 Escribir nombre' },
  ].slice(0, 3);

  await sendWhatsAppInteractiveButtons(
    phoneNumber,
    '¿Para qué empresa necesitas la gestión?',
    buttons
  );
}