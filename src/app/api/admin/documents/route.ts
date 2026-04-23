import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';
import { getDocumentTypeLabel } from '@/lib/document-types';

/**
 * GET /api/admin/documents
 *
 * List documents with filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const userOrResponse = await verifyAdmin(request);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const searchParams = request.nextUrl.searchParams;

    // --- Pagination & Sorting ---
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // --- Filters ---
    const studentId = searchParams.get('student_id');
    const applicationId = searchParams.get('application_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search') || '';

    const supabase = getSupabaseClient();

    // Step 1: Build document query (without nested relations)
    let query = supabase
      .from('documents')
      .select('id, student_id, application_id, type, file_name, file_url, file_key, file_size, status, rejection_reason, uploaded_by, verified_by, notes, uploaded_at, created_at, updated_at', { count: 'exact' });

    if (studentId) query = query.eq('student_id', studentId);
    if (applicationId) query = query.eq('application_id', applicationId);
    if (status && status !== 'all') query = query.eq('status', status);
    if (type && type !== 'all') query = query.eq('type', type);

    // Sorting
    const allowedSortColumns = ['created_at', 'updated_at', 'file_name', 'status', 'type'];
    const orderColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: documents, error, count } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents', details: error.message },
        { status: 500 }
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        documents: [],
        pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
      });
    }

    // Step 2: Get student IDs from documents
    const studentIds = [...new Set(documents.map(d => d.student_id).filter(Boolean))] as string[];

    // Step 3: Fetch students
    let studentsData: Record<string, { id: string; first_name: string; last_name: string; user_id: string; nationality: string | null }> = {};
    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name, user_id, nationality')
        .in('id', studentIds);
      (students || []).forEach(s => { studentsData[s.id] = s; });
    }

    // Step 4: Fetch users (emails) for students
    const userIds = Object.values(studentsData).map(s => s.user_id).filter(Boolean);
    let usersData: Record<string, { email: string }> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);
      (users || []).forEach(u => { usersData[u.id] = u; });
    }

    // Step 5: Get application IDs for related applications
    const applicationIds = [...new Set(documents.map(d => d.application_id).filter(Boolean))] as string[];
    let applicationsData: Record<string, { id: string; status: string; program_id: string | null }> = {};
    if (applicationIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select('id, status, program_id')
        .in('id', applicationIds);
      (apps || []).forEach(a => { applicationsData[a.id] = a; });
    }

    // Step 6: Get program names for applications
    const programIds = Object.values(applicationsData).map(a => a.program_id).filter(Boolean) as string[];
    let programsData: Record<string, { name: string }> = {};
    if (programIds.length > 0) {
      const { data: programs } = await supabase
        .from('programs')
        .select('id, name')
        .in('id', programIds);
      (programs || []).forEach(p => { programsData[p.id] = p; });
    }

    // Step 7: Merge all data
    const enrichedDocuments = documents.map(doc => {
      const student = doc.student_id ? studentsData[doc.student_id] : null;
      const user = student?.user_id ? usersData[student.user_id] : null;
      const app = doc.application_id ? applicationsData[doc.application_id] : null;
      const program = app?.program_id ? programsData[app.program_id] : null;

      return {
        id: doc.id,
        student_id: doc.student_id,
        application_id: doc.application_id,
        type: doc.type,
        document_type: doc.type,
        document_type_label: getDocumentTypeLabel(String(doc.type || '')),
        file_name: doc.file_name,
        file_url: doc.file_url,
        file_key: doc.file_key,
        file_size: doc.file_size,
        status: doc.status,
        rejection_reason: doc.rejection_reason,
        uploaded_by: doc.uploaded_by,
        verified_by: doc.verified_by,
        notes: doc.notes,
        uploaded_at: doc.uploaded_at || doc.created_at,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        student: student ? {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          name: `${student.first_name} ${student.last_name}`.trim(),
          email: user?.email || '',
          nationality: student.nationality,
        } : null,
        application: app ? {
          id: app.id,
          status: app.status,
          program_name: program?.name || '',
        } : null,
      };
    });

    // Filter by search term in memory (file_name, student name)
    let filteredDocuments = enrichedDocuments;
    if (search.trim()) {
      const term = search.toLowerCase();
      filteredDocuments = enrichedDocuments.filter(doc => {
        const matchFile = doc.file_name?.toLowerCase().includes(term);
        const matchStudent = doc.student && (
          (doc.student.first_name + ' ' + doc.student.last_name).toLowerCase().includes(term)
        );
        return matchFile || matchStudent;
      });
    }

    return NextResponse.json({
      documents: filteredDocuments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in admin documents GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
