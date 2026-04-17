import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';
import { getDocumentTypeLabel } from '@/lib/document-types';

/**
 * GET /api/admin/documents
 * 
 * Centralized document library for admins with filtering and sorting.
 */
export async function GET(request: NextRequest) {
  try {
    const userOrResponse = await verifyAdmin(request);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const supabase = getSupabaseClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const applicationId = searchParams.get('application_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('documents')
      .select(`
        *,
        students!inner (
          id,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' });

    // Apply filters
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    
    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (search) {
      query = query.or(`file_name.ilike.%${search}%,students.first_name.ilike.%${search}%,students.last_name.ilike.%${search}%`);
    }

    // Apply sorting
    if (sortBy === 'student_name') {
      // Sorting by related table isn't directly supported in this way in Supabase without RPC,
      // but we can fallback to created_at or fetch and sort in memory if needed.
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: documents, count, error } = await query;

    if (error) {
      console.error('Supabase error fetching admin documents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents', details: error.message },
        { status: 500 }
      );
    }

    // Format the response to ensure consistent structure
    const formattedDocuments = documents?.map(doc => {
      // Handle the case where students might be an array (it shouldn't be with !inner, but for safety)
      const studentData: any = doc.students && !Array.isArray(doc.students) 
        ? doc.students 
        : (Array.isArray(doc.students) ? doc.students[0] : null);

      return {
        ...doc,
        document_type: doc.type,
        document_type_label: getDocumentTypeLabel(String(doc.type || '')),
        student: studentData ? {
          id: studentData.id,
          name: `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() || 'Unknown Student',
          email: studentData.email
        } : null
      };
    }) || [];

    // Memory sort if student_name was requested
    if (sortBy === 'student_name') {
      formattedDocuments.sort((a, b) => {
        const nameA = a.student?.name || '';
        const nameB = b.student?.name || '';
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    }

    return NextResponse.json({
      data: formattedDocuments,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('Error in admin documents API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
