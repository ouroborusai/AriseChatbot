
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const BOOKS_ROOT = 'c:\\Users\\s_pk_\\Desktop\\MTZ RENTAS\\artifacts\\books_pdfs';
  const supabase = getSupabaseAdmin();
  const bucketName = 'documents';

  try {
    // Asegurar que el bucket existe
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: true });
    }

    const rutFolders = fs.readdirSync(BOOKS_ROOT).filter(f => 
      fs.statSync(path.join(BOOKS_ROOT, f)).isDirectory()
    );

    let totalUploaded = 0;
    const results: any[] = [];

    for (const rutFolder of rutFolders) {
        // Normalizar RUT para búsqueda (ej: 764624173 -> 76462417-3)
        // Asumimos que el último dígito es el verificador
        const cleanRut = rutFolder.replace(/[^0-9Kk]/g, '');
        const formattedRut = cleanRut.slice(0, -1) + '-' + cleanRut.slice(-1).toUpperCase();
        
        // 1. Buscar empresa y su primer contacto
        const { data: company } = await supabase
            .from('companies')
            .select(`
                id, 
                legal_name,
                contact_companies (
                    contact_id
                )
            `)
            .eq('rut', formattedRut)
            .maybeSingle();

        if (!company || !company.contact_companies?.[0]) {
            results.push({ rut: formattedRut, status: 'skipped', reason: 'Company or Contact not found' });
            continue;
        }

        const companyId = company.id;
        const contactId = (company.contact_companies as any)[0].contact_id;

        // 2. Procesar archivos en la carpeta
        const folderPath = path.join(BOOKS_ROOT, rutFolder);
        const files = fs.readdirSync(folderPath).filter(f => f.toLowerCase().endsWith('.pdf'));

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const fileBuffer = fs.readFileSync(filePath);
            const storagePath = `books/${rutFolder}/${file}`;

            // 3. Subir a Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(storagePath, fileBuffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (uploadError) {
                console.error(`Error uploading ${file}:`, uploadError.message);
                continue;
            }

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(storagePath);

            // 4. Crear registro en la base de datos
            const title = file.replace('.pdf', '').replace(/_/g, ' ');
            const docType = file.toLowerCase().includes('compra') ? 'compras' : 
                            file.toLowerCase().includes('venta') ? 'ventas' : 'general';

            const { error: dbError } = await supabase
                .from('client_documents')
                .insert({
                    contact_id: contactId,
                    company_id: companyId,
                    title: title,
                    description: `Libro contable procesado automáticamente para periodo ${file.match(/\d{4}_\d{2}/)?.[0] || '2026'}`,
                    file_name: file,
                    file_url: publicUrl,
                    storage_bucket: bucketName,
                    storage_path: storagePath,
                    file_type: docType
                });

            if (dbError) {
                console.error(`Error saving ${file} to DB:`, dbError.message);
            } else {
                totalUploaded++;
            }
        }
        results.push({ rut: formattedRut, status: 'processed', files: files.length });
    }

    return NextResponse.json({ success: true, uploaded: totalUploaded, details: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
