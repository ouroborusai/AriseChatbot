import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

type CheckOk = { ok: true; detail?: string };
type CheckFail = { ok: false; detail: string };

function envSet(name: string): boolean {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const host = request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const webhookUrl =
    host && !host.includes('localhost')
      ? `${proto}://${host}/api/webhook`
      : host
        ? `${proto}://${host}/api/webhook`
        : null;

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: envSet('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: envSet('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: envSet('SUPABASE_SERVICE_ROLE_KEY'),
    WHATSAPP_ACCESS_TOKEN: envSet('WHATSAPP_ACCESS_TOKEN'),
    WHATSAPP_PHONE_NUMBER_ID: envSet('WHATSAPP_PHONE_NUMBER_ID'),
    WHATSAPP_VERIFY_TOKEN: envSet('WHATSAPP_VERIFY_TOKEN'),
    GEMINI_API_KEY: envSet('GEMINI_API_KEY'),
    OPENAI_API_KEY: envSet('OPENAI_API_KEY'),
  };

  let database: CheckOk | CheckFail = { ok: false, detail: 'Sin comprobar' };
  try {
    if (env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_URL) {
      const { error } = await getSupabaseAdmin().from('conversations').select('id').limit(1);
      database = error
        ? { ok: false, detail: error.message }
        : { ok: true, detail: 'Tabla conversations accesible' };
    } else {
      database = { ok: false, detail: 'Faltan variables de Supabase (servidor)' };
    }
  } catch (e) {
    database = { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }

  let whatsapp: CheckOk | CheckFail = { ok: false, detail: 'Sin comprobar' };
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (token && phoneId) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}?fields=display_phone_number,verified_name`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        whatsapp = {
          ok: true,
          detail: body.display_phone_number
            ? String(body.display_phone_number)
            : JSON.stringify(body).slice(0, 120),
        };
      } else {
        whatsapp = {
          ok: false,
          detail: body.error?.message || `HTTP ${res.status}`,
        };
      }
    } catch (e) {
      whatsapp = { ok: false, detail: e instanceof Error ? e.message : String(e) };
    }
  } else {
    whatsapp = { ok: false, detail: 'Falta WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID' };
  }

  let gemini: CheckOk | CheckFail = { ok: false, detail: 'Sin comprobar' };
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      });
      const result = await model.generateContent('Responde solo: OK');
      const text = (await result.response).text()?.trim().slice(0, 80);
      gemini = { ok: true, detail: text || 'Respuesta vacía' };
    } catch (e) {
      gemini = {
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      };
    }
  } else if (envSet('OPENAI_API_KEY')) {
    gemini = { ok: true, detail: 'Usas OpenAI (sin GEMINI_API_KEY)' };
  } else {
    gemini = { ok: false, detail: 'Falta GEMINI_API_KEY u OPENAI_API_KEY' };
  }

  const openaiConfigured = envSet('OPENAI_API_KEY');
  let ai = gemini;
  if (!gemini.ok && openaiConfigured) {
    ai = {
      ok: true,
      detail: `OpenAI configurado como respaldo. Gemini: ${gemini.detail}`,
    };
  }

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    webhookUrl,
    env,
    database,
    whatsapp,
    gemini: ai,
    summary: {
      canReceiveWebhook: env.WHATSAPP_VERIFY_TOKEN,
      canSaveChats: database.ok,
      canReplyWhatsApp: whatsapp.ok && ai.ok,
      metaChecklist: [
        'Webhook en Meta: Callback URL = webhookUrl de arriba',
        'Token de verificación = WHATSAPP_VERIFY_TOKEN (igual en Vercel y Meta)',
        'Campo messages suscrito en el webhook',
        'Número de prueba agregado en Meta si la app está en desarrollo',
      ],
    },
  });
}
