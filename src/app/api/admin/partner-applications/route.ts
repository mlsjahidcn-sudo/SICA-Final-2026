import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import type { ApplicationWithPartner } from '@/lib/types/admin-modules';

/**
 * GET /api/admin/partner-applications
 * Fetch applications from partner-referred students (partner_id IS NOT NULL)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabaseAdmin = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const universityId = searchParams.get('university_id') || '';
    const degreeLevel = searchParams.get('degree_type') || searchParams.get('degree_level') || '';
    const search = searchParams.get('search') || '';
    const partner_id = searchParams.get('partner_id') || ''; // Filter by specific partner
    const offset = (page - 1) * limit;

    // First get user IDs of partner-referred students
    const { data: partnerUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .not('referred_by_partner_id', 'is', null);
    
    const partnerUserIds = (partnerUsers || []).map(u => u.id);
    
    // If no partner users, return empty result
    if (partnerUserIds.length === 0) {
      return NextResponse.json({
        applications: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: { total: 0, pending: 0, underReview: 0, accepted: 0, rejected: 0 },
      });
    }
    
    // Get student IDs for partner-referred users
    const { data: partnerStudentRecords } = await supabaseAdmin
      .from('students')
      .select('id')
      .in('user_id', partnerUserIds);
    
    const partnerStudentIds = (partnerStudentRecords || []).map(s => s.id);
    
    // If no partner students, return empty result
    if (partnerStudentIds.length === 0) {
      return NextResponse.json({
        applications: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: { total: 0, pending: 0, underReview: 0, accepted: 0, rejected: 0 },
      });
    }
    
    // Query applications from partner-referred students
    let query = supabaseAdmin
      .from('applications')
      .select(`
        id,
        status,
        priority,
        notes,
        submitted_at,
        created_at,
        updated_at,
        partner_id,
        students (
          id,
          user_id,
          nationality,
          gender,
          highest_education,
          users (
            id,
            full_name,
            email,
            referred_by_partner_id
          )
        ),
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name_en,
            city,
            province
          )
        )
      `, { count: 'exact' })
      .in('student_id', partnerStudentIds) // Only applications from partner-referred students
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (universityId) {
      query = query.eq('programs.university_id', universityId);
    }

    if (degreeLevel) {
      query = query.eq('programs.degree_level', degreeLevel);
    }

    if (partner_id) {
      query = query.eq('partner_id', partner_id);
    }

    if (search) {
      // Note: Supabase doesn't support complex OR queries with nested relations
      // We'll filter in-memory after fetching for now
    }

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching partner applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Get partner info for referred students
    const partnerIds = [...new Set(
      applications?.map(app => {
        const student = Array.isArray(app.students) ? app.students[0] : app.students;
        const studentUser = student?.users
          ? (Array.isArray(student.users) ? student.users[0] : student.users)
          : null;
        return studentUser?.referred_by_partner_id;
      }).filter(Boolean) || []
    )] as string[];

    const partnerMap = new Map<string, { id: string; full_name: string; email: string; company_name?: string }>();
    
    // Only query if there are partner IDs
    if (partnerIds.length > 0) {
      const { data: partnerUserDetails } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email')
        .in('id', partnerIds);

      const { data: partnerRecords } = await supabaseAdmin
        .from('partners')
        .select('user_id, company_name')
        .in('user_id', partnerIds);

      const partnerCompanyMap = new Map<string, string>();
      
      for (const pr of (partnerRecords || [])) {
        partnerCompanyMap.set(pr.user_id, pr.company_name);
      }
      
      for (const pu of (partnerUserDetails || [])) {
        partnerMap.set(pu.id, {
          id: pu.id,
          full_name: pu.full_name,
          email: pu.email,
          company_name: partnerCompanyMap.get(pu.id),
        });
      }
    }

    // Transform data
    let transformedApplications: ApplicationWithPartner[] = (applications || []).map(app => {
      const student = Array.isArray(app.students) ? app.students[0] : app.students;
      const studentUser = student?.users
        ? (Array.isArray(student.users) ? student.users[0] : student.users)
        : null;
      const program = Array.isArray(app.programs) ? app.programs[0] : app.programs;
      const university = program?.universities
        ? (Array.isArray(program.universities) ? program.universities[0] : program.universities)
        : null;
      
      const referredByPartner = studentUser?.referred_by_partner_id
        ? partnerMap.get(studentUser.referred_by_partner_id) || null
        : null;
      
      return {
        id: app.id,
        status: app.status,
        priority: app.priority,
        notes: app.notes,
        submitted_at: app.submitted_at,
        created_at: app.created_at,
        updated_at: app.updated_at,
        partner_id: app.partner_id,
        program: program ? {
          id: program.id,
          name: program.name,
          degree_level: program.degree_level,
          university: university ? {
            id: university.id,
            name_en: university.name_en,
            city: university.city,
            province: university.province,
          } : null,
        } : null,
        student: {
          id: student?.id,
          user_id: student?.user_id,
          full_name: studentUser?.full_name,
          email: studentUser?.email,
          nationality: student?.nationality,
          gender: student?.gender,
          highest_education: student?.highest_education,
          source: 'partner_referred' as const,
          referred_by_partner: referredByPartner,
        },
      };
    });

    // Apply search filter in-memory
    if (search) {
      const searchLower = search.toLowerCase();
      transformedApplications = transformedApplications.filter(app => 
        app.student?.full_name?.toLowerCase().includes(searchLower) ||
        app.program?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Get stats - matching frontend expectation
    const stats = {
      total: count || 0,
      pending: 0,
      underReview: 0,
      accepted: 0,
      rejected: 0,
    };

    for (const app of (applications || [])) {
      if (app.status === 'submitted' || app.status === 'draft') {
        stats.pending++;
      } else if (app.status === 'under_review') {
        stats.underReview++;
      } else if (app.status === 'accepted') {
        stats.accepted++;
      } else if (app.status === 'rejected') {
        stats.rejected++;
      }
    }

    return NextResponse.json({
      applications: transformedApplications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Error in partner applications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
