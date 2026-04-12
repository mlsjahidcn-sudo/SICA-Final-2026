import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import type { IndividualStudent } from '@/lib/types/admin-modules';

/**
 * GET /api/admin/individual-students
 * Fetch students who self-registered (referred_by_partner_id IS NULL)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabaseAdmin = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const nationality = searchParams.get('nationality') || '';
    const offset = (page - 1) * limit;

    // Query individual students (referred_by_partner_id IS NULL)
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        is_active,
        created_at,
        updated_at,
        students!left (
          id,
          first_name,
          last_name,
          nationality,
          passport_number,
          date_of_birth,
          gender,
          current_address,
          wechat_id
        )
      `, { count: 'exact' })
      .eq('role', 'student')
      .is('referred_by_partner_id', null) // Only individual students
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination AFTER filters (Supabase range applies to final result)
    const { data: allStudents, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching individual students:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Manual pagination
    const paginatedStudents = (allStudents || []).slice(offset, offset + limit);
    const count = allStudents?.length || 0;
    
    // Get total count for pagination stats (separate query for accurate total)
    const { count: totalCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .is('referred_by_partner_id', null);

    // Get application counts using student_id (applications uses student_id, not user_id)
    // Map users.id -> students.id -> applications.student_id
    const userToStudentMap = new Map<string, string>();
    for (const s of (allStudents || [])) {
      const studentRecord = Array.isArray(s.students) ? s.students[0] : s.students;
      if (s.id && studentRecord?.id) {
        userToStudentMap.set(s.id, studentRecord.id);
      }
    }
    const studentRecordIds = [...new Set(userToStudentMap.values())];
    
    const { data: applicationCounts } = studentRecordIds.length > 0
      ? await supabaseAdmin
          .from('applications')
          .select('student_id, status')
          .in('student_id', studentRecordIds)
      : { data: [] };

    const applicationMap = new Map<string, { total: number; pending: number }>();
    // Reverse map: student_record.id -> user.id
    const studentIdToUserId = new Map<string, string>();
    for (const [userId, studentRecordId] of userToStudentMap.entries()) {
      studentIdToUserId.set(studentRecordId, userId);
    }
    
    for (const app of (applicationCounts || [])) {
      // app.student_id is the students table ID, we need to map back to users.id
      const userId = studentIdToUserId.get(app.student_id);
      if (!userId) continue;
      const existing = applicationMap.get(userId) || { total: 0, pending: 0 };
      existing.total++;
      if (['submitted', 'under_review'].includes(app.status)) {
        existing.pending++;
      }
      applicationMap.set(userId, existing);
    }

    // Transform to IndividualStudent type
    const enrichedStudents: IndividualStudent[] = paginatedStudents.map(student => {
      const studentRecord = Array.isArray(student.students) ? student.students[0] : student.students;
      return {
        id: student.id,
        user_id: student.id,
        email: student.email,
        full_name: student.full_name,
        phone: student.phone,
        avatar_url: student.avatar_url,
        is_active: student.is_active,
        source: 'individual' as const,
        nationality: studentRecord?.nationality || null,
        gender: studentRecord?.gender || null,
        created_at: student.created_at,
        updated_at: student.updated_at,
        applications: applicationMap.get(student.id) || { total: 0, pending: 0 },
      };
    });

    // Apply nationality filter in-memory
    let filteredStudents = enrichedStudents;
    if (nationality) {
      filteredStudents = enrichedStudents.filter(s => 
        s.nationality?.toLowerCase() === nationality.toLowerCase()
      );
    }

    // Get stats
    const { count: activeCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .is('referred_by_partner_id', null)
      .eq('is_active', true);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count: newThisMonthCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .is('referred_by_partner_id', null)
      .gte('created_at', startOfMonth.toISOString());

    return NextResponse.json({
      students: filteredStudents,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
      stats: {
        total: totalCount || 0,
        active: activeCount || 0,
        newThisMonth: newThisMonthCount || 0,
        withApplications: applicationMap.size,
      },
    });
  } catch (error) {
    console.error('Error in individual students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
