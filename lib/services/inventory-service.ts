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

    if (error) return null;
    return created.id;
  }

  /**
   * Registra una transacción contable de inventario
   */
  static async registerTransaction(params: {
    itemId: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    docType?: 'factura' | 'nota_credito' | 'boleta' | 'guia';
    docNumber?: string;
    netAmount?: number;
    providerId?: string;
    notes?: string;
  }): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    // 1. Calcular IVA (19% CLP standard) y Total si hay Neto
    const ivaAmount = params.netAmount ? Math.round(params.netAmount * 0.19) : 0;
    const totalAmount = params.netAmount ? params.netAmount + ivaAmount : 0;

    // 2. Obtener item actual para actualizar stock
    const { data: item } = await supabase.from('inventory_items').select('current_stock').eq('id', params.itemId).single();
    if (!item) return false;

    const newStock = params.type === 'in' ? Number(item.current_stock) + params.quantity : Number(item.current_stock) - params.quantity;

    // 3. Update stock
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', params.itemId);

    if (updateError) return false;

    // 4. Insertar transacción detallada
    const { error: logError } = await supabase
      .from('inventory_transactions')
      .insert({
        item_id: params.itemId,
        provider_id: params.providerId,
        type: params.type,
        quantity: params.quantity,
        doc_type: params.docType || 'factura',
        doc_number: params.docNumber,
        net_amount: params.netAmount,
        iva_amount: ivaAmount,
        total_amount: totalAmount,
        notes: params.notes
      });

    return !logError;
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
