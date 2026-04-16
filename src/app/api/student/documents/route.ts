import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireStudent } from '@/lib/auth-utils';
import { createRateLimitMiddleware, rateLimitPresets } from '@/lib/rate-limit';
import { errors } from '@/lib/api-response';
import { denormalizeDocumentType } from '@/lib/document-types';

const uploadRateLimit = createRateLimitMiddleware(rateLimitPresets.upload);

// GET /api/student/documents - List student's documents
export async function GET(request: NextRequest) {
  try {
    const user = await requireStudent(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const applicationId = searchParams.get('application_id');

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

    // Get student profile ID
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!studentRecord) {
      return NextResponse.json({ documents: [], stats: { total: 0, verified: 0, pending: 0, rejected: 0 } });
    }

    // Get all documents for the student (student-centric approach)
    query = query.eq('student_id', studentRecord.id);

    // Filter by application (optional link)
    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
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
        // Map field names for compatibility
        // Use denormalized type for backward compatibility with frontend
        const legacyType = denormalizeDocumentType(doc.type);
        return {
          ...doc,
          document_type: legacyType,
          original_type: doc.type, // Keep original type for reference
          content_type: doc.mime_type,
          url
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
    console.error('Error in documents GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/student/documents - Upload a document
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for uploads
    const rateLimitResult = uploadRateLimit(request);
    if (!rateLimitResult.allowed) {
      return errors.rateLimit(rateLimitResult.resetTime);
    }

    const user = await requireStudent(request);
    if (user instanceof NextResponse) return user;

    const formData = await request.formData();
    const studentId = formData.get('student_id') as string; // Primary identifier
    const applicationId = formData.get('application_id') as string | null; // Optional link
    const documentType = formData.get('document_type') as string;
    const file = formData.get('file') as File;

    if (!studentId || !documentType || !file) {
      return NextResponse.json(
        { error: 'Student ID, document type, and file are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify student owns this student_id
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!studentRecord) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Security check: student can only upload to their own profile
    if (studentRecord.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden - can only upload to your own profile' }, { status: 403 });
    }

    // If application_id provided, verify it belongs to this student
    if (applicationId) {
      const { data: application } = await supabase
        .from('applications')
        .select('student_id')
        .eq('id', applicationId)
        .single();
      
      if (!application || application.student_id !== studentId) {
        return NextResponse.json({ error: 'Application does not belong to you' }, { status: 400 });
      }
    }

    // Check if document already exists for this type (student-centric)
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id, file_key')
      .eq('student_id', studentId)
      .eq('type', documentType)
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
    const filePath = `${studentId}/${documentType}_${timestamp}_${sanitizedFileName}`;
    
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

    // Create or update document record using documents table
    let result;
    if (existingDoc?.id) {
      // Update existing record
      const { data, error } = await supabase
        .from('documents')
        .update({
          file_key: uploadData.path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          uploaded_by: user.id, // Track who uploaded the document
        })
        .eq('id', existingDoc.id)
        .select()
        .single();
      result = { data, error };
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          student_id: studentId,
          application_id: applicationId || null,
          type: documentType,
          file_key: uploadData.path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          uploaded_by: user.id, // Track who uploaded the document
        })
        .select()
        .single();
      result = { data, error };
    }

    if (result.error) {
      console.error('Error creating document record:', result.error);
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
      url: publicUrl
    };

    return NextResponse.json({ 
      document: responseDoc
    }, { status: 201 });

  } catch (error) {
    console.error('Error in documents POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
