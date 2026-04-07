import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { digitsOnly } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phoneNumber = searchParams.get('phone') || '';
    const contactId = searchParams.get('contact_id') || '';
    const companyId = searchParams.get('company_id') || '';

    let query = getSupabaseAdmin()
      .from('client_documents')
      .select(
        'id, contact_id, title, description, file_name, file_url, storage_bucket, storage_path, file_type, created_at'
      );

    if (contactId) {
      query = query.eq('contact_id', contactId);
    } else if (phoneNumber) {
      const normalizedPhone = digitsOnly(phoneNumber);
      const { data: contact, error: contactError } = await getSupabaseAdmin()
        .from('contacts')
        .select('id')
        .eq('phone_number', normalizedPhone)
        .maybeSingle();

      if (contactError) {
        console.error('[ClientDocuments] Error finding contact:', contactError);
        return NextResponse.json({ error: 'Failed to find contact' }, { status: 500 });
      }

      if (!contact) {
        return NextResponse.json({ documents: [] });
      }

      query = query.eq('contact_id', contact.id);
    }
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: documents, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('[ClientDocuments] Error fetching documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error) {
    console.error('[ClientDocuments] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact_id, company_id, title, description, file_name, file_url, storage_bucket, storage_path, file_type } = body;

    if (!contact_id || !title || (!file_url && !(storage_bucket && storage_path))) {
      return NextResponse.json(
        { error: 'contact_id, title and (file_url OR storage_bucket+storage_path) are required' },
        { status: 400 }
      );
    }

    const { data: document, error } = await getSupabaseAdmin()
      .from('client_documents')
      .insert({
        contact_id,
        company_id: company_id || undefined,
        title,
        description: description || undefined,
        file_name: file_name || undefined,
        file_url: file_url || undefined,
        storage_bucket: storage_bucket || undefined,
        storage_path: storage_path || undefined,
        file_type: file_type || undefined,
      })
      .select()
      .single();

    if (error) {
      console.error('[ClientDocuments] Error creating document:', error);
      return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('[ClientDocuments] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
