import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js";
import { SemanticCache } from "../../src/services/semantic-cache.ts";

Deno.serve(async (req) => {
  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { contact_id, message_body, company_id } = await req.json();
    const cache = new SemanticCache(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. INTENTAMOS CACHÉ SEMÁNTICO (Ahorro de Tokens)
    let finalResponse = await cache.getResponse(message_body);
    let cacheHit = !!finalResponse;

    if (!finalResponse) {
      // 2. LLAMADA AL MOTOR AI (Si no hay caché)
      // Nota: Aquí iría la llamada a Gemini 1.5 Flash
      finalResponse = `[Robot Ouroborus]: Entendido, estoy analizando tu solicitud sobre "${message_body}".`;
      
      // Guardamos en caché para la próxima vez
      await cache.saveResponse(message_body, finalResponse);
    }

    // 3. ENVÍO Y REGISTRO
    await supabase.from('messages').insert({
      conversation_id: contact_id,
      content: finalResponse,
      role: 'assistant',
      metadata: { cache_hit: cacheHit }
    });

    // 4. TELEMETRÍA (KPI 1.2s)
    const latency = Date.now() - startTime;
    await supabase.from('ai_api_telemetry').insert({
      company_id,
      latency_ms: latency,
      tokens_input: cacheHit ? 0 : 150, // Estimado
      tokens_output: cacheHit ? 0 : 50,
      status: 'success'
    });

    return new Response(JSON.stringify({ success: true, latency }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
});
