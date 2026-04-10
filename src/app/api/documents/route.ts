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

    // Build query
    let query = supabase
      .from('application_documents')
      .select(`
        id,
        application_id,
        document_type,
        file_key,
        file_url,
        file_name,
        file_size,
        content_type,
        status,
        rejection_reason,
        uploaded_at,
        uploaded_by,
        created_at,
        updated_at,
        applications (
          id,
          status,
          programs (
            id,
            name_en,
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
        .select('student_id')
        .eq('id', applicationId)
        .single();

      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      // applications.student_id references students.id, NOT users.id
      // For students: look up their student record to compare
      let isOwner = false;
      if (authUser.role === 'student') {
        const { data: studentRecord } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();
        isOwner = studentRecord?.id === application.student_id;
      }

      if (!isOwner && !['admin', 'partner'].includes(authUser.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      query = query.eq('application_id', applicationId);
    } else {
      // Get all documents for user's applications
      if (authUser.role === 'student') {
        // applications.student_id = students.id, need to resolve via students.user_id
        const { data: studentRecord } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();
        if (studentRecord) {
          query = query.eq('applications.student_id', studentRecord.id);
        } else {
          query = query.eq('applications.student_id', '00000000-0000-0000-0000-000000000000'); // no match
        }
      } else if (authUser.role === 'partner') {
        // applications.partner_id references partners.id, NOT users.id
        const { data: partnerRecord } = await supabase
          .from('partners')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();
        if (partnerRecord) {
          query = query.eq('applications.partner_id', partnerRecord.id);
        } else {
          query = query.eq('applications.partner_id', '00000000-0000-0000-0000-000000000000'); // no match
        }
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

    // Generate public URLs for documents stored in Supabase Storage
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        let url = null;
        if (doc.file_key) {
          // Get public URL from Supabase Storage
          const { data: urlData } = supabase
            .storage
            .from('documents')
            .getPublicUrl(doc.file_key);
          url = urlData?.publicUrl || null;
        } else if (doc.file_url) {
          // Fallback to legacy file_url
          url = doc.file_url;
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

    if (!applicationId || !documentType || !file) {
      return NextResponse.json({ 
        error: 'Application ID, document type, and file are required' 
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

    // Verify user owns the application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('student_id, status')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // applications.student_id references students.id, NOT users.id
    let isOwner = false;
    if (authUser.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      isOwner = studentRecord?.id === application.student_id;
    }

    if (!isOwner && authUser.role !== 'admin' && authUser.role !== 'partner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if document already exists for this type
    const { data: existingDoc } = await supabase
      .from('application_documents')
      .select('id, file_key')
      .eq('application_id', applicationId)
      .eq('document_type', documentType)
      .single();

    // If replacing, delete old file from storage
    if (existingDoc?.file_key) {
      try {
        await supabase.storage.from('documents').remove([existingDoc.file_key]);
      } catch {
        // Ignore deletion errors
      }
    }

    // Generate file path in Supabase Storage: {user_id}/{application_id}/{document_type}_{timestamp}.{ext}
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'pdf';
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${authUser.id}/${applicationId}/${documentType}_${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl || '';

    // Upsert document record
    const { data: document, error } = await supabase
      .from('application_documents')
      .upsert({
        id: existingDoc?.id,
        application_id: applicationId,
        document_type: documentType,
        file_key: filePath,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        content_type: file.type,
        uploaded_by: authUser.id,
        status: 'pending',
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving document:', error);
      // Try to clean up uploaded file
      try {
        await supabase.storage.from('documents').remove([filePath]);
      } catch {
        // Ignore cleanup errors
      }
      return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
    }

    return NextResponse.json({ 
      document: { ...document, url: publicUrl },
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
        applications!inner(student_id)
      `)
      .eq('id', documentId)
      .single();

    if (docError || !docRecord) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // applications.student_id references students.id, NOT users.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let isOwner = false;
    if (authUser.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isOwner = studentRecord?.id === (docRecord.applications as any).student_id;
    }

    if (!isOwner && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from Supabase Storage
    if (docRecord.file_key) {
      try {
        await supabase.storage.from('documents').remove([docRecord.file_key]);
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
