import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { parseInteractiveContent } from "whatsapp-parser";

/**
 * META OMNICHANNEL WEBHOOK v10.1 (Diamond)
 * Soporte para Facebook Messenger e Instagram DMs
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") || "arise_diamond_v10.1";
const META_ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const url = new URL(req.url);

  // 1. Verificación del Webhook (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
      console.log("✅ Meta Webhook verificado exitosamente.");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // 2. Procesamiento de Mensajes (POST)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("📩 Evento de Meta recibido:", JSON.stringify(body, null, 2));

      // Validar que sea un evento de mensajería de página
      if (body.object === "page" || body.object === "instagram") {
        for (const entry of body.entry) {
          const messaging = entry.messaging || entry.changes;
          if (!messaging) continue;

          for (const event of messaging) {
            // Manejar mensajes de Messenger (Facebook) e Instagram
            const senderId = event.sender?.id;
            const message = event.message;

            if (senderId && message && !message.is_echo) {
              const text = message.text;
              const source = body.object === "instagram" ? "instagram" : "facebook";

              console.log(`👤 Mensaje de ${source} [${senderId}]: ${text}`);

              // A) Resolver contacto y empresa
              const { data: contact, error: contactError } = await supabase
                .from("contacts")
                .select("id, company_id")
                .or(`phone.eq.${senderId},metadata->>external_id.eq.${senderId}`)
                .limit(1)
                .single();

              if (contactError || !contact) {
                console.error("❌ No se pudo identificar el contacto en la base de datos.");
                continue;
              }

              // B) Persistir mensaje del usuario
              const { data: userMsg, error: msgError } = await supabase
                .from("messages")
                .insert({
                  conversation_id: await resolveConversationId(contact.id),
                  sender_type: "user",
                  content: text,
                  metadata: {
                    source: source,
                    external_id: senderId,
                    mid: message.mid
                  }
                })
                .select()
                .single();

              if (msgError) throw msgError;

              // C) Disparar el Motor Neural (Asíncrono)
              triggerNeuralEngine(userMsg.id);
            }
          }
        }
      }

      return new Response("EVENT_RECEIVED", { status: 200 });
    } catch (error) {
      console.error("🔥 Error procesando webhook:", error);
      return new Response("Error", { status: 500 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
});

/**
 * Resuelve o crea una conversación activa para el contacto
 */
async function resolveConversationId(contactId: string): Promise<string> {
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("contact_id", contactId)
    .eq("status", "open")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (conv) return conv.id;

  const { data: newConv } = await supabase
    .from("conversations")
    .insert({ contact_id: contactId, status: "open" })
    .select()
    .single();

  return newConv.id;
}

/**
 * Dispara el motor de inferencia v10.1
 */
function triggerNeuralEngine(messageId: string) {
  const endpoint = `${SUPABASE_URL}/functions/v1/arise-neural-engine-v25-final?source=trigger`;
  
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messageId })
  })
  .then(res => console.log(`🧠 Neural Engine disparado para mensaje ${messageId}: ${res.status}`))
  .catch(err => console.error("❌ Error disparando Neural Engine:", err));
}
