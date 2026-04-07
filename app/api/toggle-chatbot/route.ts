import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, enabled } = body;

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'conversation_id es requerido' },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabaseAdmin()
      .from('conversations')
      .update({ chatbot_enabled: enabled })
      .eq('id', conversation_id)
      .select('id, chatbot_enabled')
      .single();

    if (error) {
      console.error('[ToggleChatbot] Error:', error);
      return NextResponse.json(
        { error: 'Error actualizando estado del chatbot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chatbot_enabled: data.chatbot_enabled,
    });
  } catch (error) {
    console.error('[ToggleChatbot] Error general:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversation_id');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id es requerido' },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabaseAdmin()
      .from('conversations')
      .select('chatbot_enabled')
      .eq('id', conversationId)
      .maybeSingle();

    if (error) {
      console.error('[ToggleChatbot] Error:', error);
      return NextResponse.json(
        { error: 'Error obteniendo estado del chatbot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      chatbot_enabled: data?.chatbot_enabled ?? true,
    });
  } catch (error) {
    console.error('[ToggleChatbot] Error general:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}