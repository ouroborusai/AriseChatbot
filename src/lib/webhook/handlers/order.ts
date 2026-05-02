import { supabase, logEvent } from '@/lib/webhook/utils';
import { generateAndSendAIResponse } from '@/lib/neural-engine/whatsapp';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Tipos estrictos heredados de la arquitectura SSOT
export interface OrderItem {
  product_retailer_id: string;
  quantity: string;
  item_price: string;
  currency: string;
}

export interface OrderPayload {
  catalog_id: string;
  text?: string;
  product_items: OrderItem[];
}

export interface OrderMessageParams {
  order: OrderPayload;
  sender: string;
  companyId: string;
  contactId: string;
  conversationId: string;
  whatsappToken: string;
  phoneNumberId: string;
}

/**
 * ARISE NEURAL INVENTORY LOOP v12.0 (Diamond Resilience)
 * Handler de Pedidos de Catálogo - Integración de Cierre Financiero (MercadoPago).
 * SSOT: Cero 'any', Aislamiento Tenant Inquebrantable.
 */
export async function handleOrderMessage(params: OrderMessageParams): Promise<boolean> {
  const { order, sender, companyId, contactId, conversationId, whatsappToken, phoneNumberId } = params;

  try {
    // 1. Telemetría de Recepción Platinum
    await logEvent({
      companyId,
      action: 'ORDER_RECEIVED_V12',
      details: { catalog_id: order.catalog_id, sender }
    });

    // 2. Extraer ítems y estructurar memoria del carrito para la IA
    let orderDetails = `🛒 [CARRITO DE COMPRAS]\nCatálogo ID: ${order.catalog_id}\n\nDetalles del Pedido:\n`;
    let totalAmount = 0;

    if (Array.isArray(order.product_items)) {
      for (const item of order.product_items) {
        const price = parseFloat(item.item_price || '0');
        const qty = parseInt(item.quantity || '0', 10);
        totalAmount += price * qty;
        orderDetails += `- ${qty}x [SKU: ${item.product_retailer_id}] - ${item.currency} ${price * qty}\n`;
      }
    }

    if (order.text) {
      orderDetails += `\nNota del cliente: ${order.text}\n`;
    }
    orderDetails += `\nTotal estimado: ${totalAmount}\n`;

    // 2.5 Generación de Enlace de Pago (Cierre Financiero Ventana 24h)
    let paymentLink = '';
    if (totalAmount > 0 && process.env.MERCADOPAGO_ACCESS_TOKEN) {
      try {
        const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const preference = new Preference(mpClient);
        
        const prefResult = await preference.create({
          body: {
            items: [{
              id: order.catalog_id,
              title: `Pedido Comercial - Red MTZ`,
              quantity: 1,
              unit_price: totalAmount,
              currency_id: 'CLP'
            }],
            payer: { email: `whatsapp_${sender}@redmtz.cl` }, // Pseudo-email para validación MP
            metadata: { company_id: companyId, sender_phone: sender },
            auto_return: 'approved'
          }
        });
        
        if (prefResult.init_point) {
          paymentLink = prefResult.init_point;
          orderDetails += `\n[SISTEMA]: Se generó este enlace de MercadoPago para el pago seguro del cliente: ${paymentLink}\nINSTRUCCIÓN PARA IA: Entrégale este enlace al cliente de inmediato y amablemente para concretar la venta.`;
          
          await logEvent({
            companyId,
            action: 'PAYMENT_LINK_GENERATED_V12',
            details: { amount: totalAmount, link: paymentLink, sender }
          });
        }
      } catch (mpError: unknown) {
        console.error('[MERCADOPAGO_ERROR]', (mpError as Error).message);
      }
    }

    // 3. Inserción con ARISE_MASTER_SERVICE_KEY via supabase admin client
    // Se fuerza la asociación estricta a contact_id y company_id en el nivel metadata.
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'user',
        content: orderDetails,
        external_id: 'N/A_OUTGOING_DIRECT', // Flag Supremo para evitar fallos de constraint
        metadata: { 
          company_id: companyId,
          contact_id: contactId,
          order_payload: order 
        }
      });

    if (insertError) {
      console.error('[ORDER_HANDLER_DB_ERROR]', insertError.message);
      throw new Error(`Fallo silencioso DB interceptado: ${insertError.message}`);
    }

    // 4. Despertar a la IA con el contexto inyectado sin depender del Trigger Lobotomizado
    await generateAndSendAIResponse({
      content: orderDetails,
      companyId,
      contactId,
      conversationId,
      sender,
      phoneNumberId,
      whatsappToken
    });

    return true;
  } catch (error: unknown) {
    const err = error as Error;
    await logEvent({
      companyId,
      action: 'ORDER_HANDLER_FATAL',
      details: { error: err.message, sender }
    });
    return false;
  }
}
