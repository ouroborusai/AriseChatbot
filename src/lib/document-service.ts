import { supabase } from './supabase';

/**
 * Arise Document AI Service v9.0
 * Bridge for OCR and Document Analysis via Gemini Vision
 */
export const DocumentService = {
  /**
   * Processes an image of an invoice and extracts data for inventory
   */
  async processInvoice(file: File, companyId: string) {
    console.log(`[Neural OCR] Iniciando procesamiento para empresa: ${companyId}`);
    
    // 1. Upload to Supabase Storage (Vault)
    const fileName = `ocr/${companyId}/${Date.now()}_${file.name}`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from('vault')
      .upload(fileName, file);

    if (uploadError) throw new Error(`Upload Error: ${uploadError.message}`);

    // 2. Call local Neural OCR Processor
    const response = await fetch('/api/ocr-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        filePath: fileName,
        companyId: companyId 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'OCR Processing Failed');
    }

    return await response.json();
  }
};
