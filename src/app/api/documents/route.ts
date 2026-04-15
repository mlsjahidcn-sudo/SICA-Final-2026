import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { verifyPartnerAuth } from '@/lib/partner-auth-utils';
import { 
  DOCUMENT_TYPES, 
  getAllowedMimeTypes, 
  getDocumentTypeLabel,
  normalizeDocumentType 
} from '@/lib/document-types';

/**
 * Check if a partner user can access a specific application.
 * - Admin: can access any application belonging to their partner org OR students referred by team members
 * - Member: can only access applications for students they personally referred
 */
async function canPartnerAccessApplication(
  partnerUser: { id: string; partner_role: string | null; partner_id: string | null },
  applicationStudentId: string,
  applicationPartnerId: string | null,
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<boolean> {
  const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';

  if (isAdmin) {
    // Admin can access apps from their partner org (applications.partner_id matches any partners.id for this user)
    if (applicationPartnerId) {
      const { data: partnerRecords } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', partnerUser.id);
      const partnerIds = (partnerRecords || []).map(r => r.id);
      if (partnerIds.includes(applicationPartnerId)) {
        return true;
      }
    }
    // Admin can also access apps for students referred by any team member
    // Get student's user_id to check referrer
    const { data: studentRec } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', applicationStudentId)
      .maybeSingle();
    
    if (studentRec?.user_id) {
      const { data: userRec } = await supabase
        .from('users')
        .select('referred_by_partner_id')
        .eq('id', studentRec.user_id)
        .maybeSingle();
      
      if (userRec?.referred_by_partner_id) {
        // Check if referrer is this partner or a team member
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
          .eq('role', 'partner');
        const teamIds = (teamMembers || []).map(m => m.id);
        if (!teamIds.includes(partnerUser.id)) teamIds.push(partnerUser.id);
        return teamIds.includes(userRec.referred_by_partner_id);
      }
    }
    return false;
  } else {
    // Member can only access apps for students they personally referred
    const { data: studentRec } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', applicationStudentId)
      .maybeSingle();
    
    if (studentRec?.user_id) {
      const { data: userRec } = await supabase
        .from('users')
        .select('referred_by_partner_id')
        .eq('id', studentRec.user_id)
        .maybeSingle();
      return userRec?.referred_by_partner_id === partnerUser.id;
    }
    return false;
  }
}

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

    console.log('[GET Documents] Auth user:', {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role
    });

    // Build query - use documents table which has student_id
    let query = supabase
      .from('documents')
      .select(`
        id,
        application_id,
        student_id,
        type,
        file_key,
        file_name,
        file_size,
        mime_type,
        status,
        rejection_reason,
        uploaded_at,
        uploaded_by,
        created_at,
        updated_at
      `);

    // Filter by student (primary) or application (secondary)
    if (applicationId) {
      // Get documents for a specific application OR student's documents
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
        // Use proper partner access control
        const partnerAuthResult = await verifyPartnerAuth(request);
        if ('error' in partnerAuthResult) {
          return partnerAuthResult.error;
        }
        isOwner = await canPartnerAccessApplication(
          partnerAuthResult.user,
          application.student_id,
          application.partner_id,
          supabase
        );
      }

      if (!isOwner && authUser.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Get all documents for the student (not just this application)
      // Documents belong to student, can be reused across applications
      query = query.eq('student_id', application.student_id);
    } else {
      // Get all documents for user's profile
      if (authUser.role === 'student') {
        const { data: studentRecord } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();
        
        console.log('[GET Documents] Student record for filtering:', studentRecord);
        
        if (studentRecord) {
          query = query.eq('student_id', studentRecord.id);
          console.log('[GET Documents] Filtering by student_id:', studentRecord.id);
        } else {
          // No student record - return empty result
          query = query.eq('student_id', '00000000-0000-0000-0000-000000000000');
          console.log('[GET Documents] No student record found, returning empty result');
        }
      } else if (authUser.role === 'partner') {
        // Partners see documents of students they referred
        const { data: referredStudents } = await supabase
          .from('users')
          .select('id')
          .eq('referred_by_partner_id', authUser.id);
        
        const studentUserIds = (referredStudents || []).map(u => u.id);
        
        if (studentUserIds.length > 0) {
          const { data: studentRecords } = await supabase
            .from('students')
            .select('id')
            .in('user_id', studentUserIds);
          
          const studentIds = (studentRecords || []).map(s => s.id);
          if (studentIds.length > 0) {
            query = query.in('student_id', studentIds);
          } else {
            query = query.eq('student_id', '00000000-0000-0000-0000-000000000000');
          }
        } else {
          query = query.eq('student_id', '00000000-0000-0000-0000-000000000000');
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

    console.log('[GET Documents] Query result:', {
      count: documents?.length || 0,
      error: error?.message,
      documentIds: documents?.map(d => d.id)
    });

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
        // Map field names to match expected format
        return {
          ...doc,
          document_type: doc.type,
          content_type: doc.mime_type,
          url
        };
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

// POST - Upload a document to student profile
export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const studentId = formData.get('student_id') as string; // Primary identifier
    const applicationId = formData.get('application_id') as string | null; // Optional link
    const documentType = formData.get('document_type') as string;
    const file = formData.get('file') as File;

    console.log('Document upload - student_id:', studentId, 'application_id:', applicationId, 'document_type:', documentType, 'file:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'missing');

    if (!studentId || !documentType || !file) {
      console.log('Missing required fields:', { studentId: !!studentId, documentType: !!documentType, file: !!file });
      return NextResponse.json({ 
        error: 'Student ID, document type, and file are required',
        details: { studentId: !!studentId, documentType: !!documentType, file: !!file }
      }, { status: 400 });
    }

    // Normalize document type (handle legacy types)
    const normalizedDocType = normalizeDocumentType(documentType)
    
    // Validate document type
    if (!DOCUMENT_TYPES[normalizedDocType]) {
      return NextResponse.json({ 
        error: 'Invalid document type',
        allowed_types: Object.keys(DOCUMENT_TYPES),
        details: `Document type "${documentType}" is not recognized. Please select a valid document type.`
      }, { status: 400 });
    }

    // Validate file type
    const allowedMimeTypes = getAllowedMimeTypes(normalizedDocType);
    if (!allowedMimeTypes.includes(file.type)) {
      const docLabel = getDocumentTypeLabel(normalizedDocType);
      return NextResponse.json({ 
        error: `Invalid file type for ${docLabel}`,
        allowed_types: allowedMimeTypes,
        received_type: file.type,
        details: `File type "${file.type}" is not allowed for ${docLabel}. Allowed types: ${allowedMimeTypes.join(', ')}`
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        max_size_bytes: MAX_FILE_SIZE,
        received_size_bytes: file.size,
        details: `Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please reduce the file size to under ${MAX_FILE_SIZE / 1024 / 1024}MB.`
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check ownership - student can upload to their own profile
    // Admin can upload to any student
    // Partner can upload to students they referred
    let isOwner = false;
    if (authUser.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      isOwner = studentRecord?.id === studentId;
    } else if (authUser.role === 'partner') {
      // Check if partner referred this student
      const { data: userRec } = await supabase
        .from('users')
        .select('referred_by_partner_id')
        .eq('id', student.user_id)
        .maybeSingle();
      isOwner = userRec?.referred_by_partner_id === authUser.id;
    }

    if (!isOwner && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - can only upload to your own profile or students you referred' }, { status: 403 });
    }

    // If application_id provided, verify it belongs to this student
    if (applicationId) {
      const { data: application } = await supabase
        .from('applications')
        .select('student_id')
        .eq('id', applicationId)
        .single();
      
      if (!application || application.student_id !== studentId) {
        return NextResponse.json({ error: 'Application does not belong to this student' }, { status: 400 });
      }
    }

    // Check if document already exists for this type (to replace it)
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id, file_key')
      .eq('student_id', studentId)
      .eq('type', normalizedDocType)
      .maybeSingle();

    // If replacing, delete old file from storage
    if (existingDoc?.file_key) {
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove([existingDoc.file_key]);
      } catch {
        // Ignore deletion errors
      }
    }

    // Generate file path in Supabase Storage: {student_id}/{document_type}_{timestamp}.{ext}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${studentId}/${normalizedDocType}_${timestamp}_${sanitizedFileName}`;

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
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload file';
      let errorDetails = uploadError.message;
      
      if (uploadError.message.includes('Bucket not found')) {
        errorMessage = 'Storage bucket not configured';
        errorDetails = 'The document storage bucket is not set up. Please contact support.';
      } else if (uploadError.message.includes('exceeded') || uploadError.message.includes('quota')) {
        errorMessage = 'Storage quota exceeded';
        errorDetails = 'The storage limit has been reached. Please contact support.';
      } else if (uploadError.message.includes('permission')) {
        errorMessage = 'Permission denied';
        errorDetails = 'You do not have permission to upload files. Please contact support.';
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: errorDetails,
        storage_error: uploadError.message
      }, { status: 500 });
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

    // Upsert document record using documents table
    const docRecord: Record<string, unknown> = {
      student_id: studentId,
      application_id: applicationId || null, // Optional link to application
      type: normalizedDocType, // Use 'type' field
      file_key: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type, // Use 'mime_type' field
      status: 'pending',
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      uploaded_by: authUser.id, // Track who uploaded the document
    };

    // If replacing an existing document, include the id for upsert
    let result;
    if (existingDoc?.id) {
      // Update existing record
      const { data, error } = await supabase
        .from('documents')
        .update(docRecord)
        .eq('id', existingDoc.id)
        .select()
        .single();
      result = { data, error };
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('documents')
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

    // Map field names for response
    const responseDoc = {
      ...result.data,
      document_type: result.data.type,
      content_type: result.data.mime_type,
      url: publicUrl
    };

    return NextResponse.json({ 
      document: responseDoc,
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
      .from('documents')
      .select(`
        id,
        file_key,
        student_id
      `)
      .eq('id', documentId)
      .single();

    if (docError || !docRecord) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check ownership - can delete if student owns it, admin, or partner who referred
    let isOwner = false;
    
    console.log('[DELETE Document] Auth user:', {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role
    });
    console.log('[DELETE Document] Document data:', {
      student_id: docRecord.student_id
    });
    
    if (authUser.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      
      console.log('[DELETE Document] Student record:', studentRecord);
      console.log('[DELETE Document] Ownership check:', {
        studentRecordId: studentRecord?.id,
        docStudentId: docRecord.student_id,
        isMatch: studentRecord?.id === docRecord.student_id
      });
      
      isOwner = studentRecord?.id === docRecord.student_id;
    } else if (authUser.role === 'partner') {
      // Check if partner referred this student
      const { data: studentRec } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', docRecord.student_id)
        .maybeSingle();
      
      if (studentRec?.user_id) {
        const { data: userRec } = await supabase
          .from('users')
          .select('referred_by_partner_id')
          .eq('id', studentRec.user_id)
          .maybeSingle();
        isOwner = userRec?.referred_by_partner_id === authUser.id;
      }
    }

    console.log('[DELETE Document] Final check:', {
      isOwner,
      role: authUser.role,
      isAdmin: authUser.role === 'admin'
    });

    if (!isOwner && authUser.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Forbidden',
        details: {
          userRole: authUser.role,
          isOwner,
          reason: authUser.role === 'student' 
            ? 'Document does not belong to you'
            : 'Access denied'
        }
      }, { status: 403 });
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
      .from('documents')
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
