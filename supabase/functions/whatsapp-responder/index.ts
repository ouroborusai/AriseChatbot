import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { contact_id, message_body, company_id } = await req.json();
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    // 1. Contexto Profundo (Agente Personal)
    const [contact, requests, compliance, reminders, knowledge] = await Promise.all([
      supabase.from('contacts').select('*, companies(*)').eq('id', contact_id).single(),
      supabase.from('service_requests').select('*').eq('contact_id', contact_id).eq('status', 'pending').limit(1),
      supabase.from('company_compliance').select('*').eq('company_id', company_id).eq('status', 'pending').limit(1),
      supabase.from('reminders').select('*').eq('contact_id', contact_id).eq('status', 'pending').limit(1),
      supabase.from('client_knowledge').select('content_summary').eq('company_id', company_id).order('created_at', { ascending: false }).limit(3)
    ]);

    // 2. Prompt Dinámico basado en Categoría (Lead vs Client)
    let activeCategory = contact.data?.category === 'lead' ? 'Onboarding' : 'General';
    const promptQuery = await supabase
      .from('ai_prompts')
      .select('system_prompt')
      .eq('company_id', company_id)
      .eq('category', activeCategory)
      .eq('is_active', true)
      .limit(1)
      .single();

    let systemPrompt = promptQuery.data?.system_prompt || 'Eres Ouroborus AI, el asistente financiero inteligente de Arise. Contesta cordial y brevemente. INTERACTIVIDAD: Separa botones con "---" (ej. "--- Opcion1 | Opcion2").';

    // Añadir Contexto de negocio solo a clientes establecidos
    if (activeCategory === 'General') {
      const financialSnapshots = knowledge.data?.map(k => k.content_summary).join('\n') || 'No hay resúmenes financieros disponibles aún.';
      
      systemPrompt += `
      
      DATOS PARA RECORDAR (Contexto):
      - Trámites: ${JSON.stringify(requests.data)}
      - Vencimientos Legales: ${JSON.stringify(compliance.data)}
      - Notas Personales: ${JSON.stringify(reminders.data)}
      - RESÚMENES FINANCIEROS (Usa estos datos para responder montos): 
      ${financialSnapshots}
      `;
    }

    // 3. Síntesis Brain
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\nUsuario: ${message_body}` }] }] })
    });

    const geminiData = await geminiRes.json();
    const rawOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo procesar el flujo neural.";
    
    // 4. Parsing de Texto y Botones
    const [textPart, buttonsPart] = rawOutput.split('---');
    const responseText = textPart.trim();
    const buttons = buttonsPart 
      ? buttonsPart.split('|').map((b: string) => b.trim()).filter((b: string) => b.length > 0) 
      : ['Menú Principal', 'Anotar Recordatorio', 'Consultar Estado'];

    // 5. Registro y Respuesta con Metadatos Dinámicos
    await supabase.from('messages').insert({ 
      conversation_id: contact_id, 
      content: responseText, 
      sender_type: 'bot',
      metadata: { 
        interactive_buttons: buttons.slice(0, 10),
        interactive_type: buttons.length > 3 ? 'list' : 'button'
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      response: responseText,
      buttons: buttons,
      type: buttons.length > 3 ? 'list' : 'button'
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
