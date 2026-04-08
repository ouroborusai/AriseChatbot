// lib/handlers/classification-handler.ts
// Maneja clasificación cliente/prospecto y segmentación

import { getSupabaseAdmin } from '../supabase-admin';
import { BUTTON_IDS, HandlerContext, HandlerResponse } from './types';

export async function handleClassification(
  interactive: string | undefined,
  contact: { id: string; name?: string | null }
): Promise<HandlerResponse> {
  // Botón: Sí soy cliente
  if (interactive === BUTTON_IDS.CLIENT_YES) {
    await getSupabaseAdmin()
      .from('contacts')
      .update({ segment: 'cliente' })
      .eq('id', contact.id);

    const name = contact.name ? ` ${contact.name}` : '';
    const responseText = `¡Hola${name}! 👋 Bienvenido de vuelta a MTZ Consultores. ¿En qué puedo ayudarte hoy?`;
    
    return {
      handled: true,
      response: responseText,
      shouldContinue: false, // No ir a Gemini, enviar menú después
    };
  }

  // Botón: No soy nuevo
  if (interactive === BUTTON_IDS.CLIENT_NO) {
    await getSupabaseAdmin()
      .from('contacts')
      .update({ segment: 'prospect' })
      .eq('id', contact.id);

    return {
      handled: true,
      response: '¡Hola! 👋 Bienvenido a MTZ Consultores. ¿En qué podemos ayudarte?',
      shouldContinue: false,
    };
  }

  return { handled: false };
}

export async function autoClassifyAsProspect(
  contact: { id: string }
): Promise<boolean> {
  await getSupabaseAdmin()
    .from('contacts')
    .update({ segment: 'prospect' })
    .eq('id', contact.id);
  
  console.log('🆕 Contacto clasificado automáticamente como prospecto');
  return true;
}

export function isKnownClient(contact: { segment?: string | null }): boolean {
  return contact.segment === 'cliente';
}

export function getSegmentLabel(segment: string | null | undefined): string {
  if (segment === 'cliente') return 'cliente';
  if (segment === 'prospect') return 'prospect';
  return 'sin clasificar';
}