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

    const basePrompt = settings?.value || "Eres Ouroborus AI, un asistente técnico profesional.";

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
      this.supabase.from('service_requests').select('*').eq('contact_id', contactId).eq('status', 'pending').limit(2),
      this.supabase.from('company_compliance').select('*').eq('status', 'pending').limit(1),
      this.supabase.from('reminders').select('*').eq('contact_id', contactId).eq('status', 'pending').limit(2)
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
    const keywords = ['clave', 'ayuda', 'asesor', 'humano', 'persona', 'hablar con alguien'];
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
      text: "🚀 He notificado a un asesor de **MTZ Consultores**. Te contactarán a la brevedad para ayudarte personalmente.",
      buttons: ['Soporte VIP', 'Ver Estado']
    };
  }

  private async callGeminiDynamic(prompt: string, context: any, systemPrompt: string) {
    const fullPrompt = `
      ${systemPrompt}
      
      CONTEXTO ACTUAL:
      - Cliente: ${context.contact?.name || 'No identificado'}
      - Empresa: ${context.company?.legal_name || 'N/A'}
      - RUT: ${context.contact?.rut || 'N/A'}
      - Trámites Pendientes: ${JSON.stringify(context.requests || [])}
      - Vencimientos Próximos: ${JSON.stringify(context.compliance || [])}
      - Recordatorios: ${JSON.stringify(context.reminders || [])}
      
      Usuario dice: ${prompt}
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
      });
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      
      const parts = rawText.split('---');
      const text = parts[0].trim();
      const buttonsStr = parts[1];
      const buttons = buttonsStr ? buttonsStr.split('|').map((b: string) => b.trim()) : ['Consultar Estado', 'Hablar con Asesor'];

      return { text, buttons };
    } catch (e) {
      return { text: "⚠️ Sistema en mantenimiento. Un asesor tomará tu caso.", buttons: ['Soporte'] };
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
