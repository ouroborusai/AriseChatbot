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

    let dashboard = `📦 *REPORTE DE INVENTARIO*\n`;
    dashboard += `----------------------------------\n`;
    
    items.forEach(item => {
      const isLow = item.min_stock_alert && item.current_stock <= item.min_stock_alert;
      const emoji = isLow ? '⚠️' : '✅';
      dashboard += `${emoji} *${item.name}*: \`${item.current_stock}\` ${item.unit || 'uds'}${isLow ? ' *[BAJO]*' : ''}\n`;
    });
    
    dashboard += `----------------------------------\n`;
    dashboard += `_Actualizado ahora._`;

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
    const success = await InventoryService.registerTransaction({
      itemId: item.id,
      type: 'in',
      quantity: qty,
      netAmount: net,
      docNumber: docNum,
      providerId,
      notes: 'Ingreso rápido vía WhatsApp'
    });

    if (success) {
      const iva = Math.round(net * 0.19);
      const total = net + iva;
      
      let res = `✅ *INGRESO DE STOCK EXITOSO*\n\n`;
      res += `📦 Ítem: ${item.name}\n`;
      res += `🔢 Cantidad: +${qty} ${item.unit || 'uds'}\n`;
      if (net > 0) {
        res += `------------------\n`;
        res += `💰 Neto: $${net.toLocaleString('es-CL')}\n`;
        res += `🧾 IVA (19%): $${iva.toLocaleString('es-CL')}\n`;
        res += `💵 *TOTAL:* $${total.toLocaleString('es-CL')}\n`;
      }
      res += `------------------\n`;
      if (providerName) res += `🏭 Proveedor: ${providerName}\n`;
      if (docNum) res += `📄 Doc: ${docNum}\n\n`;
      res += `_Tu stock ha sido actualizado en tiempo real._`;

      await sendWhatsAppMessage(phoneNumber, res);
      
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
}
