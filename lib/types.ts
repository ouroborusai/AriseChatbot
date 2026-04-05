/**
 * Database types for contacts and conversations
 * Auto-sync with Supabase schema
 */

export type Contact = {
  id: string;
  phone_number: string;
  name?: string;
  email?: string;
  segment?: 'cliente' | 'prospect' | 'soporte' | 'vip' | string;
  location?: string;
  purchase_history?: Array<{
    date: string;
    amount: number;
    product: string;
  }>;
  metadata?: Record<string, unknown>;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
};

export type ConversationStatus = 'open' | 'closed' | 'waiting' | 'on_hold';

export type Conversation = {
  id: string;
  contact_id?: string;
  phone_number: string;
  is_open: boolean;
  first_response_at?: string;
  last_response_at?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type ConversationWithContact = Conversation & {
  contact?: Contact | null;
};

export type ConversationWithMessages = Conversation & {
  messages: Message[];
};

export type MetricsData = {
  total_conversations: number;
  conversations_today: number;
  conversations_this_week: number;
  open_conversations: number;
  average_response_time_ms: number;
  resolution_rate: number;
  total_messages: number;
  messages_today: number;
};
