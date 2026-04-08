// lib/handlers/ai-handler.ts
// Maneja el fallback a Gemini para conversaciones abiertas

import { generateAssistantReply, getSystemPromptCached, invalidateSystemPromptCache } from '../ai-service';
import { sendWhatsAppMessage } from '../whatsapp-service';
import { getSupabaseAdmin } from '../supabase-admin';
import { normalizePhoneNumber } from '../utils';
import { Contact, Company } from './types';

const HUMAN_KEYWORDS = ['humano', 'asesor', 'urgente', 'multa', 'fiscalización', 'fiscalizacion', 'sii', 'demanda', 'reclamo', 'hablar con persona'];

export function wantsHumanAgent(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return HUMAN_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

// Obtener historial de conversación
async function getConversationHistory(phoneNumber: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const supabase = getSupabaseAdmin();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  const { data: conversation } = await getSupabaseAdmin()
    .from('conversations')
    .select('id')
    .eq('phone_number', normalizedPhone)
    .maybeSingle();

  if (!conversation) return [];

  const { data: messages } = await getSupabaseAdmin()
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })
    .limit(20);

  if (!messages) return [];

  return messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content || '',
  }));
}

// Construir prompt del sistema con contexto del contacto
function buildSystemPrompt(basePrompt: string, contact: Contact, companies: Company[], activeCompanyId: string | null): string {
  const lines = [basePrompt.trim(), '\n\n### Contexto de usuario:'];

  if (contact.name) {
    lines.push(`- Nombre del contacto: ${contact.name}`);
  }

  if (contact.segment === 'cliente') {
    lines.push('- Este usuario es un cliente activo de MTZ. Atiende con prioridad y claridad.');
    lines.push('- Cuando respondas, incluye opciones útiles como: "Si necesitas tus documentos, puedo mostrarte el menú 📄"');
  } else if (contact.segment === 'prospect') {
    lines.push('- Este usuario es un posible cliente nuevo. Explica los servicios de MTZ.');
    lines.push('- Incluye llamado a acción como: "¿Quieres una cotización? Responde con 💼"');
  } else {
    lines.push('- No se tiene segment definido. Pregunta de manera amigable.');
  }

  if (activeCompanyId) {
    const activeCompany = companies.find(c => c.id === activeCompanyId);
    if (activeCompany) {
      lines.push(`- Empresa activa: ${activeCompany.legal_name}`);
    }
  }

  if (companies.length > 0) {
    const names = companies.map(c => c.legal_name).join(', ');
    lines.push(`- Empresas vinculadas: ${names}`);
  }

  lines.push('- FINALmente, haz la conversación más interactiva sugiriendo acciones específicas cuando sea apropiado.');

  return lines.join('\n');
}

// Manejar conversación con Gemini
export async function handleAI(
  phoneNumber: string,
  conversationId: string,
  contact: Contact,
  companies: Company[],
  activeCompanyId: string | null,
  userMessage: string
): Promise<void> {
  console.log('[AI] Procesando con Gemini...');

  // Verificar si quiere hablar con humano
  if (wantsHumanAgent(userMessage)) {
    const msg = 'Entiendo. Un asesor especializado de MTZ se comunicará contigo desde este número en breve.';
    await sendWhatsAppMessage(phoneNumber, msg);
    console.log('✅ Derivado a humano');
    return;
  }

  try {
    const basePrompt = getSystemPromptCached();
    const systemPrompt = buildSystemPrompt(basePrompt, contact, companies, activeCompanyId);
    const history = await getConversationHistory(phoneNumber);

    console.log('[AI] Historial:', history.length, 'mensajes');

    const aiResponse = await generateAssistantReply(systemPrompt, history, userMessage);

    // Guardar y enviar respuesta
    await getSupabaseAdmin()
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
      });

    await sendWhatsAppMessage(phoneNumber, aiResponse);

    // Invalidar cache del prompt
    invalidateSystemPromptCache();

    console.log('✅ Respuesta Gemini enviada');
  } catch (error) {
    console.error('💥 Error en AI handler:', error);
    const msg = 'Disculpa, tuve un problema. Un asesor te contactará pronto.';
    await sendWhatsAppMessage(phoneNumber, msg);
  }
}