import * as dotenv from 'dotenv';
import path from 'path';
import { getSupabaseAdmin } from '../lib/supabase-admin';
import { ContextService } from '../lib/services/context-service';
import { listCompaniesForContact } from '../lib/database-service';
import { TemplateService } from '../lib/services/template-service';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runIndustrialTests() {
  console.log('--- 🧪 INICIANDO TESTS INDUSTRIALES (REFACCIÓN SENIOR) ---');
  
  const PHONE_TEST = '56990062213'; // Carlos Villagra

  // 1. Obtener contexto real
  const { data: contact } = await getSupabaseAdmin()
    .from('contacts')
    .select('*')
    .eq('phone_number', PHONE_TEST)
    .single();

  if (!contact) {
    console.error('❌ No se encontró el contacto de prueba.');
    return;
  }

  const companies = await listCompaniesForContact(contact.id);
  const context = await ContextService.buildContext(contact, companies, companies[0]?.id || null, 'fake-id');

  // TEST A: Variables Multi-Empresa
  console.log('\nTEST A: Verificación de Variables {{company_count}} y {{companies_list}}');
  const templateContent = "Tienes {{company_count}} empresas: {{companies_list}}";
  const replaced = TemplateService.replaceVariables(templateContent, context);
  
  console.log(`  Resultado: ${replaced.substring(0, 100)}...`);
  if (replaced.includes(String(companies.length)) && replaced.includes('id":"company_')) {
    console.log('  ✅ ÉXITO: El motor de variables inyecta correctamente la lista de empresas.');
  } else {
    console.log('  ❌ FALLO: Las variables no se reemplazaron correctamente.');
  }

  // TEST B: Simulación de Transcripción (Opcional si hay API Key)
  console.log('\nTEST B: Verificación de Conectividad con Gemini (IA)');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hola, responde solo 'OK' si recibes este mensaje.");
    const text = (await result.response).text();
    console.log(`  Respuesta de Gemini: ${text}`);
    if (text.includes('OK')) {
      console.log('  ✅ ÉXITO: Conectividad con IA confirmada.');
    }
  } catch (e) {
    console.warn('  ⚠️ SALTO: No se pudo probar la IA (posiblemente falta API KEY o cuota).');
  }

  // TEST C: Validación de Menú Principal Dinámico (Estructura)
  console.log('\nTEST C: Integridad de Plantilla [menu_principal_cliente]');
  const mainTemplate = await TemplateService.findTemplateById('menu_principal_cliente', 'cliente');
  if (mainTemplate && mainTemplate.actions.length > 0) {
    const hasShowIf = mainTemplate.actions.some(a => a.conditions?.show_if);
    console.log(`  Acciones encontradas: ${mainTemplate.actions.length}`);
    console.log(`  Usa condiciones (show_if): ${hasShowIf ? 'SÍ' : 'NO'}`);
    if (hasShowIf) {
      console.log('  ✅ ÉXITO: La plantilla principal usa lógica condicional industrial.');
    }
  }

  console.log('\n--- 🧪 TESTS INDUSTRIALES FINALIZADOS ---');
}

runIndustrialTests();
