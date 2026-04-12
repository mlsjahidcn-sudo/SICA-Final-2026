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
        students (
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: students, error, count } = await query;

    if (error) {
      console.error('Error fetching individual students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Get application counts
    const studentIds = students?.map(s => s.id) || [];
    const { data: applicationCounts } = await supabaseAdmin
      .from('applications')
      .select('user_id, status')
      .in('user_id', studentIds);

    const applicationMap = new Map<string, { total: number; pending: number }>();
    for (const app of (applicationCounts || [])) {
      const existing = applicationMap.get(app.user_id) || { total: 0, pending: 0 };
      existing.total++;
      if (['submitted', 'under_review'].includes(app.status)) {
        existing.pending++;
      }
      applicationMap.set(app.user_id, existing);
    }

    // Transform to IndividualStudent type
    const enrichedStudents: IndividualStudent[] = (students || []).map(student => {
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
    const { count: totalCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .is('referred_by_partner_id', null);

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
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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
