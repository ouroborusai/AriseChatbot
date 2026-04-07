import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { digitsOnly } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';
    const segment = searchParams.get('segment') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let supabaseQuery = getSupabaseAdmin()
      .from('contacts')
      .select('id, phone_number, name, email, segment, location, last_message_at, created_at, updated_at', {
        count: 'exact',
      });

    // Filter by segment if provided
    if (segment) {
      supabaseQuery = supabaseQuery.eq('segment', segment);
    }

    // Search by name, phone, or email
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `phone_number.ilike.%${query}%,name.ilike.%${query}%,email.ilike.%${query}%`
      );
    }

    // Pagination and sorting
    const { data: contacts, error, count } = await supabaseQuery
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      contacts: contacts || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Soporta:
    // - Un solo contacto: { phone_number, ... }
    // - Lote: [{ phone_number, ... }, ...]
    const contactsInput = Array.isArray(body) ? body : [body];

    const rows = contactsInput
      .map((c) => ({
        phone_number: digitsOnly(c?.phone_number || ''),
        name: c?.name || undefined,
        email: c?.email || undefined,
        segment: c?.segment || undefined,
        location: c?.location || undefined,
        last_message_at: new Date().toISOString(),
      }))
      .filter((c) => Boolean(c.phone_number));

    if (error) {
      console.error('Error upserting contact:', error);
      return NextResponse.json(
        { error: 'Failed to save contact' },
        { status: 500 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'phone_number is required' }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from('contacts')
      .upsert(rows, { onConflict: 'phone_number' })
      .select();

    if (error) {
      console.error('Error upserting contact(s):', error);
      return NextResponse.json({ error: 'Failed to save contact(s)' }, { status: 500 });
    }

    // Si venía un solo contacto, devolvemos uno; si venía lote, devolvemos lista.
    return NextResponse.json(Array.isArray(body) ? { contacts: data || [] } : (data?.[0] || null));
  } catch (error) {
    console.error('Unexpected error in POST /api/contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
