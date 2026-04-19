import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import type { IndividualStudent } from '@/lib/types/admin-modules';

/**
 * GET /api/admin/individual-students
 * Fetch students who self-registered (referred_by_partner_id IS NULL)
 *
 * Query params: page, limit, search, nationality
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabaseAdmin = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Support ?id= for single record lookup (detail page)
    const idParam = searchParams.get('id');
    if (idParam) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          avatar_url,
          is_active,
          country,
          city,
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
            wechat_id,
            highest_education,
            institution_name
          )
        `)
        .eq('id', idParam)
        .eq('role', 'student')
        .is('referred_by_partner_id', null)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const studentRecord = Array.isArray(data.students) ? data.students[0] : data.students;
      const student: IndividualStudent = {
        id: data.id,
        user_id: data.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        avatar_url: data.avatar_url,
        is_active: data.is_active,
        country: data.country || null,
        city: data.city || null,
        source: 'individual' as const,
        nationality: studentRecord?.nationality || null,
        gender: studentRecord?.gender || null,
        date_of_birth: studentRecord?.date_of_birth || null,
        passport_number: studentRecord?.passport_number || null,
        current_address: studentRecord?.current_address || null,
        wechat_id: studentRecord?.wechat_id || null,
        highest_education: studentRecord?.highest_education || null,
        institution_name: studentRecord?.institution_name || null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        applications: { total: 0, pending: 0 },
      };

      // Get application counts for this student
      if (studentRecord?.id) {
        const { data: apps } = await supabaseAdmin
          .from('applications')
          .select('status')
          .eq('student_id', studentRecord.id);
        if (apps && apps.length > 0) {
          student.applications = {
            total: apps.length,
            pending: apps.filter(a => ['submitted', 'under_review'].includes(a.status)).length,
          };
        }
      }

      return NextResponse.json(student);
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const nationality = searchParams.get('nationality') || '';
    const offset = (page - 1) * limit;

    // Build base query with country/city fields included
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        is_active,
        country,
        city,
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
          wechat_id,
          highest_education,
          institution_name
        )
      `, { count: 'exact' })
      .eq('role', 'student')
      .is('referred_by_partner_id', null)
      .order('created_at', { ascending: false });

    // Apply nationality filter at DATABASE level (before pagination)
    if (nationality) {
      query = query.ilike('students.nationality', `%${nationality}%`);
    }

    // Apply search filter at DATABASE level (before pagination)
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Fetch ALL matching records (for accurate counting + application enrichment)
    const { data: allStudents, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching individual students:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Manual pagination on FILTERED results
    const paginatedStudents = (allStudents || []).slice(offset, offset + limit);
    const filteredCount = allStudents?.length || 0;

    // Build user -> student record mapping for application lookups
    const userToStudentMap = new Map<string, string>();
    for (const s of (allStudents || [])) {
      const studentRecord = Array.isArray(s.students) ? s.students[0] : s.students;
      if (s.id && studentRecord?.id) {
        userToStudentMap.set(s.id, studentRecord.id);
      }
    }
    const studentRecordIds = [...new Set(userToStudentMap.values())];

    // Batch-fetch application counts
    const { data: applicationCounts } = studentRecordIds.length > 0
      ? await supabaseAdmin
          .from('applications')
          .select('student_id, status')
          .in('student_id', studentRecordIds)
      : { data: [] };

    const applicationMap = new Map<string, { total: number; pending: number }>();
    const studentIdToUserId = new Map<string, string>();
    for (const [userId, studentRecordId] of userToStudentMap.entries()) {
      studentIdToUserId.set(studentRecordId, userId);
    }

    for (const app of (applicationCounts || [])) {
      const userId = studentIdToUserId.get(app.student_id);
      if (!userId) continue;
      const existing = applicationMap.get(userId) || { total: 0, pending: 0 };
      existing.total++;
      if (['submitted', 'under_review'].includes(app.status)) {
        existing.pending++;
      }
      applicationMap.set(userId, existing);
    }

    // Transform to IndividualStudent type with all fields
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
        country: student.country || null,
        city: student.city || null,
        source: 'individual' as const,
        nationality: studentRecord?.nationality || null,
        gender: studentRecord?.gender || null,
        date_of_birth: studentRecord?.date_of_birth || null,
        passport_number: studentRecord?.passport_number || null,
        current_address: studentRecord?.current_address || null,
        wechat_id: studentRecord?.wechat_id || null,
        highest_education: studentRecord?.highest_education || null,
        institution_name: studentRecord?.institution_name || null,
        created_at: student.created_at,
        updated_at: student.updated_at,
        applications: applicationMap.get(student.id) || { total: 0, pending: 0 },
      };
    });

    // Get stats (based on filtered criteria where applicable)
    let statsQuery = supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .is('referred_by_partner_id', null);

    if (nationality) {
      // For stats with nationality filter, use a different approach via students table
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
        students: enrichedStudents,
        pagination: {
          page,
          limit,
          total: filteredCount,
          totalPages: Math.ceil(filteredCount / limit),
        },
        stats: {
          total: filteredCount,
          active: activeCount || 0,
          newThisMonth: newThisMonthCount || 0,
          withApplications: applicationMap.size,
        },
      });
    }

    const { count: activeCount } = await statsQuery.eq('is_active', true);

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
      students: enrichedStudents,
      pagination: {
        page,
        limit,
        total: filteredCount,
        totalPages: Math.ceil(filteredCount / limit),
      },
      stats: {
        total: filteredCount,
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
