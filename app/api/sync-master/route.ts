
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const SUMMARIES_PATH = 'c:\\Users\\s_pk_\\Desktop\\MTZ RENTAS\\artifacts\\chatbot_docs';
  const BOOKS_ROOT = 'c:\\Users\\s_pk_\\Desktop\\MTZ RENTAS\\artifacts\\books_pdfs';
  const supabase = getSupabaseAdmin();
  const bucketName = 'documents';

  const log: string[] = [];
  let companiesInvoiced = 0;
  let booksUploaded = 0;

  try {
    // 0. Asegurar un contacto de sistema para documentos sin dueño aún
    const { data: systemContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('phone_number', '0')
      .maybeSingle();
    
    let defaultContactId = systemContact?.id;
    
    if (!defaultContactId) {
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({ phone_number: '0', name: 'MTZ ARCHIVOS', segment: 'todos' })
        .select('id')
        .single();
      defaultContactId = newContact?.id;
    }
    // 1. Asegurar Bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: true });
      log.push(`Bucket "${bucketName}" creado.`);
    }

    // 2. Procesar Resúmenes (Empresas + Meta)
    const summaryFiles = fs.readdirSync(SUMMARIES_PATH).filter(f => f.endsWith('.md'));
    for (const file of summaryFiles) {
      const content = fs.readFileSync(path.join(SUMMARIES_PATH, file), 'utf-8');
      const lines = content.split('\n');
      const legalName = (lines[0] || '').replace('# Resumen Financiero: ', '').trim();
      const rut = (lines[1] || '').replace('RUT: ', '').trim();
      const period = (lines[2] || '').replace('Periodo: ', '').trim();

      const ventasBruto = content.match(/\*\*Total Ventas \(Bruto\):\*\* \$([\d.]+)/)?.[1] || '0';
      const comprasBruto = content.match(/\*\*Total Compras \(Bruto\):\*\* \$([\d.]+)/)?.[1] || '0';
      const resMatch = content.match(/\*\*Tu resultado neto estimado .* es de \$(-?[\d.]+)\./);
      const resNeto = resMatch ? resMatch[1] : '0';
      const propMatch = content.match(/## 💡 Propuesta de Respuesta WhatsApp\n([\s\S]*?)\n---/);

      const metadata = {
        financial_summary: {
          period, ventas_bruto: ventasBruto, compras_bruto: comprasBruto, resultado_neto: resNeto,
          whatsapp_proposal: propMatch ? propMatch[1].trim() : '',
          updated_at: new Date().toISOString()
        }
      };

      // Upsert manual (check then insert/update)
      const { data: existing } = await supabase.from('companies').select('id, metadata').eq('rut', rut).maybeSingle();
      if (existing) {
        await supabase.from('companies').update({
          legal_name: legalName,
          metadata: { ...(existing.metadata || {}), ...metadata }
        }).eq('id', existing.id);
      } else {
        await supabase.from('companies').insert({ legal_name: legalName, rut, segment: 'cliente', metadata });
      }
      companiesInvoiced++;
    }
    log.push(`${companiesInvoiced} empresas procesadas desde resúmenes.`);

    // 3. Procesar Libros (PDFs)
    const rutFolders = fs.readdirSync(BOOKS_ROOT).filter(f => fs.statSync(path.join(BOOKS_ROOT, f)).isDirectory());
    
    // Obtener TODAS las empresas primero para hacer el match en memoria (más rápido y seguro)
    const { data: allCompanies } = await supabase.from('companies').select('id, rut, contact_companies(contact_id)');

    for (const rutFolder of rutFolders) {
        const cleanFolderRut = rutFolder.replace(/[^0-9Kk]/g, '').toUpperCase();
        
        // Buscar la empresa que coincida limpiando también el RUT de la BD
        const company = allCompanies?.find(c => {
            const cleanDbRut = (c.rut || '').replace(/[^0-9Kk]/g, '').toUpperCase();
            return cleanDbRut === cleanFolderRut || cleanDbRut.includes(cleanFolderRut) || cleanFolderRut.includes(cleanDbRut);
        });

        if (company) {
            const contactIdArr = (company.contact_companies as any);
            const contactId = contactIdArr && contactIdArr.length > 0 ? contactIdArr[0].contact_id : null;
            
            const folderPath = path.join(BOOKS_ROOT, rutFolder);
            const files = fs.readdirSync(folderPath).filter(f => f.toLowerCase().endsWith('.pdf'));

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const fileBuffer = fs.readFileSync(filePath);
                const storagePath = `books/${rutFolder}/${file}`;
                
                // Subir a Storage
                await supabase.storage.from(bucketName).upload(storagePath, fileBuffer, { 
                    contentType: 'application/pdf', 
                    upsert: true 
                });
                
                const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

                // Insertar en client_documents
                await supabase.from('client_documents').insert({
                    contact_id: contactId || defaultContactId, 
                    company_id: company.id,
                    title: file.replace('.pdf', '').replace(/_/g, ' '),
                    file_name: file,
                    file_url: publicUrl,
                    storage_bucket: bucketName,
                    storage_path: storagePath,
                    file_type: file.toLowerCase().includes('compra') ? 'compras' : 'ventas'
                });
                booksUploaded++;
            }
        }
    }
    log.push(`${booksUploaded} libros PDF cargados y vinculados.`);

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
