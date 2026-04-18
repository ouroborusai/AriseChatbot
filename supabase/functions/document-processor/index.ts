import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js";

/**
 * DOCUMENT PROCESSOR v1.0
 * Triggered by: New record in public.client_documents
 */

Deno.serve(async (req) => {
  try {
    const { record } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log(`--- Processing Document: ${record.id} ---`);

    // 1. Data Cleaning & Validation
    const { total_amount, company_id } = record;
    if (!total_amount || total_amount <= 0) {
      return new Response("Invalid Financial Data", { status: 400 });
    }

    // 2. Fragmenting for RAG (document_sections)
    const content = `Factura: ${record.title}. Monto: ${total_amount}. Empresa ID: ${company_id}`;
    
    const { error: sectionError } = await supabase
      .from("document_sections")
      .insert({
        document_id: record.id,
        content: content,
        metadata: { processed_at: new Date().toISOString() }
      });

    if (sectionError) throw sectionError;

    // 3. Optional: Trigger Inventory Exit if linked (Future Phase 1.3)
    console.log("--- Semantic Preparation Complete ---");

    return new Response(JSON.stringify({ success: true, id: record.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
});
