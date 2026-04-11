import { getSupabaseAdmin } from '../supabase-admin';
import { BUTTON_IDS, HandlerResponse, Contact } from '../types';

export async function handleClassification(
  interactive: string | undefined,
  contact: Contact
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
      .update({ segment: 'prospecto' })
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
    .update({ segment: 'prospecto' })
    .eq('id', contact.id);
  
  console.log('🆕 Contacto clasificado automáticamente como prospecto');
  return true;
}

export function isKnownClient(contact: Contact): boolean {
  return contact.segment === 'cliente';
}

export function getSegmentLabel(segment: string | null | undefined): string {
  if (segment === 'cliente') return 'cliente';
  if (segment === 'prospecto') return 'prospecto';
  return 'sin clasificar';
}