import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * KNOWLEDGE RETRIEVER Diamond v10.1
 * Busca información relevante en la base de conocimientos (FAQs) para alimentar a la IA.
 */
export async function getRelevantKnowledge(query: string, companyId: string): Promise<string> {
  try {
    // 1. Búsqueda simple por palabras clave en FAQs
    // En una fase posterior se puede implementar búsqueda vectorial (embeddings)
    const words = query.toLowerCase().split(' ').filter(w => w.length > 3);
    
    if (words.length === 0) return '';

    // Construir una consulta de búsqueda básica
    const { data: faqs, error } = await supabase
      .from('faqs')
      .select('question, answer')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .limit(5);

    if (error || !faqs || faqs.length === 0) return '';

    // Filtrar localmente por relevancia básica
    const relevantFaqs = faqs.filter(faq => {
      const q = faq.question.toLowerCase();
      return words.some(word => q.includes(word));
    });

    if (relevantFaqs.length === 0) return '';

    // Formatear como contexto para el prompt
    let context = "\n### INFORMACIÓN DE APOYO (FAQs):\n";
    relevantFaqs.forEach(faq => {
      context += `Pregunta: ${faq.question}\nRespuesta: ${faq.answer}\n---\n`;
    });

    return context;
  } catch (err) {
    console.error('[KNOWLEDGE_ERROR]', err);
    return '';
  }
}

/**
 * ANALYZER: Identifica preguntas frecuentes potenciales a partir del historial
 */
export async function analyzeFrequentQuestions(companyId: string) {
  // Esta función se activará desde el Studio para sugerir nuevas FAQs
  // TODO: Implementar lógica de agrupación (clustering) de mensajes
}
