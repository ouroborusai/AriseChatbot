import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    gemini_key: process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ NO',
    openai_key: process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ NO',
    whatsapp_token: process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Configurado' : '❌ NO',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ NO',
    timestamp: new Date().toISOString()
  });
}