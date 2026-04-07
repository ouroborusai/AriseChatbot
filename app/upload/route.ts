import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const contactId = formData.get('contact_id') as string | null;
    const companyId = formData.get('company_id') as string | null;
    const docType = formData.get('doc_type') as string | null;
    const period = formData.get('period') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!contactId) {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const bucketName = 'client-documents';

    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucketName);
    
    if (bucketError || !bucketData) {
      console.log('[Upload] Bucket no existe, creando...');
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024,
      });
      
      if (createError) {
        console.error('[Upload] Error creando bucket:', createError);
        return NextResponse.json({ error: 'Failed to create storage bucket' }, { status: 500 });
      }
    }

    const ext = file.name.split('.').pop() || 'pdf';
    const timestamp = Date.now();
    let storagePath = `uploads/${contactId}`;
    
    if (companyId) {
      storagePath += `/${companyId}`;
    }
    
    if (docType) {
      storagePath += `/${docType}`;
    }
    
    if (period) {
      storagePath += `/${period}`;
    }
    
    storagePath += `/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    console.log('[Upload] Subiendo a:', storagePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/pdf',
      });

    if (uploadError) {
      console.error('[Upload] Error uploading:', uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl || '';

    let title = `${docType || 'Documento'}`;
    if (period) {
      title += ` ${period}`;
    }

    const { data: document, error: docError } = await supabase
      .from('client_documents')
      .insert({
        contact_id: contactId,
        company_id: companyId || null,
        title: title,
        file_name: file.name,
        file_url: publicUrl,
        storage_bucket: bucketName,
        storage_path: storagePath,
        file_type: file.type || 'application/pdf',
      })
      .select()
      .single();

    if (docError) {
      console.error('[Upload] Error saving document record:', docError);
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        file_name: document.file_name,
        file_url: document.file_url,
        storage_path: storagePath,
      },
      publicUrl,
    });
  } catch (error) {
    console.error('[Upload] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: doc, error: fetchError } = await supabase
      .from('client_documents')
      .select('storage_path, storage_bucket')
      .eq('id', documentId)
      .maybeSingle();

    if (fetchError) {
      console.error('[Upload] Error fetching document:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
    }

    if (doc?.storage_path && doc?.storage_bucket) {
      const { error: deleteError } = await supabase.storage
        .from(doc.storage_bucket)
        .remove([doc.storage_path]);

      if (deleteError) {
        console.warn('[Upload] Warning: Could not delete file from storage:', deleteError);
      }
    }

    const { error: deleteDocError } = await supabase
      .from('client_documents')
      .delete()
      .eq('id', documentId);

    if (deleteDocError) {
      console.error('[Upload] Error deleting document:', deleteDocError);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Upload] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}