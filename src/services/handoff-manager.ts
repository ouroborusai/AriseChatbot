import { createClient } from '@supabase/supabase-js';

/**
 * HANDOFF MANAGER v1.0
 * The "Kill Switch" for Ouroborus AI Safety.
 */

export class HandoffManager {
  private supabase;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Disables the chatbot for a specific conversation and alerts a human.
   */
  async triggerHumanIntervention(conversationId: string, reason: string) {
    console.log(`[Safety]: Triggering Human Handoff for ${conversationId}. Reason: ${reason}`);

    // 1. UPDATE STATE IN DB
    const { error } = await this.supabase
      .from('conversations')
      .update({ 
        chatbot_enabled: false, 
        current_state: 'waiting_human',
        metadata: { handoff_reason: reason, handoff_at: new Date().toISOString() }
      })
      .eq('id', conversationId);

    if (error) {
      console.error('[Safety Error]: Could not disable chatbot:', error.message);
      return false;
    }

    // 2. LOG INTERNAL AUDIT MESSAGE
    await this.supabase.from('messages').insert({
      conversation_id: conversationId,
      content: `⚠️ SISTEMA: IA desactivada. Transferido a humano. Razón: ${reason}`,
      role: 'system'
    });

    return true;
  }

  /**
   * Checks if the chatbot is allowed to respond to this conversation.
   */
  async isChatbotActive(conversationId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('conversations')
      .select('chatbot_enabled')
      .eq('id', conversationId)
      .maybeSingle();

    return data?.chatbot_enabled ?? false;
  }
}
