import { SupabaseClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '../whatsapp';

/**
 * Módulo de Menús Interactivos v10.2
 * Envía listas de opciones al usuario para evitar cálculos de la IA.
 */
export async function handleOfferMenusAction(
  supabase: SupabaseClient,
  actionData: any,
  companyId: string,
  messageId: string
) {
  const results: any[] = [];

  // 1. Obtener Identidad (Teléfono) desde el mensaje original
  const { data: msgInfo } = await supabase
    .from('messages')
    .select('conversation_id')
    .eq('id', messageId)
    .single();

  if (!msgInfo) {
    return [{ action: 'offer_menus', status: 'failed', error: 'Message not found' }];
  }

  const { data: contactInfo } = await supabase
    .from('conversations')
    .select('contacts(phone)')
    .eq('id', msgInfo.conversation_id)
    .single();

  const phone = (contactInfo as any)?.contacts?.phone;

  if (!phone) {
    return [{ action: 'offer_menus', status: 'failed', error: 'Phone not found' }];
  }

  // 2. Obtener Configuración WhatsApp
  const { data: companyData } = await supabase
    .from('companies')
    .select('settings')
    .eq('id', companyId)
    .single();

  const whatsappToken = companyData?.settings?.whatsapp?.access_token || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = companyData?.settings?.whatsapp?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;


  if (!whatsappToken || !phoneNumberId) {
    return [{ action: 'offer_menus', status: 'failed', error: 'Missing WhatsApp config' }];
  }

  // 3. Enviar Menú Interactivo de Reportes (IDs exactos para el Router)
  await sendWhatsAppMessage({
    to: phone,
    text: "He preparado el acceso a tus reportes oficiales. Por favor, selecciona el que deseas generar:",
    options: [
      { id: 'pdf_8columnas', title: '📊 Balance 8 Columnas', description: 'Resumen tributario completo' },
      { id: 'pdf_resultados', title: '📈 Estado Resultados', description: 'Pérdidas y Ganancias (P&L)' },
      { id: 'pdf_inventory', title: '📦 Inventario Maestro', description: 'Stock y Valorización' },
      { id: 'pdf_ventas', title: '💰 Ventas Mensuales', description: 'Reporte de facturación' },
      { id: 'pdf_remuneraciones', title: '👔 Remuneraciones', description: 'Liquidaciones y costos de personal' }
    ],

    phoneNumberId,
    whatsappToken,
    companyId
  });

  results.push({ action: 'offer_menus', status: 'success', to: phone });
  return results;
}
