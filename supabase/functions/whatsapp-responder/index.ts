import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { contact_id, message_body, company_id } = await req.json();
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    // 1. Contexto Profundo (Agente Personal)
    const [contact, requests, compliance, reminders] = await Promise.all([
      supabase.from('contacts').select('*, companies(*)').eq('id', contact_id).single(),
      supabase.from('service_requests').select('*').eq('contact_id', contact_id).eq('status', 'pending').limit(1),
      supabase.from('company_compliance').select('*').eq('company_id', company_id).eq('status', 'pending').limit(1),
      supabase.from('reminders').select('*').eq('contact_id', contact_id).eq('status', 'pending').limit(1)
    ]);

    // 2. Prompt de Agente Personal (v6.3)
    const systemPrompt = `
      Eres Ouroborus AI ("The Synthetic Architect"). AGENTE PERSONAL PROACTIVO.
      Cliente: ${contact.data?.name || 'Usuario'} | Empresa: ${contact.data?.companies?.legal_name}.
      
      DATOS PARA RECORDAR:
      - Trámites: ${JSON.stringify(requests.data)}
      - Vencimientos Legales: ${JSON.stringify(compliance.data)}
      - Notas Personales: ${JSON.stringify(reminders.data)}

      REGLA: Responde y luego añade un recordatorio proactivo si hay algo pendiente.
      BOTONES: Propón exactamente 3 botones así: Texto de respuesta --- Boton 1 | Boton 2 | Boton 3
    `;

    // 3. Síntesis Brain
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\nUsuario: ${message_body}` }] }] })
    });

    const geminiData = await geminiRes.json();
    const rawOutput = geminiData.candidates[0].content.parts[0].text;
    
    // 4. Parsing de Texto y Botones
    const [textPart, buttonsPart] = rawOutput.split('---');
    const responseText = textPart.trim();
    const buttons = buttonsPart ? buttonsPart.split('|').map(b => b.trim()) : ['Menú Principal', 'Mi Estado', 'Contacto'];

    // 5. Registro y Respuesta
    await supabase.from('messages').insert({ 
      conversation_id: contact_id, 
      content: responseText, 
      role: 'assistant',
      metadata: { interactive_buttons: buttons } // Para que el notifier sepa que enviar
    });

    return new Response(JSON.stringify({ 
      success: true, 
      response: responseText,
      buttons: buttons 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
