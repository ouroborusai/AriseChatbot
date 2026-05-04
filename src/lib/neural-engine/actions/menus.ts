import { SupabaseClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '../whatsapp';
import { NeuralActionResult, NeuralActionPayload } from '@/lib/whatsapp/types';

/**
 *  Módulo de Menús Interactivos v12.0 (Diamond Resilience)
 *  Envía listas de opciones al usuario para evitar cálculos de la IA.
 *  SSOT: Cero 'any', Extracción estricta y Blindaje Tenant en el Join.
 */
export async function handleOfferMenusAction(
    supabase: SupabaseClient,
    actionData: NeuralActionPayload,
    companyId: string,
    messageId: string
): Promise<NeuralActionResult[]> {
    const results: NeuralActionResult[] = [];

    try {
        // 🛡️ AISLAMIENTO TENANT OBLIGATORIO (Bypass Resiliencia v12.0)
        const conversationId = actionData.conversation_id as string;
        let phone = actionData.phone_number as string;

        // Si no tenemos el teléfono en la maleta, lo buscamos en la conversación (único fetch necesario)
        if (!phone && conversationId) {
            const { data: contactInfo } = await supabase
                .from('conversations')
                .select('contacts!inner(phone)')
                .eq('id', conversationId)
                .eq('company_id', companyId)
                .single();
            
            if (contactInfo) {
                phone = (contactInfo.contacts as unknown as { phone: string }).phone;
            }
        }

        if (!phone) {
            results.push({ action: 'offer_menus', status: 'failed', error: 'Context_Resolution_Failed: No recipient phone found' });
            return results;
        }

        const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('settings')
            .eq('id', companyId)
            .single();

        if (companyError || !companyData) {
            results.push({ action: 'offer_menus', status: 'failed', error: 'Company not found' });
            return results;
        }

        const settings = companyData.settings as Record<string, unknown>;
        const whatsappSettings = settings?.whatsapp as Record<string, unknown> | undefined;

        const whatsappToken = (whatsappSettings?.access_token as string) || process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = (whatsappSettings?.phone_number_id as string) || process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!whatsappToken || !phoneNumberId) {
            results.push({ action: 'offer_menus', status: 'failed', error: 'Missing WhatsApp config' });
            return results;
        }

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
            phoneNumberId: String(phoneNumberId),
            whatsappToken: String(whatsappToken),
            companyId
        });

        results.push({ action: 'offer_menus', status: 'success' });

    } catch (error: unknown) {
        const err = error as Error;
        results.push({ action: 'offer_menus', status: 'error', error: err.message });
    }

    return results;
}
