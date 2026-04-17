import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth } from '@/lib/partner/roles';
import { getDocumentTypeLabel } from '@/lib/document-types';

/**
 * GET /api/partner/documents
 * 
 * Centralized document library for partners with advanced filtering and sorting.
 * 
 * Query Parameters:
 * - student_id: Filter by student ID
 * - status: Filter by document status (pending, verified, rejected, all)
 * - type: Filter by document type
 * - is_expiring: Filter documents expiring soon (true/false)
 * - is_expired: Filter expired documents (true/false)
 * - search: Search by student name or document name
 * - sort_by: Sort field (created_at, updated_at, student_name, type, status, expires_at)
 * - sort_order: Sort order (asc, desc)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const partnerAuth = await verifyPartnerAuth(request);
    if ('error' in partnerAuth) {
      return partnerAuth.error;
    }

    const { user: partnerUser } = partnerAuth;
    const supabase = getSupabaseClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const isExpiring = searchParams.get('is_expiring') === 'true';
    const isExpired = searchParams.get('is_expired') === 'true';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // Determine partner's access scope
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    
    // Get partner's student IDs (students they can access)
    let accessibleStudentIds: string[] = [];
    
    if (isAdmin) {
      // Admin can access:
      // 1. Students referred by themselves
      // 2. Students referred by team members
      
      // Get team members' user IDs
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
        .eq('role', 'partner');
      
      const teamUserIds = [partnerUser.id, ...(teamMembers || []).map(m => m.id)];
      
      // Get students referred by team
      const { data: referredStudents } = await supabase
        .from('users')
        .select('id')
        .in('referred_by_partner_id', teamUserIds);
      
      const studentUserIds = (referredStudents || []).map(s => s.id);
      
      if (studentUserIds.length > 0) {
        const { data: studentRecords } = await supabase
          .from('students')
          .select('id')
          .in('user_id', studentUserIds);
        
        accessibleStudentIds = (studentRecords || []).map(s => s.id);
      }
    } else {
      // Member can only access students they personally referred
      const { data: referredStudents } = await supabase
        .from('users')
        .select('id')
        .eq('referred_by_partner_id', partnerUser.id);
      
      const studentUserIds = (referredStudents || []).map(s => s.id);
      
      if (studentUserIds.length > 0) {
        const { data: studentRecords } = await supabase
          .from('students')
          .select('id')
          .in('user_id', studentUserIds);
        
        accessibleStudentIds = (studentRecords || []).map(s => s.id);
      }
    }

    if (accessibleStudentIds.length === 0) {
      return NextResponse.json({
        documents: [],
        pagination: {
          page,
          limit,
          total: 0,
          total_pages: 0
        }
      });
    }

    // Build base query with student info
    let query = supabase
      .from('documents')
      .select(`
        id,
        student_id,
        application_id,
        type,
        file_key,
        file_name,
        file_size,
        mime_type,
        status,
        rejection_reason,
        expires_at,
        uploaded_at,
        uploaded_by,
        created_at,
        updated_at,
        students (
          id,
          first_name,
          last_name,
          email,
          user_id
        )
      `, { count: 'exact' });

    // Filter by accessible students
    if (studentId) {
      // If specific student requested, verify access
      if (!accessibleStudentIds.includes(studentId)) {
        return NextResponse.json({ error: 'Access denied to this student' }, { status: 403 });
      }
      query = query.eq('student_id', studentId);
    } else {
      query = query.in('student_id', accessibleStudentIds);
    }

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (isExpiring) {
      // Documents expiring within 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      query = query
        .not('expires_at', 'is', null)
        .gte('expires_at', new Date().toISOString())
        .lte('expires_at', thirtyDaysFromNow.toISOString());
    }

    if (isExpired) {
      // Documents that have expired
      query = query
        .not('expires_at', 'is', null)
        .lt('expires_at', new Date().toISOString());
    }

    if (search) {
      // Search by student name or document name
      // Note: This requires a more complex query, we'll filter in application code
      // For now, we'll do a basic search on file_name
      query = query.ilike('file_name', `%${search}%`);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    
    switch (sortBy) {
      case 'student_name':
        // Need to sort by student name - handled in post-processing
        query = query.order('created_at', { ascending: false });
        break;
      case 'expires_at':
        query = query.order('expires_at', { ascending, nullsFirst: false });
        break;
      case 'type':
        query = query.order('type', { ascending });
        break;
      case 'status':
        query = query.order('status', { ascending });
        break;
      case 'updated_at':
        query = query.order('updated_at', { ascending });
        break;
      case 'created_at':
      default:
        query = query.order('created_at', { ascending });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: documents, error, count } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // Generate signed URLs and process documents
    const processedDocs = await Promise.all(
      (documents || []).map(async (doc) => {
        let url = null;
        if (doc.file_key) {
          const { data: signedUrlData } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(doc.file_key, 3600);
          
          url = signedUrlData?.signedUrl || null;
        }

        // Calculate expiry status
        let expiryStatus = null;
        if (doc.expires_at) {
          const expiresAt = new Date(doc.expires_at);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            expiryStatus = 'expired';
          } else if (daysUntilExpiry <= 30) {
            expiryStatus = 'expiring';
          } else {
            expiryStatus = 'valid';
          }
        }

        const studentData: any = doc.students && !Array.isArray(doc.students) ? doc.students : (Array.isArray(doc.students) ? doc.students[0] : null);

        return {
          ...doc,
          document_type: doc.type,
          document_type_label: getDocumentTypeLabel(doc.type),
          url,
          expiry_status: expiryStatus,
          student: studentData ? {
            id: studentData.id,
            name: `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() || 'Unknown Student',
            email: studentData.email
          } : null
        };
      })
    );

    // Post-process sorting for student_name
    if (sortBy === 'student_name') {
      processedDocs.sort((a, b) => {
        const nameA = a.student?.name || '';
        const nameB = b.student?.name || '';
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    return NextResponse.json({
      documents: processedDocs,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in partner documents GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/partner/documents
 * 
 * Upload a new document for a student.
 * 
 * Request body (multipart/form-data):
 * - student_id: Student ID (required)
 * - type: Document type (required)
 * - file: File to upload (required)
 * - application_id: Application ID (optional)
 * - expires_at: Expiration date ISO string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const partnerAuth = await verifyPartnerAuth(request);
    if ('error' in partnerAuth) {
      return partnerAuth.error;
    }

    const { user: partnerUser } = partnerAuth;
    const supabase = getSupabaseClient();

    // Parse form data
    const formData = await request.formData();
    const studentId = formData.get('student_id') as string;
    const type = formData.get('type') as string;
    const file = formData.get('file') as File;
    const applicationId = formData.get('application_id') as string | null;
    const expiresAt = formData.get('expires_at') as string | null;

    // Validate required fields
    if (!studentId || !type || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, type, file' },
        { status: 400 }
      );
    }

    // Verify partner has access to this student
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    
    // Get student's user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if partner has access to this student
    const { data: studentUser } = await supabase
      .from('users')
      .select('id, referred_by_partner_id')
      .eq('id', student.user_id)
      .single();

    if (!studentUser) {
      return NextResponse.json({ error: 'Student user not found' }, { status: 404 });
    }

    // Verify access
    if (!isAdmin) {
      // Member can only upload for students they personally referred
      if (studentUser.referred_by_partner_id !== partnerUser.id) {
        return NextResponse.json(
          { error: 'You do not have access to this student' },
          { status: 403 }
        );
      }
    } else {
      // Admin can upload for team's students
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
        .eq('role', 'partner');
      
      const teamUserIds = [partnerUser.id, ...(teamMembers || []).map(m => m.id)];
      
      if (!teamUserIds.includes(studentUser.referred_by_partner_id)) {
        return NextResponse.json(
          { error: 'You do not have access to this student' },
          { status: 403 }
        );
      }
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}/${type}_${Date.now()}_${file.name}`;
    const filePath = fileName;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Insert document record
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        student_id: studentId,
        application_id: applicationId || null,
        type,
        file_name: file.name,
        file_path: filePath,
        file_key: filePath,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending',
        uploaded_by: partnerUser.id,
        uploaded_at: new Date().toISOString(),
        expires_at: expiresAt || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting document:', insertError);
      
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Document uploaded successfully',
      document,
    });
  } catch (error) {
    console.error('Error in partner documents POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
