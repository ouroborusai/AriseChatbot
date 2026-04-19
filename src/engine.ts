import { createClient } from '@supabase/supabase-js';
import { SemanticCache } from './services/semantic-cache';

/**
 * OUROBORUS AI NEURAL ENGINE
 * Architecture: Diamond v6.5 | Persona: Dynamic Personal Agent
 * Managing the intelligence cycle via System Settings and Templates.
 */
export class OuroborusEngine {
  private supabase;
  private cache;
  private readonly companyId: string;
  private readonly geminiApiKey: string;

  constructor(supabaseUrl: string, supabaseServiceKey: string, companyId: string, geminiApiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.cache = new SemanticCache(supabaseUrl, supabaseServiceKey);
    this.companyId = companyId;
    this.geminiApiKey = geminiApiKey;
  }

  async generateResponse(contactId: string, userMessage: string) {
    // 1. Semantic Cache Lookup (Performance First)
    const cached = await this.cache.getResponse(userMessage);
    if (cached) return { text: cached, buttons: ['Menú Principal', 'Consultar Saldo'] };

    // 2. Identification Logic (RUT)
    const rutMatch = userMessage.match(/(\d{1,2}\.?\d{3}\.?\d{3}-?[0-9kK])/);
    if (rutMatch) await this.handleIdentification(contactId, rutMatch[0]);

    // 3. Deep Context Retrieval
    const context = await this.getDeepContext(contactId);
    
    // 4. Human Handoff Intent Detection
    if (this.isRequestingHuman(userMessage)) {
      return await this.triggerHumanHandoff(contactId, userMessage);
    }

    // 5. Dynamic Prompt Synthesis
    // Fetch prompt from System Settings (AI Studio)
    const { data: settings } = await this.supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'system_prompt')
      .single();

    const basePrompt = settings?.value || `
      Eres Ouroborus AI ("The Synthetic Architect"). AGENTE PERSONAL PROACTIVO.
      Tu tono es premium, ejecutivo y técnico.
      
      PROTOCOLO DE INTERACCIÓN:
      1. Responde a la consulta de forma breve y eficiente.
      2. PROACTIVIDAD: Si detectas una tarea pendiente o el usuario menciona planes, ofrece anotar un recordatorio.
      3. INTERACTIVIDAD: Al final de CADA mensaje, ofrece opciones operativas usando el formato:
         Respuesta --- Opción 1 | Opción 2 | Opción 3 ... (Hasta 10 opciones)
      
      REGLA DE ORO: Si no hay nada urgente, siempre ofrece "Opciones de Recordatorio".
    `;

    // 6. LLM Generation
    const aiResponse = await this.callGeminiDynamic(userMessage, context, basePrompt);

    // 7. Telemetry & Cache
    await Promise.all([
      this.cache.saveResponse(userMessage, aiResponse.text),
      this.logTelemetry(userMessage, aiResponse.text)
    ]);

    return aiResponse;
  }

  private async getDeepContext(contactId: string) {
    const [contact, requests, compliance, reminders] = await Promise.all([
      this.supabase.from('contacts').select('*, companies(*)').eq('id', contactId).single(),
      this.supabase.from('service_requests').select('*').eq('contact_id', contactId).eq('status', 'pending').limit(3),
      this.supabase.from('company_compliance').select('*').eq('status', 'pending').limit(2),
      this.supabase.from('reminders').select('*').eq('contact_id', contactId).eq('status', 'pending').limit(3)
    ]);

    return { 
      contact: contact.data, 
      company: contact.data?.companies,
      requests: requests.data,
      compliance: compliance.data,
      reminders: reminders.data
    };
  }

  private async handleIdentification(contactId: string, rut: string) {
    const cleanRut = rut.replace(/\./g, '');
    await this.supabase.from('contacts').update({ rut: cleanRut }).eq('id', contactId);
  }

  private isRequestingHuman(msg: string): boolean {
    const keywords = ['clave', 'ayuda', 'asesor', 'humano', 'persona', 'hablar con alguien', 'agente'];
    return keywords.some(k => msg.toLowerCase().includes(k));
  }

  private async triggerHumanHandoff(contactId: string, msg: string) {
    await this.supabase.from('customer_requests').insert({
      contact_id: contactId,
      company_id: this.companyId,
      request_type: 'human_handoff',
      source: 'whatsapp_ai',
      details: { original_message: msg }
    });
    return {
      text: "🚀 He notificado a un asesor de **Arise Executive Support**. Te contactarán a la brevedad para ayudarte personalmente.",
      buttons: ['Soporte VIP', 'Ver Estado Mi CRM', 'Volver al Menú']
    };
  }

  private async callGeminiDynamic(prompt: string, context: any, systemPrompt: string) {
    const fullPrompt = `
      ${systemPrompt}
      
      CONTEXTO DEL CLIENTE:
      - Nombre: ${context.contact?.full_name || 'Agente Externo'}
      - Operación: ${context.company?.name || 'Global'}
      - RUT Operativo: ${context.contact?.rut || 'N/A'}
      - Trámites: ${JSON.stringify(context.requests || [])}
      - Vencimientos: ${JSON.stringify(context.compliance || [])}
      - Recordatorios Existentes: ${JSON.stringify(context.reminders || [])}
      
      Mensaje del Usuario: ${prompt}
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
      });
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo procesar la señal neural.";
      
      const parts = rawText.split('---');
      const text = parts[0].trim();
      const buttonsStr = parts[1];
      
      // Lógica de Botones Dinámica (Botones vs Listas)
      const buttons = buttonsStr 
        ? buttonsStr.split('|').map((b: string) => b.trim()).filter((b: string) => b.length > 0) 
        : ['Dashboard Maestro', 'Anotar Recordatorio', 'Ver Mis Gestiones'];

      return { 
        text, 
        buttons: buttons.slice(0, 10), // Máximo 10 para listas de WhatsApp
        interactive_type: buttons.length > 3 ? 'list' : 'button'
      };
    } catch (e) {
      return { text: "⚠️ Interrupción en el puente neural. Un supervisor humano ha sido alertado.", buttons: ['Reintentar', 'Hablar con Humano'] };
    }
  }

  private async logTelemetry(input: string, output: string) {
    await this.supabase.from('ai_api_telemetry').insert({
      company_id: this.companyId,
      tokens_input: Math.ceil(input.length / 4),
      tokens_output: Math.ceil(output.length / 4),
      status: 'success',
      usage_type: 'conversational'
    });
  }
}
