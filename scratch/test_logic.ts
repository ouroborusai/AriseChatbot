import * as dotenv from 'dotenv';
import path from 'path';
import { getSupabaseAdmin } from '../lib/supabase-admin';
import { ContextService } from '../lib/services/context-service';
import { listCompaniesForContact } from '../lib/database-service';
import { TemplateService } from '../lib/services/template-service';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runTests() {
  console.log('--- 🧪 INICIANDO TESTS DE LÓGICA DE IDENTIDAD ---');
  
  const CARLOS_PHONE = '56990062213';
  const UNKNOWN_PHONE = '1234567890';
  const SALUDNET_RUT = '77259318-K';

  // TEST 1: Reconocimiento Automático de Cliente Existente
  console.log('\nTEST 1: Carlos Villagra (Cliente Vinculado)');
  const { data: contactCarlos } = await getSupabaseAdmin()
    .from('contacts')
    .select('*')
    .eq('phone_number', CARLOS_PHONE)
    .single();

  if (contactCarlos) {
    const companies = await listCompaniesForContact(contactCarlos.id);
    const context = await ContextService.buildContext(contactCarlos, companies, null, 'fake-conv-id');
    
    console.log(`  Segmento detectado: ${context.contact.segment}`);
    console.log(`  Empresas vinculadas: ${context.companies.length}`);
    
    if (context.contact.segment === 'cliente') {
      console.log('  ✅ ÉXITO: Carlos es reconocido como CLIENTE.');
    } else {
      console.log('  ❌ FALLO: Carlos sigue siendo prospecto.');
    }
  }

  // TEST 2: Simulación de Búsqueda por RUT (Prospecto a Cliente)
  console.log('\nTEST 2: Prospecto enviando RUT de Saludnet');
  // Simulamos lo que haría el CompanyHandler.handleCompanyText
  const { data: globalMatch } = await getSupabaseAdmin()
    .from('companies')
    .select('*')
    .eq('rut', SALUDNET_RUT)
    .maybeSingle();

  if (globalMatch) {
    console.log(`  Empresa encontrada: ${globalMatch.legal_name}`);
    console.log('  ✅ ÉXITO: El sistema puede localizar empresas por RUT global.');
  } else {
    console.log('  ❌ FALLO: No se encontró la empresa por RUT.');
  }

  // TEST 3: Verificación de Plantillas de Bienvenida
  console.log('\nTEST 3: Disponibilidad de Plantillas por Segmento');
  const tplProspecto = await TemplateService.findTemplateById('bienvenida_prospecto', 'prospecto');
  const tplCliente = await TemplateService.findTemplateById('menu_principal_cliente', 'cliente');

  if (tplProspecto && tplCliente) {
    console.log('  ✅ ÉXITO: Ambas plantillas raíz están activas en Supabase.');
  } else {
    console.log('  ❌ FALLO: Faltan plantillas fundamentales en la DB.');
  }

  console.log('\n--- 🧪 TESTS FINALIZADOS ---');
}

runTests();
