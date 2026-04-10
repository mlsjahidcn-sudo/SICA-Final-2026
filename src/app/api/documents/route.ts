import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// Allowed document types and their MIME types
const ALLOWED_DOCUMENT_TYPES: Record<string, { label: string; mimeTypes: string[] }> = {
  passport: { label: 'Passport', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
  diploma: { label: 'Diploma', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
  transcript: { label: 'Academic Transcript', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
  language_certificate: { label: 'Language Certificate', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
  photo: { label: 'Passport Photo', mimeTypes: ['image/jpeg', 'image/png'] },
  recommendation: { label: 'Recommendation Letter', mimeTypes: ['application/pdf'] },
  cv: { label: 'CV/Resume', mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
  study_plan: { label: 'Study Plan', mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
  financial_proof: { label: 'Financial Proof', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
  medical_exam: { label: 'Medical Exam Report', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
  police_clearance: { label: 'Police Clearance', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
  other: { label: 'Other Document', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const STORAGE_BUCKET = 'documents';

// GET - List documents for an application or all user documents
export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('application_id');
    const status = searchParams.get('status');

    const supabase = getSupabaseClient();

    // Build query - only select columns that exist in the table
    let query = supabase
      .from('application_documents')
      .select(`
        id,
        application_id,
        document_type,
        file_key,
        file_name,
        file_size,
        content_type,
        status,
        rejection_reason,
        uploaded_at,
        created_at,
        updated_at,
        applications (
          id,
          status,
          student_id,
          partner_id,
          programs (
            id,
            name,
            universities (
              id,
              name_en
            )
          )
        )
      `);

    // Filter by application or user
    if (applicationId) {
      // Verify user owns the application or is admin/partner
      const { data: application } = await supabase
        .from('applications')
        .select('student_id, partner_id')
        .eq('id', applicationId)
        .single();

      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      // Check ownership
      let isOwner = false;
      if (authUser.role === 'student') {
        const { data: studentRecord } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();
        isOwner = studentRecord?.id === application.student_id;
      } else if (authUser.role === 'partner') {
        // applications.partner_id stores users.id
        isOwner = application.partner_id === authUser.id;
      }

      if (!isOwner && authUser.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      query = query.eq('application_id', applicationId);
    } else {
      // Get all documents for user's applications
      if (authUser.role === 'student') {
        const { data: studentRecord } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();
        if (studentRecord) {
          query = query.eq('applications.student_id', studentRecord.id);
        } else {
          query = query.eq('applications.student_id', '00000000-0000-0000-0000-000000000000');
        }
      } else if (authUser.role === 'partner') {
        // applications.partner_id stores users.id
        query = query.eq('applications.partner_id', authUser.id);
      }
      // Admin can see all documents
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

    // Generate signed URLs for documents stored in Supabase Storage
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        let url = null;
        if (doc.file_key) {
          // Try signed URL first (works for private buckets)
          const { data: signedUrlData } = await supabase
            .storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(doc.file_key, 3600); // 1 hour expiry
          
          if (signedUrlData?.signedUrl) {
            url = signedUrlData.signedUrl;
          } else {
            // Fallback to public URL
            const { data: urlData } = supabase
              .storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(doc.file_key);
            url = urlData?.publicUrl || null;
          }
        }
        return { ...doc, url };
      })
    );

    // Calculate stats
    const stats = {
      total: documentsWithUrls.length,
      verified: documentsWithUrls.filter(d => d.status === 'verified').length,
      pending: documentsWithUrls.filter(d => d.status === 'pending').length,
      rejected: documentsWithUrls.filter(d => d.status === 'rejected').length,
    };

    return NextResponse.json({ 
      documents: documentsWithUrls,
      stats 
    });
  } catch (error) {
    console.error('Error in documents GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload a document
export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const applicationId = formData.get('application_id') as string;
    const documentType = formData.get('document_type') as string;
    const file = formData.get('file') as File;

    console.log('Document upload - application_id:', applicationId, 'document_type:', documentType, 'file:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'missing');

    if (!applicationId || !documentType || !file) {
      console.log('Missing required fields:', { applicationId: !!applicationId, documentType: !!documentType, file: !!file });
      return NextResponse.json({ 
        error: 'Application ID, document type, and file are required',
        details: { applicationId: !!applicationId, documentType: !!documentType, file: !!file }
      }, { status: 400 });
    }

    // Validate document type
    if (!ALLOWED_DOCUMENT_TYPES[documentType]) {
      return NextResponse.json({ 
        error: 'Invalid document type',
        allowed_types: Object.keys(ALLOWED_DOCUMENT_TYPES)
      }, { status: 400 });
    }

    // Validate file type
    const allowedMimeTypes = ALLOWED_DOCUMENT_TYPES[documentType].mimeTypes;
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type for ${ALLOWED_DOCUMENT_TYPES[documentType].label}. Allowed: ${allowedMimeTypes.join(', ')}`
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Verify user owns the application or is partner/admin
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('student_id, partner_id, status')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check ownership
    let isOwner = false;
    if (authUser.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      isOwner = studentRecord?.id === application.student_id;
    } else if (authUser.role === 'partner') {
      // applications.partner_id stores users.id
      isOwner = application.partner_id === authUser.id;
    }

    if (!isOwner && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if document already exists for this type (to replace it)
    const { data: existingDoc } = await supabase
      .from('application_documents')
      .select('id, file_key')
      .eq('application_id', applicationId)
      .eq('document_type', documentType)
      .maybeSingle();

    // If replacing, delete old file from storage
    if (existingDoc?.file_key) {
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove([existingDoc.file_key]);
      } catch {
        // Ignore deletion errors
      }
    }

    // Generate file path in Supabase Storage: {application_id}/{document_type}_{timestamp}.{ext}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${applicationId}/${documentType}_${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file', details: uploadError.message }, { status: 500 });
    }

    // Generate signed URL for the uploaded file
    let publicUrl = '';
    const { data: signedUrlData } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 3600);
    
    if (signedUrlData?.signedUrl) {
      publicUrl = signedUrlData.signedUrl;
    } else {
      const { data: urlData } = supabase
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
      publicUrl = urlData?.publicUrl || '';
    }

    // Upsert document record - only use columns that exist in the table
    const docRecord: Record<string, unknown> = {
      application_id: applicationId,
      document_type: documentType,
      file_key: filePath,
      file_name: file.name,
      file_size: file.size,
      content_type: file.type,
      status: 'pending',
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // If replacing an existing document, include the id for upsert
    let result;
    if (existingDoc?.id) {
      // Update existing record
      const { data, error } = await supabase
        .from('application_documents')
        .update(docRecord)
        .eq('id', existingDoc.id)
        .select()
        .single();
      result = { data, error };
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('application_documents')
        .insert(docRecord)
        .select()
        .single();
      result = { data, error };
    }

    if (result.error) {
      console.error('Error saving document:', result.error);
      // Try to clean up uploaded file
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      } catch {
        // Ignore cleanup errors
      }
      return NextResponse.json({ error: 'Failed to save document', details: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      document: { ...result.data, url: publicUrl },
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Error in documents POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Get document and verify ownership
    const { data: docRecord, error: docError } = await supabase
      .from('application_documents')
      .select(`
        id,
        file_key,
        application_id,
        applications!inner(student_id, partner_id)
      `)
      .eq('id', documentId)
      .single();

    if (docError || !docRecord) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appData = docRecord.applications as any;
    let isOwner = false;
    if (authUser.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      isOwner = studentRecord?.id === appData.student_id;
    } else if (authUser.role === 'partner') {
      // applications.partner_id stores users.id
      isOwner = appData.partner_id === authUser.id;
    }

    if (!isOwner && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from Supabase Storage
    if (docRecord.file_key) {
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove([docRecord.file_key]);
      } catch (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('application_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting document:', error);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error in documents DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
