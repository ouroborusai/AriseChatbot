
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Cargar variables de entorno explícitamente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BOOKS_ROOT = 'c:\\Users\\s_pk_\\Desktop\\MTZ RENTAS\\artifacts\\books_pdfs';
const bucketName = 'documents';

async function main() {
  console.log('📦 Iniciando carga directa de Libros Contables (PDF)...');

  try {
    // 1. Asegurar Bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === bucketName)) {
      console.log(`Creando bucket "${bucketName}"...`);
      await supabase.storage.createBucket(bucketName, { public: true });
    }

    const rutFolders = fs.readdirSync(BOOKS_ROOT).filter(f => 
      fs.statSync(path.join(BOOKS_ROOT, f)).isDirectory()
    );

    console.log(`Encontradas ${rutFolders.length} carpetas de empresas.`);

    for (const rutFolder of rutFolders) {
        // Limpiar RUT (quitar todo lo que no sea número o K)
        const cleanRut = rutFolder.replace(/[^0-9Kk]/g, '').toUpperCase();
        const searchBase = cleanRut.slice(0, -1); // Los números base
        
        console.log(`\n🔍 Buscando empresa para RUT base: ${searchBase}...`);

        // Buscar empresa con búsqueda parcial para ignorar puntos/guiones en la BD
        const { data: companies, error: compErr } = await supabase
            .from('companies')
            .select('id, legal_name, rut, contact_companies(contact_id)')
            .ilike('rut', `%${searchBase}%`);

        if (compErr || !companies || companies.length === 0) {
            console.warn(`⚠️ Empresa no encontrada para "${searchBase}". Saltando...`);
            continue;
        }

        // Si hay varias, intentar coincidencia exacta del dígito verificador o tomar la primera
        const company = companies.find(c => c.rut.replace(/[^0-9Kk]/g, '').toUpperCase() === cleanRut) || companies[0];
        
        console.log(`✅ Coincidencia: ${company.legal_name} (${company.rut})`);

        const contactId = (company.contact_companies as any)[0]?.contact_id;
        if (!contactId) {
            console.warn(`⚠️ Empresa sin contactos asociados: ${company.legal_name}. Saltando archivos.`);
            continue;
        }

        const folderPath = path.join(BOOKS_ROOT, rutFolder);
        const files = fs.readdirSync(folderPath).filter(f => f.toLowerCase().endsWith('.pdf'));

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const fileBuffer = fs.readFileSync(filePath);
            const storagePath = `books/${rutFolder}/${file}`;

            console.log(`  🚀 Subiendo: ${file}...`);

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: true });

            if (uploadError) {
                console.error(`  ❌ Error storage: ${uploadError.message}`);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

            const title = file.replace('.pdf', '').replace(/_/g, ' ');
            const docType = file.toLowerCase().includes('compra') ? 'compras' : 
                            file.toLowerCase().includes('venta') ? 'ventas' : 'general';

            const { error: dbError } = await supabase
                .from('client_documents')
                .insert({
                    contact_id: contactId,
                    company_id: company.id,
                    title,
                    description: `Libro contable ${docType}.`,
                    file_name: file,
                    file_url: publicUrl,
                    storage_bucket: bucketName,
                    storage_path: storagePath,
                    file_type: docType
                });

            if (dbError) {
                console.error(`  ❌ Error DB: ${dbError.message}`);
            } else {
                console.log(`  ✅ Registrado: ${title}`);
            }
        }
    }
    console.log('\n✨ Proceso de carga finalizado.');
  } catch (err: any) {
    console.error('💥 Error fatal:', err.message);
  }
}

main();
