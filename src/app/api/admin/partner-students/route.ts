import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import type { PartnerStudent } from '@/lib/types/admin-modules';

/**
 * GET /api/admin/partner-students
 * Fetch students referred by partners (referred_by_partner_id IS NOT NULL)
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
    const partner_id = searchParams.get('partner_id') || ''; // Filter by specific partner
    const offset = (page - 1) * limit;

    // Query partner-referred students
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
        referred_by_partner_id,
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
      .not('referred_by_partner_id', 'is', null) // Only partner-referred students
      .order('created_at', { ascending: false });

    // Filter by specific partner if provided
    if (partner_id) {
      query = query.eq('referred_by_partner_id', partner_id);
    }

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: allStudents, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching partner students:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Manual pagination
    const paginatedStudents = (allStudents || []).slice(offset, offset + limit);
    
    // Get total count separately
    const { count: totalCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .not('referred_by_partner_id', 'is', null);

    // Get partner info
    const partnerIds = [...new Set(allStudents?.map(s => s.referred_by_partner_id).filter(Boolean) || [])];
    const { data: partnerUsers } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .in('id', partnerIds);

    const { data: partnerRecords } = await supabaseAdmin
      .from('partners')
      .select('user_id, company_name')
      .in('user_id', partnerIds);

    const partnerMap = new Map<string, { id: string; full_name: string; email: string; company_name?: string }>();
    const partnerCompanyMap = new Map<string, string>();
    
    for (const pr of (partnerRecords || [])) {
      partnerCompanyMap.set(pr.user_id, pr.company_name);
    }
    
    for (const pu of (partnerUsers || [])) {
      partnerMap.set(pu.id, {
        id: pu.id,
        full_name: pu.full_name,
        email: pu.email,
        company_name: partnerCompanyMap.get(pu.id),
      });
    }

    // Get application counts using student_id (applications uses student_id, not user_id)
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
      const userId = studentIdToUserId.get(app.student_id);
      if (!userId) continue;
      const existing = applicationMap.get(userId) || { total: 0, pending: 0 };
      existing.total++;
      if (['submitted', 'under_review'].includes(app.status)) {
        existing.pending++;
      }
      applicationMap.set(userId, existing);
    }

    // Transform to PartnerStudent type
    const enrichedStudents: PartnerStudent[] = paginatedStudents.map(student => {
      const studentRecord = Array.isArray(student.students) ? student.students[0] : student.students;
      return {
        id: student.id,
        user_id: student.id,
        email: student.email,
        full_name: student.full_name,
        phone: student.phone,
        avatar_url: student.avatar_url,
        is_active: student.is_active,
        source: 'partner_referred' as const,
        referred_by_partner_id: student.referred_by_partner_id,
        referred_by_partner: student.referred_by_partner_id 
          ? partnerMap.get(student.referred_by_partner_id) || null
          : null,
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
      .not('referred_by_partner_id', 'is', null)
      .eq('is_active', true);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count: newThisMonthCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .not('referred_by_partner_id', 'is', null)
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
    console.error('Error in partner students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
