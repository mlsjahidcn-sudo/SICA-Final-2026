import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePartner } from '@/lib/auth-utils';
import { createRateLimitMiddleware, rateLimitPresets } from '@/lib/rate-limit';
import { denormalizeDocumentType } from '@/lib/document-types';

const uploadRateLimit = createRateLimitMiddleware(rateLimitPresets.upload);

// GET /api/partner/profile/documents - List partner's own documents
export async function GET(request: NextRequest) {
  try {
    const user = await requirePartner(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');

    let query = supabase
      .from('documents')
      .select(`
        id,
        student_id,
        application_id,
        type,
        status,
        file_key,
        file_name,
        file_size,
        mime_type,
        rejection_reason,
        uploaded_at,
        uploaded_by,
        created_at,
        updated_at
      `);

    // Partner documents: uploaded by this partner user and not linked to a student
    query = query.eq('uploaded_by', user.id).is('student_id', null);

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching partner documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // Generate signed URLs for documents
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        let url = null;
        if (doc.file_key) {
          const { data: signedUrlData } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(doc.file_key, 3600);
          if (signedUrlData?.signedUrl) {
            url = signedUrlData.signedUrl;
          } else {
            const { data: urlData } = supabase
              .storage
              .from('documents')
              .getPublicUrl(doc.file_key);
            url = urlData?.publicUrl || null;
          }
        }
        const legacyType = denormalizeDocumentType(doc.type);
        return {
          ...doc,
          document_type: legacyType,
          original_type: doc.type,
          content_type: doc.mime_type,
          url,
        };
      })
    );

    // Calculate stats
    const stats = {
      total: documentsWithUrls.length,
      verified: documentsWithUrls.filter((d: { status: string }) => d.status === 'verified').length,
      pending: documentsWithUrls.filter((d: { status: string }) => d.status === 'pending').length,
      rejected: documentsWithUrls.filter((d: { status: string }) => d.status === 'rejected').length,
    };

    return NextResponse.json({
      documents: documentsWithUrls,
      stats,
    });

  } catch (error) {
    console.error('Error in partner documents GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/partner/profile/documents - Upload a document for partner's own profile
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for uploads
    const rateLimitResult = uploadRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      );
    }

    const user = await requirePartner(request);
    if (user instanceof NextResponse) return user;

    const formData = await request.formData();
    const documentType = (formData.get('type') || formData.get('document_type')) as string;
    const file = formData.get('file') as File;

    if (!documentType || !file) {
      return NextResponse.json(
        { error: 'Document type and file are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if document already exists for this type (partner-centric, no student_id)
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id, file_key')
      .eq('uploaded_by', user.id)
      .eq('type', documentType)
      .is('student_id', null)
      .maybeSingle();

    // If replacing, delete old file from storage
    if (existingDoc?.file_key) {
      try {
        await supabase.storage.from('documents').remove([existingDoc.file_key]);
      } catch {
        // Ignore deletion errors
      }
    }

    // Upload file to Supabase Storage
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${user.id}/${documentType}_${timestamp}_${sanitizedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file', details: uploadError.message }, { status: 500 });
    }

    // Generate signed URL
    let publicUrl = '';
    const { data: signedUrlData } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(uploadData.path, 3600);
    if (signedUrlData?.signedUrl) {
      publicUrl = signedUrlData.signedUrl;
    } else {
      const { data: urlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(uploadData.path);
      publicUrl = urlData?.publicUrl || '';
    }

    // Create or update document record
    const documentRecord = {
      student_id: null, // Partner documents are not linked to a student
      application_id: null,
      type: documentType,
      file_key: uploadData.path,
      file_path: uploadData.path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: 'pending',
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      uploaded_by: user.id,
    };

    let result;
    if (existingDoc?.id) {
      // Update existing record
      const { data, error } = await supabase
        .from('documents')
        .update(documentRecord)
        .eq('id', existingDoc.id)
        .select()
        .maybeSingle();
      result = { data, error };
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('documents')
        .insert(documentRecord)
        .select()
        .maybeSingle();
      result = { data, error };
    }

    if (result.error || !result.data) {
      console.error('Error creating partner document record:', result.error);
      // Try to clean up uploaded file
      try {
        await supabase.storage.from('documents').remove([uploadData.path]);
      } catch {
        // Ignore cleanup errors
      }
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    // Map field names for response
    const responseDoc = {
      ...result.data,
      document_type: result.data.type,
      content_type: result.data.mime_type,
      url: publicUrl,
    };

    return NextResponse.json({
      document: responseDoc,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in partner documents POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
