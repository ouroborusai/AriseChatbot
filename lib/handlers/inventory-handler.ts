import { InventoryService } from '../services/inventory-service';
import { sendWhatsAppMessage, sendWhatsAppListMessage } from '../whatsapp-service';
import { BaseHandler } from './base-handler';
import { TemplateContext } from '../../app/components/templates/types';
import { extractInventoryFromImage } from '../ai-service';

export class InventoryHandler extends BaseHandler {
  constructor(context: TemplateContext) {
    super(context);
  }

  /**
   * Muestra el resumen de stock actual
   */
  async showStockSummary(phoneNumber: string): Promise<void> {
    if (!this.context.activeCompanyId) {
      await sendWhatsAppMessage(phoneNumber, '⚠️ Debes seleccionar una empresa primero para ver el inventario.');
      return;
    }

    const items = await InventoryService.getItems(this.context.activeCompanyId);
    
    if (items.length === 0) {
      await sendWhatsAppMessage(phoneNumber, '📦 Tu inventario está vacío. Puedes empezar escaneando una factura o agregando productos manualmente.');
      return;
    }

    let dashboard = `📦 *REPORTE DE INVENTARIO - MTZ*\n`;
    dashboard += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    let criticalItems = '';
    let healthyItems = '';

    items.forEach(item => {
      const isLow = item.min_stock_alert && Number(item.current_stock) <= Number(item.min_stock_alert);
      const line = `• *${item.name}*: \`${item.current_stock}\` ${item.unit || 'uds'}\n`;
      
      if (isLow) {
        criticalItems += `🚨 ${line}`;
      } else {
        healthyItems += `✅ ${line}`;
      }
    });
    
    if (criticalItems) {
      dashboard += `⚠️ *REPOSICIÓN REQUERIDA:*\n${criticalItems}\n`;
    }
    
    if (healthyItems) {
      dashboard += `✔️ *STOCK OPERATIVO:*\n${healthyItems}`;
    }
    
    dashboard += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    dashboard += `_Presiona una opción para ajustar._`;

    await sendWhatsAppMessage(phoneNumber, dashboard);
  }

  /**
   * Procesa la entrada rápida estructurada
   * Formato: Nombre, Cantidad, RUT Proveedor, Neto, Doc, Nombre Provee
   */
  async handleStructuredInput(phoneNumber: string, text: string): Promise<void> {
    if (!this.context.activeCompanyId) return;

    const parts = text.split(',').map(p => p.trim());
    if (parts.length < 2) {
      await sendWhatsAppMessage(phoneNumber, '❌ Formato insuficiente. Recuerda usar: *Producto, Cantidad, RUT, Neto, Factura, Proveedor*');
      return;
    }

    const [itemName, qtyStr, rut, netStr, docNum, providerName] = parts;
    const qty = parseFloat(qtyStr);
    const net = parseFloat(netStr || '0');

    if (isNaN(qty)) {
      await sendWhatsAppMessage(phoneNumber, '❌ La cantidad debe ser un número.');
      return;
    }

    // 1. Buscar o Crear item
    let item = await InventoryService.findItemByName(this.context.activeCompanyId, itemName);
    if (!item) {
       await sendWhatsAppMessage(phoneNumber, `📦 *Creando producto nuevo:* ${itemName}...`);
       item = await InventoryService.createItem(this.context.activeCompanyId, itemName, 'unidad');
    }

    if (!item) {
      await sendWhatsAppMessage(phoneNumber, '❌ No se pudo crear el producto.');
      return;
    }

    // 2. Gestionar Proveedor
    let providerId: string | undefined = undefined;
    if (rut && providerName) {
      const id = await InventoryService.getOrCreateProvider(this.context.activeCompanyId, rut, providerName);
      if (id) providerId = id;
    }

    // 3. Registrar Transacción
    const result = await InventoryService.registerTransaction({
      itemId: item.id,
      type: 'in',
      quantity: qty,
      netAmount: net,
      docNumber: docNum,
      providerId,
      notes: 'Ingreso rápido vía WhatsApp'
    });

    if (result.success) {
      const iva = Math.round(net * 0.19);
      const total = net + iva;
      
      let res = `✅ *INGRESO DE STOCK EXITOSO*\n\n`;
      res += `📦 Ítem: ${item.name}\n`;
      res += `🔢 Cantidad: +${qty} ${item.unit || 'uds'}\n`;
      res += `📈 Stock Actual: *${result.newStock}*\n`;
      
      if (net > 0) {
        res += `------------------\n`;
        res += `💰 Neto: $${net.toLocaleString('es-CL')}\n`;
        res += `🧾 IVA (19%): $${iva.toLocaleString('es-CL')}\n`;
        res += `💵 *TOTAL:* $${total.toLocaleString('es-CL')}\n`;
      }
      res += `------------------\n`;
      if (providerName) res += `🏭 Proveedor: ${providerName}\n`;
      if (docNum) res += `📄 Doc: ${docNum}\n\n`;

      if (result.isLow) {
        res += `⚠️ *ALERTA:* Este producto está por debajo de tu mínimo crítico (${result.newStock} ${item.unit}). ¡Recuerda reponer!\n\n`;
      }

      await sendWhatsAppMessage(phoneNumber, res);
      
      // Registrar respuesta en historial
      const { saveMessage } = await import('../database-service');
      const { data: conv } = await getSupabaseAdmin().from('conversations').select('id').eq('phone_number', phoneNumber).maybeSingle();
      if (conv) await saveMessage(conv.id, 'assistant', res);

      const { sendWhatsAppInteractiveButtons } = await import('../whatsapp-service');
      await sendWhatsAppInteractiveButtons(phoneNumber, "¿Deseas realizar otra gestión?", [
        { id: 'gestion_inventario', title: '📦 Volver Inventario' },
        { id: 'menu_principal_cliente', title: '🏠 Menú Inicio' }
      ]);
    } else {
      await sendWhatsAppMessage(phoneNumber, '❌ Error al registrar en la base de datos. Verifica el SQL de inventario.');
    }
  }

  /**
   * Responde a una consulta semántica de stock (Ej: "¿Cuanto tenemos de Harina?")
   */
  async handleSemanticInquiry(phoneNumber: string, query: string): Promise<boolean> {
    if (!this.context.activeCompanyId) return false;
    
    // Limpiar query para búsqueda: quitar "¿", "?", "stock de", "cuanto queda de"
    const cleanQuery = query.toLowerCase()
      .replace(/[¿?]/g, '')
      .replace(/cuanto queda de/g, '')
      .replace(/stock de/g, '')
      .replace(/que hay de/g, '')
      .trim();

    const item = await InventoryService.findItemByName(this.context.activeCompanyId, cleanQuery);

    if (!item) return false;

    const isLow = item.min_stock_alert && item.current_stock <= item.min_stock_alert;
    const emoji = isLow ? '⚠️' : '✅';
    
    let res = `📦 *CONSULTA DE STOCK*\n\n`;
    res += `${emoji} *${item.name}*\n`;
    res += `🔢 Saldo actual: \`${item.current_stock}\` ${item.unit || 'uds'}\n`;
    
    if (isLow) {
      res += `\n🚨 *Atención:* Este producto está en niveles críticos (mínimo: ${item.min_stock_alert}).`;
    } else {
      res += `\nEstado operativo óptimo. 👍`;
    }

    await sendWhatsAppMessage(phoneNumber, res);
    
    // Registrar respuesta en historial
    const { saveMessage } = await import('../database-service');
    const { data: conv } = await getSupabaseAdmin().from('conversations').select('id').eq('phone_number', phoneNumber).maybeSingle();
    if (conv) await saveMessage(conv.id, 'assistant', res);

    const { sendWhatsAppInteractiveButtons } = await import('../whatsapp-service');
    await sendWhatsAppInteractiveButtons(phoneNumber, "¿Qué deseas hacer?", [
      { id: 'inv_report', title: '📋 Ver Todo el Stock' },
      { id: 'inv_add', title: '➕ Cargar Stock' },
      { id: 'menu_principal_cliente', title: '🏠 Menú Inicio' }
    ]);

    return true;
  }

  /**
   * Muestra opciones para sumar stock
   */
  async showAddOptions(phoneNumber: string): Promise<void> {
    if (!this.context.activeCompanyId) return;
    const items = await InventoryService.getItems(this.context.activeCompanyId);
    
    if (items.length === 0) {
      await sendWhatsAppMessage(phoneNumber, '❌ No tienes productos registrados. Usa la opción *✨ Nuevo Producto* primero.');
      return;
    }

    await sendWhatsAppListMessage(phoneNumber, {
      body: 'Para agregar stock detallado (Neto, IVA, Proveedor), escribe el mensaje con este formato:\n\n*Producto, Cantidad, RUT, Neto, Factura, Nombre Proveedor*\n\nO selecciona para ajuste rápido ➕:',
      buttonText: 'Ajuste Rápido',
      sections: [{
        title: 'Catálogo disponible',
        rows: items.map(i => ({
          id: `inv_in_${i.id}`,
          title: i.name,
          description: `Stock: ${i.current_stock} ${i.unit}`
        }))
      }]
    });
  }

  /**
   * Registra una salida manual
   */
  async showWithdrawOptions(phoneNumber: string): Promise<void> {
    if (!this.context.activeCompanyId) return;
    const items = await InventoryService.getItems(this.context.activeCompanyId);
    
    if (items.length === 0) {
      await sendWhatsAppMessage(phoneNumber, '❌ No tienes productos registrados.');
      return;
    }

    await sendWhatsAppListMessage(phoneNumber, {
      body: '¿De qué producto deseas registrar una salida? ➖',
      buttonText: 'Seleccionar ítem',
      sections: [{
        title: 'Productos en Stock',
        rows: items.map(i => ({
          id: `inv_out_${i.id}`,
          title: i.name,
          description: `Saldos: ${i.current_stock} ${i.unit}`
        }))
      }]
    });
  }

  /**
   * Procesa un ingreso de inventario detectado por IA desde lenguaje natural
   */
  async handleNaturalInventoryAdd(phoneNumber: string, data: any): Promise<boolean> {
    try {
      if (!data.producto || !data.cantidad) return false;
      if (!this.context.activeCompanyId) return false;

      const providerRut = data.proveedor_rut || '76.000.000-0';
      const providerName = data.proveedor_nombre || 'Proveedor Indeterminado';
      const montoNeto = Number(data.monto_neto) || 0;
      const montoTotal = Math.round(montoNeto * 1.19);
      const montoIva = montoTotal - montoNeto;

      const result = await InventoryService.registerTransaction({
        companyId: this.context.activeCompanyId,
        itemName: data.producto,
        quantity: Number(data.cantidad),
        unit: data.unidad || 'unidades',
        type: 'in',
        providerName: providerName,
        providerRut: providerRut,
        netAmount: montoNeto,
        docNumber: data.numero_documento ? String(data.numero_documento) : undefined,
        notes: `IA Extract: ${data.proveedor_nombre || 'S/P'}`
      });

      if (result.success) {
        const stockStatus = result.isLow ? '🚨 ¡Atención! Stock Crítico.' : '✅ Stock Óptimo.';
        const responseText = `*📦 INGRESO DETECTADO (IA)*\n\n` +
          `🔹 *Producto:* ${data.producto}\n` +
          `🔹 *Cantidad:* ${data.cantidad} ${data.unidad || 'unidades'}\n` +
          `🔹 *Proveedor:* ${providerName}\n` +
          `🔹 *Documento:* ${data.numero_documento || 'No especificado'}\n` +
          `💰 *Monto Neto:* $${montoNeto.toLocaleString('es-CL')}\n` +
          `💵 *Monto Total:* $${montoTotal.toLocaleString('es-CL')}\n\n` +
          `📉 *Stock Actual:* ${result.newStock} ${data.unidad || 'unidades'}\n` +
          `${stockStatus}\n\n` +
          `_He registrado este movimiento automáticamente._`;

        await sendWhatsAppMessage(phoneNumber, responseText);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[InventoryHandler] Error in natural add:', error);
      return false;
    }
  }
}
