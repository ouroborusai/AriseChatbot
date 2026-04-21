import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAuth, verifyCompanyAccess } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * NEURAL OCR PROCESSOR v9.0
 * Utiliza Gemini Vision para extraer datos de facturas y actualizar el inventario.
 */
export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const { filePath, companyId } = await req.json();

    // Validar inputs requeridos
    if (!filePath || !companyId) {
      return NextResponse.json({ error: 'Missing parameters: filePath and companyId' }, { status: 400 });
    }

    // Verificar acceso a la compañía
    const hasAccess = await verifyCompanyAccess(authResult.user.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this company' },
        { status: 403 }
      );
    }

    // 1. Descargar el archivo desde Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('vault')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Storage Error: ${downloadError?.message}`);
    }

    // 2. Convertir a Base64 para Gemini
    const buffer = await fileData.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    // 3. Llamar a Gemini Vision
    const prompt = `
      Eres un experto en extracción de datos contables y logísticos. 
      Analiza esta imagen (factura o guía) y extrae:
      1. Proveedor (Vendor)
      2. Fecha (Date)
      3. Total
      4. Ítems detallados: Código/SKU, Descripción, Cantidad, Precio Unitario.
      
      REGLA CRÍTICA: Responde ÚNICAMENTE con un objeto JSON válido con esta estructura:
      {
        "vendor": "Nombre",
        "date": "YYYY-MM-DD",
        "total": 0,
        "items": [
          { "sku": "CODIGO", "description": "Nombre Producto", "quantity": 10, "price": 100 }
        ]
      }
      Si no hay códigos claros, inventa un SKU basado en el nombre (ej: MANZANA_ROJA).
    `;

    const visionResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
          ]
        }]
      })
    });

    const visionData = await visionResponse.json();
    const rawText = visionData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Limpiar el JSON de posibles bloques Markdown
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const extraction = JSON.parse(cleanJson);

    console.log(`[OCR_PROCESSOR] Data extracted:`, extraction);

    // 4. Procesar transacciones de inventario
    const transactionResults = [];
    if (extraction.items && Array.isArray(extraction.items)) {
      for (const item of extraction.items) {
        // Buscar o crear el SKU
        let { data: invItem } = await supabase
          .from('inventory_items')
          .select('id')
          .ilike('sku', item.sku)
          .eq('company_id', companyId)
          .maybeSingle();

        if (!invItem) {
          // Crear ítem si no existe (Industrial Auto-Provisioning)
          const { data: newItem } = await supabase
            .from('inventory_items')
            .insert({
              company_id: companyId,
              sku: item.sku.toUpperCase(),
              name: item.description,
              current_stock: 0,
              min_stock: 5,
              category: 'OCR_IMPORTED'
            })
            .select()
            .single();
          invItem = newItem;
        }

        if (invItem) {
          const { error: tError } = await supabase
            .from('inventory_transactions')
            .insert({
              company_id: companyId,
              item_id: invItem.id,
              quantity: item.quantity,
              type: 'in',
              metadata: { 
                source: 'ocr_neural', 
                vendor: extraction.vendor, 
                date: extraction.date,
                total_factura: extraction.total
              }
            });
          
          transactionResults.push({ sku: item.sku, status: tError ? 'failed' : 'success' });
        }
      }
    }

    // 5. Registrar en client_documents
    await supabase.from('client_documents').insert({
      company_id: companyId,
      name: `Factura ${extraction.vendor || 'Desconocido'}`,
      type: 'invoice',
      file_path: filePath,
      status: 'processed',
      metadata: extraction
    });

    return NextResponse.json({ 
      status: 'completed', 
      extraction, 
      transactions: transactionResults 
    });

  } catch (error: any) {
    console.error('[OCR_PROCESSOR] Critical Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
