import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const { phone_number } = await request.json();
    
    if (!phone_number) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const normalizedPhone = phone_number.replace(/\D/g, '');
    
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('phone_number', phone_number)
      .single();

    if (!contact) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const code = generateAccessCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await supabaseAdmin.from('client_access_codes').insert({
      phone_number: phone_number,
      code: code,
      expires_at: expiresAt,
    });

    const { sendWhatsAppMessage } = await import('@/lib/whatsapp-service');
    const portalUrl = process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/access/${code}`
      : `http://localhost:3000/access/${code}`;
    
    const message = `🔐 *Código de acceso MTZ*\n\nTu código es: *${code}* (válido por 30 minutos)\n\n${portalUrl}\n\nSi no solicitaste este código, ignóralo.`;
    
    await sendWhatsAppMessage(phone_number, message);

    return NextResponse.json({ success: true, message: 'Código enviado' });
  } catch (error) {
    console.error('Error generating access code:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const code = request.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'Code required' }, { status: 400 });
  }

  const { data: accessCode } = await supabaseAdmin
    .from('client_access_codes')
    .select('id, phone_number, expires_at, used_at')
    .eq('code', code.toUpperCase())
    .single();

  if (!accessCode) {
    return NextResponse.json({ valid: false, error: 'Código inválido' }, { status: 404 });
  }

  if (accessCode.used_at) {
    return NextResponse.json({ valid: false, error: 'Código ya usado' }, { status: 400 });
  }

  if (new Date(accessCode.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Código expirado' }, { status: 400 });
  }

  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('id, phone_number, name, segment')
    .eq('phone_number', accessCode.phone_number)
    .single();

  return NextResponse.json({ valid: true, phone_number: accessCode.phone_number, contact });
}
