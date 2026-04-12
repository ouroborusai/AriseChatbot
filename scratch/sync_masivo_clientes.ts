import fs from 'fs';
import path from 'path';

const DOCS_PATH = 'c:\\Users\\s_pk_\\Desktop\\MTZ RENTAS\\artifacts\\chatbot_docs\\';
const HARDCODED_URL = "https://kevagewrvpyhrflqmwod.supabase.co";
const HARDCODED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldmFnZXdydnB5aHJmbHFtd29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQwODQ0MSwiZXhwIjoyMDkwOTg0NDQxfQ.ZboB8eZ1_IbrCdTXw1woNGXzItVfys9rgFlw6J30Vsc";

async function sync() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(HARDCODED_URL, HARDCODED_KEY);
  const files = fs.readdirSync(DOCS_PATH).filter(f => f.endsWith('.md'));
  
  console.log(`--- INICIO SINCRONIZACIÓN INTELIGENTE (${files.length} archivos) ---`);
  
  // 1. Carga inicial
  const { data: dbCompanies } = await supabase.from('companies').select('*');
  const { data: dbContacts } = await supabase.from('contacts').select('*');
  
  console.log(`Estado actual: ${dbCompanies?.length || 0} empresas, ${dbContacts?.length || 0} contactos.`);

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(DOCS_PATH, file), 'utf8');
      
      const nameMatch = content.match(/# Resumen Financiero: (.*)/);
      const rutMatch = content.match(/RUT: ([\d-Kk]+)/);
      if (!nameMatch || !rutMatch) continue;
      
      const legalName = nameMatch[1].trim();
      const rut = rutMatch[1].trim();
      
      const ventasMatch = content.match(/\*\*Total Ventas \(Bruto\):\*\* \$(.*)/);
      const comprasMatch = content.match(/\*\*Total Compras \(Bruto\):\*\* \$(.*)/);
      const summary = {
        ventas_brutas: ventasMatch ? ventasMatch[1].trim() : '0',
        compras_brutas: comprasMatch ? comprasMatch[1].trim() : '0',
        last_sync: new Date().toISOString()
      };

      console.log(`Procesando: ${legalName}...`);

      // 2. Buscar si ya existe en DB (por RUT o por Nombre similar)
      const existingCompany = dbCompanies?.find(c => 
        (c.rut && c.rut === rut) || 
        (c.legal_name.toUpperCase() === legalName.toUpperCase())
      );

      let companyId;
      if (existingCompany) {
        console.log(`  Actualizando empresa existente (ID: ${existingCompany.id})`);
        const { error } = await supabase.from('companies').update({
          rut,
          metadata: { financial_summary: summary }
        }).eq('id', existingCompany.id);
        if (error) console.error(`  Error actualizando:`, error.message);
        companyId = existingCompany.id;
      } else {
        console.log(`  Insertando nueva empresa...`);
        const { data: newComp, error } = await supabase.from('companies').insert({
          legal_name: legalName,
          rut,
          metadata: { financial_summary: summary }
        }).select().single();
        if (error) {
          console.error(`  Error insertando:`, error.message);
          continue;
        }
        companyId = newComp.id;
      }

      // 3. Vincular con contacto si coincide nombre
      const matchingContact = dbContacts?.find(c => 
        c.name?.toUpperCase().includes(legalName.toUpperCase()) || 
        legalName.toUpperCase().includes(c.name?.toUpperCase() || '')
      );

      if (matchingContact && companyId) {
        console.log(`  Vinculando con contacto: ${matchingContact.name}`);
        await supabase.from('contact_companies').upsert({
          contact_id: matchingContact.id,
          company_id: companyId,
          is_primary: true
        }, { onConflict: 'contact_id,company_id' });

        await supabase.from('contacts').update({ segment: 'cliente' }).eq('id', matchingContact.id);
      }

    } catch (err) {
      console.error(`Error en archivo ${file}:`, err);
    }
  }
  console.log('--- SINCRONIZACIÓN FINALIZADA ---');
}

sync();
