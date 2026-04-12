import { TemplateService } from '../lib/services/template-service';

// FORZAR VARIABLES PARA EL PROCESO ACTUAL
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://kevagewrvpyhrflqmwod.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldmFnZXdydnB5aHJmbHFtd29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQwODQ0MSwiZXhwIjoyMDkwOTg0NDQxfQ.ZboB8eZ1_IbrCdTXw1woNGXzItVfys9rgFlw6J30Vsc";

async function simulateClientChat() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string, 
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );
  console.log('--- 🧪 SIMULACIÓN DE CHAT: CLIENTE (Carlos Villagra) ---');
  
  const CARLOS_PHONE = '56990062213';
  const CARLOS_NAME = 'Carlos Villagra';

  // Obtener datos manualmente 
  const { data: contact } = await supabase.from('contacts').select('*').eq('phone_number', CARLOS_PHONE).single();
  
  if (!contact) {
    console.error('❌ No se encontró el contacto de Carlos.');
    return;
  }

  const { data: companies } = await supabase.from('contact_companies')
    .select('companies(*)')
    .eq('contact_id', contact.id);

  const compList = (companies || []).map((c: any) => c.companies).filter(Boolean);
  const activeCompanyId = compList[0]?.id;

  // 2. Construir Contexto Manual
  const hasCompanies = compList.length > 0;
  const effectiveSegment = hasCompanies ? 'cliente' : (contact.segment || 'prospecto');

  const context: any = {
    contact: {
      id: contact.id,
      name: contact.name,
      phone_number: contact.phone_number,
      segment: effectiveSegment,
    },
    companies: compList.map((c: any) => ({
      id: c.id,
      legal_name: c.legal_name,
      tax_id: c.rut,
      metadata: c.metadata || {}
    })),
    activeCompanyId: activeCompanyId,
  };
  
  console.log(`\nReconocimiento de Usuario:`);
  console.log(`- Nombre: ${context.contact.name}`);
  console.log(`- Segmento: ${context.contact.segment}`);
  console.log(`- Empresas Vinculadas: ${context.companies.length}`);
  if (context.companies.length > 0) {
    console.log(`- Empresa Activa: ${context.companies.find((c: any) => c.id === activeCompanyId)?.legal_name || 'Ninguna'}`);
  }

  // 3. Determinar qué plantilla respondería
  console.log(`\nEvaluación de Respuesta:`);
  const segment = context.contact.segment || 'prospecto';
  const templateId = segment === 'cliente' ? 'menu_principal_cliente' : 'bienvenida_prospecto';
  
  // Usar el TemplateService que ya usa la llave forzada
  const template = await TemplateService.findTemplateById(templateId, segment);

  if (template) {
    console.log(`✅ El bot responderá con la plantilla: "${template.name}"`);
    console.log(`\n--- MENSAJE QUE VERÍA EL CLIENTE ---`);
    
    // USAR EL MOTOR OFICIAL DE REEMPLAZO
    const content = TemplateService.replaceVariables(template.content, context);
    
    console.log(content);
    console.log(`\nBotones asociados:`);
    template.actions?.forEach((a: any) => {
      console.log(`[ ${a.title} ] -> Destino: ${a.next_template_id}`);
    });
  } else {
    console.error(`❌ Error: No se encontró la plantilla ${templateId}`);
  }

  console.log('\n--- 🧪 FIN DE LA SIMULACIÓN ---');
}

simulateClientChat();
