import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin();

    // Get total conversations
    const { count: totalConversations } = await admin
      .from('conversations')
      .select('id', { count: 'exact' });

    // Get conversations created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: conversationsToday } = await admin
      .from('conversations')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString());

    // Get conversations created this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: conversationsThisWeek } = await admin
      .from('conversations')
      .select('id', { count: 'exact' })
      .gte('created_at', weekAgo.toISOString());

    // Get open conversations
    const { count: openConversations } = await admin
      .from('conversations')
      .select('id', { count: 'exact' })
      .eq('is_open', true);

    // Get conversations with response times
    const { data: conversationsWithTiming } = await admin
      .from('conversations')
      .select('id, first_response_at, created_at, is_open')
      .not('first_response_at', 'is', null);

    let averageResponseTimeMs = 0;
    if (conversationsWithTiming && conversationsWithTiming.length > 0) {
      const responseTimes = conversationsWithTiming
        .map((conv) => {
          if (!conv.first_response_at || !conv.created_at) return 0;
          const created = new Date(conv.created_at).getTime();
          const responded = new Date(conv.first_response_at).getTime();
          return Math.max(0, responded - created);
        })
        .filter((t) => t > 0);

      if (responseTimes.length > 0) {
        averageResponseTimeMs = Math.round(
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        );
      }
    }

    // Get total messages
    const { count: totalMessages } = await admin
      .from('messages')
      .select('id', { count: 'exact' });

    // Get messages created today
    const { count: messagesToday } = await admin
      .from('messages')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString());

    // Calculate resolution rate (closed conversations / total)
    const { count: closedConversations } = await admin
      .from('conversations')
      .select('id', { count: 'exact' })
      .eq('is_open', false);

    const resolutionRate = totalConversations && totalConversations > 0 
      ? Math.round(((closedConversations || 0) / totalConversations) * 100)
      : 0;

    // Métricas de Ahorro (Industrial)
    const { count: totalDocs } = await admin
      .from('client_documents')
      .select('id', { count: 'exact' });

    const { count: totalAppointments } = await admin
      .from('appointments')
      .select('id', { count: 'exact' });

    const { count: botMessages } = await admin
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('role', 'assistant');

    return NextResponse.json({
      total_conversations: totalConversations || 0,
      conversations_today: conversationsToday || 0,
      conversations_this_week: conversationsThisWeek || 0,
      open_conversations: openConversations || 0,
      closed_conversations: closedConversations || 0,
      average_response_time_ms: averageResponseTimeMs,
      average_response_time_minutes: Math.round(averageResponseTimeMs / 60000),
      resolution_rate: resolutionRate,
      total_messages: totalMessages || 0,
      messages_today: messagesToday || 0,
      total_docs_delivered: totalDocs || 0,
      total_appointments: totalAppointments || 0,
      bot_responses: botMessages || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
