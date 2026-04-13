import { getSupabaseAdmin } from '../supabase-admin';
import { InventoryItem, InventoryTransaction, InventoryProvider } from '../types';

/**
 * Servicio de Gestión de Inventario Avanzado (Contable)
 */
export class InventoryService {
  /**
   * Obtiene todos los productos de una empresa
   */
  static async getItems(companyId: string): Promise<InventoryItem[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('inventory_items')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) {
      console.error('[InventoryService] Error getItems:', error);
      return [];
    }
    return data as InventoryItem[];
  }

  /**
   * Busca un producto por nombre
   */
  static async findItemByName(companyId: string, name: string): Promise<InventoryItem | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('inventory_items')
      .select('*')
      .eq('company_id', companyId)
      .ilike('name', `%${name}%`)
      .maybeSingle();

    if (error) return null;
    return data as InventoryItem;
  }

  /**
   * Registra una transacción contable de inventario
   * Soporta itemId directo o itemName para búsqueda automática
   */
  static async registerTransaction(params: {
    companyId?: string;
    itemId?: string;
    itemName?: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    unit?: string;
    docType?: 'factura' | 'nota_credito' | 'boleta' | 'guia';
    docNumber?: string;
    netAmount?: number;
    providerId?: string;
    providerName?: string;
    providerRut?: string;
    notes?: string;
  }): Promise<any> {
    const supabase = getSupabaseAdmin();
    let finalItemId = params.itemId;

    // 1. Si no hay itemId, buscar o crear item por nombre
    if (!finalItemId && params.itemName && params.companyId) {
      let item = await this.findItemByName(params.companyId, params.itemName);
      if (!item) {
        item = await this.createItem(params.companyId, params.itemName, params.unit || 'uds');
      }
      finalItemId = item?.id;
    }

    if (!finalItemId) return { success: false, error: 'Item no encontrado' };

    // 2. Calcular IVA (19% CLP standard) y Total si hay Neto
    const ivaAmount = params.netAmount ? Math.round(params.netAmount * 0.19) : 0;
    const totalAmount = params.netAmount ? params.netAmount + ivaAmount : 0;

    // 3. Obtener item actual para actualizar stock
    const { data: item } = await supabase.from('inventory_items').select('*').eq('id', finalItemId).single();
    if (!item) return { success: false };

    const newStock = params.type === 'in' ? Number(item.current_stock) + params.quantity : Number(item.current_stock) - params.quantity;

    // 4. Update stock
    await supabase
      .from('inventory_items')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', finalItemId);

    // 5. Insertar transacción
    const { error: logError } = await supabase
      .from('inventory_transactions')
      .insert({
        item_id: finalItemId,
        type: params.type,
        quantity: params.quantity,
        net_amount: params.netAmount || 0,
        iva_amount: ivaAmount,
        total_amount: totalAmount,
        doc_type: params.docType || 'factura',
        doc_number: params.docNumber,
        notes: params.notes || 'Registro automático'
      });

    const isLow = item.min_stock_alert && newStock <= item.min_stock_alert;

    return { 
      success: !logError, 
      newStock, 
      isLow: !!isLow, 
      itemName: item.name, 
      unit: item.unit 
    };
  }

  /**
   * Obtiene o crea un proveedor por RUT
   */
  static async getOrCreateProvider(companyId: string, rut: string, name: string): Promise<string | null> {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
      .from('inventory_providers')
      .select('id')
      .eq('company_id', companyId)
      .eq('rut', rut)
      .maybeSingle();

    if (existing) return existing.id;
    
    const { data: created, error } = await supabase
      .from('inventory_providers')
      .insert({ company_id: companyId, rut, name })
      .select('id')
      .single();

    if (error) {
      console.error('[InventoryService] Error getOrCreateProvider:', error);
      return null;
    }
    return created.id;
  }

  /**
   * Crea un nuevo producto
   */
  static async createItem(companyId: string, name: string, unit: string = 'unidad'): Promise<InventoryItem | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('inventory_items')
      .insert({
        company_id: companyId,
        name,
        unit,
        current_stock: 0
      })
      .select('*')
      .single();

    if (error) return null;
    return data as InventoryItem;
  }
}
