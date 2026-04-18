import { createClient } from '@supabase/supabase-js';

/**
 * SEMANTIC CACHE CONTROLLER v1.0
 * Goal: Sub-second latency & Zero-token responses for recurring queries.
 */

export class SemanticCache {
  private supabase;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Checks if we have an existing high-quality response for a query
   */
  async getResponse(query: string): Promise<string | null> {
    console.log(`[Cache]: Checking semantic match for: "${query}"`);

    // In a real implementation with pgvector, we would use a RPC call for similarity
    const { data, error } = await this.supabase
      .from('ai_semantic_cache')
      .select('response_text, usage_count, id')
      .eq('query_text', query) // Simple match for now, ideally vector similarity search
      .maybeSingle();

    if (data) {
      console.log(`[Cache]: HIT - Reusing existing response.`);
      // Increment usage for ROI tracking
      await this.supabase
        .from('ai_semantic_cache')
        .update({ usage_count: (data.usage_count || 0) + 1 })
        .eq('id', data.id);
      
      return data.response_text;
    }

    console.log(`[Cache]: MISS - LLM synthesis required.`);
    return null;
  }

  /**
   * Saves a new premium response to the cache
   */
  async saveResponse(query: string, response: string) {
    console.log(`[Cache]: Storing new premium response.`);
    const { error } = await this.supabase
      .from('ai_semantic_cache')
      .insert({
        query_text: query,
        response_text: response,
        usage_count: 1,
        // metadata: { model: 'gemini-2.5-flash-lite' }
      });
    
    if (error) console.error('[Cache Error]:', error.message);
  }
}
