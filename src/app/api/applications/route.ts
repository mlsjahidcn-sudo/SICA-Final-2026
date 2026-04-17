import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { verifyPartnerAuth, getPartnerAdminId } from '@/lib/partner-auth-utils';

interface User {
  id: string;
  email: string;
  role: string;
  partner_id?: string;
  partner_role?: string;
}

// GET /api/applications - List user's applications (student) or managed applications (partner/admin)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const statusParam = searchParams.get('status') || '';
    const statusesParam = searchParams.get('statuses') || '';
    const degreeTypeParam = searchParams.get('degreeType') || '';
    const degreeTypesParam = searchParams.get('degreeTypes') || '';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'submitted_desc';
    const universityId = searchParams.get('universityId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Parse comma-separated values for multi-select filters
    const statuses = statusesParam ? statusesParam.split(',').filter(Boolean) : (statusParam && statusParam !== 'all' ? [statusParam] : []);
    const degreeTypes = degreeTypesParam ? degreeTypesParam.split(',').filter(Boolean) : (degreeTypeParam && degreeTypeParam !== 'all' ? [degreeTypeParam] : []);
    
    const offset = (page - 1) * pageSize;

    // Build query
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        reviewed_at,
        created_at,
        notes,
        priority,
        profile_snapshot,
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name_en,
            name_cn,
            city,
            province,
            logo_url
          )
        ),
        students (
          id,
          user_id,
          first_name,
          last_name,
          nationality,
          email,
          users (
            id,
            full_name,
            email,
            referred_by_partner_id
          )
        )
      `, { count: 'exact' });

    // Role-based filters
    if (user.role === 'student') {
      const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
      if (studentRec) {
        query = query.eq('student_id', studentRec.id);
      } else {
        return NextResponse.json({ applications: [], total: 0, page, pageSize, hasMore: false, limit: pageSize, totalPages: 0 });
      }
    } else if (user.role === 'partner') {
      // Partner access control: member sees own students' apps, admin sees all team's
      const authResult = await verifyPartnerAuth(request);
      if ('error' in authResult) {
        return authResult.error;
      }
      const partnerUser = authResult.user;
      const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';

      // Get the list of referrer IDs this partner user can see
      let referrerIds: string[];
      if (isAdmin) {
        // Admin sees applications from students referred by themselves + all team members
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
          .eq('role', 'partner');
        
        referrerIds = (teamMembers || []).map(m => m.id);
        if (!referrerIds.includes(partnerUser.id)) referrerIds.push(partnerUser.id);
      } else {
        // Member sees only students they referred
        referrerIds = [partnerUser.id];
      }

      // Find students referred by these partner users
      const { data: referredStudents } = await supabase
        .from('users')
        .select('id')
        .in('referred_by_partner_id', referrerIds)
        .eq('role', 'student');

      const referredUserIds = (referredStudents || []).map(s => s.id);

      if (referredUserIds.length === 0) {
        return NextResponse.json({ applications: [], total: 0, page, pageSize, hasMore: false, limit: pageSize, totalPages: 0 });
      }

      // Get student record IDs for these users
      const { data: studentRecs } = await supabase
        .from('students')
        .select('id')
        .in('user_id', referredUserIds);

      const studentIds = (studentRecs || []).map(s => s.id);

      if (studentIds.length === 0) {
        return NextResponse.json({ applications: [], total: 0, page, pageSize, hasMore: false, limit: pageSize, totalPages: 0 });
      }

      query = query.in('student_id', studentIds);
    } else if (user.role === 'admin') {
      // Admin sees all applications — no filter
    }

    // Status filter (support multiple)
    if (statuses.length > 0) {
      query = query.in('status', statuses);
    }

    // Degree level filter (support multiple, normalize)
    if (degreeTypes.length > 0) {
      const normalizedDegrees = degreeTypes.map(d => d.charAt(0).toUpperCase() + d.slice(1));
      query = query.in('programs.degree_level', normalizedDegrees);
    }

    // Search filter
    // Note: Cannot filter on nested relations like programs.universities.name_en in PostgREST
    // University search is handled separately via universityId filter
    if (search) {
      query = query.or(`
        students.first_name.ilike.%${search}%,
        students.last_name.ilike.%${search}%,
        students.email.ilike.%${search}%,
        students.nationality.ilike.%${search}%,
        programs.name.ilike.%${search}%
      `);
    }

    // University filter
    if (universityId) {
      query = query.eq('programs.university_id', universityId);
    }

    // Date range filter
    if (dateFrom) {
      query = query.gte('submitted_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('submitted_at', dateTo);
    }

    // Sorting
    switch (sort) {
      case 'submitted_desc':
        query = query.order('submitted_at', { ascending: false, nullsFirst: false });
        break;
      case 'submitted_asc':
        query = query.order('submitted_at', { ascending: true, nullsFirst: false });
        break;
      case 'name_asc':
        query = query.order('students(last_name)', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('students(last_name)', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Fix relations (Supabase returns arrays for has-many)
    const normalizedApplications = applications?.map(app => ({
      ...app,
      programs: Array.isArray(app.programs) ? app.programs[0] : app.programs,
      students: Array.isArray(app.students) ? app.students[0] : app.students,
    })) || [];

    const total = count || 0;
    const hasMore = offset + pageSize < total;

    return NextResponse.json({
      applications: normalizedApplications,
      total,
      page,
      pageSize,
      hasMore,
      // Backward compatibility
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Error in applications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/applications - Create a new application (student or partner)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // For partner users, verify access and resolve partner record
    let partnerRecordId: string | null = null;
    if (user.role === 'partner') {
      const authResult = await verifyPartnerAuth(request);
      if ('error' in authResult) return authResult.error;
      const partnerUser = authResult.user;
      
      // Member can only create applications for students they referred
      // Admin can create applications for any student in their team
      const adminId = await getPartnerAdminId(partnerUser.id);
      const { data: partnerRec } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', adminId || partnerUser.id)
        .maybeSingle();
      partnerRecordId = partnerRec?.id || null;
    }

    const body = await request.json();
    const {
      student_id, // Required for partners/admins (students.id, not users.id)
      user_id, // Alternative: if partner provides users.id, look up students.id
      program_id,
      requested_university_program_note,
      selected_program_ids,
      intake,
    } = body;

    // Validate required fields
    if (!program_id && !requested_university_program_note) {
      return NextResponse.json(
        { error: 'Either program or request note is required' },
        { status: 400 }
      );
    }
    
    // Determine student ID (students.id, not users.id)
    let finalStudentId: string;
    if (user.role === 'student') {
      const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
      if (!studentRec) {
        return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
      }
      finalStudentId = studentRec.id;
    } else {
      // Partner or admin: use student_id if provided, else look up via user_id
      if (student_id) {
        finalStudentId = student_id;
      } else if (user_id) {
        const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user_id).maybeSingle();
        if (!studentRec) {
          return NextResponse.json({ error: 'Student record not found for this user' }, { status: 404 });
        }
        finalStudentId = studentRec.id;
      } else {
        return NextResponse.json({ error: 'Either student_id or user_id is required' }, { status: 400 });
      }

      // For partner members: verify they can access this student
      if (user.role === 'partner') {
        const authResult = await verifyPartnerAuth(request);
        if ('error' in authResult) return authResult.error;
        const partnerUser = authResult.user;
        const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';

        if (!isAdmin) {
          // Member can only create apps for students they referred
          // Resolve the user_id from the student record
          let studentUserIdToCheck = user_id || '';
          if (!studentUserIdToCheck && finalStudentId) {
            const { data: studentRec } = await supabase
              .from('students')
              .select('user_id')
              .eq('id', finalStudentId)
              .maybeSingle();
            studentUserIdToCheck = studentRec?.user_id || '';
          }
          
          const { data: studentUser } = await supabase
            .from('users')
            .select('referred_by_partner_id')
            .eq('id', studentUserIdToCheck)
            .maybeSingle();
          
          if (!studentUser || studentUser.referred_by_partner_id !== partnerUser.id) {
            return NextResponse.json({ error: 'You can only create applications for students you referred' }, { status: 403 });
          }
        }
      }
    }

    // Store personal_statement, study_plan, intake in profile_snapshot JSONB
    const profileSnapshot: Record<string, unknown> = {
      personal_statement: body.personal_statement || '',
      study_plan: body.study_plan || '',
      intake: intake || body.intake || null,
      requested_university_program_note,
      selected_program_ids,
    };

    // Determine which program IDs to create applications for
    const programIdsToCreate: (string | null)[] = program_id 
      ? [program_id] 
      : (selected_program_ids && selected_program_ids.length > 0)
        ? selected_program_ids
        : [null]; // Request note only, no program

    // Create one application per program
    const createdApplications = [];
    for (const pid of programIdsToCreate) {
      // Check for existing non-draft application for this student + program
      if (pid) {
        const { data: existing } = await supabase
          .from('applications')
          .select('id')
          .eq('student_id', finalStudentId)
          .eq('program_id', pid)
          .neq('status', 'draft')
          .maybeSingle();

        if (existing) {
          continue;
        }
      }

      const { data: application, error } = await supabase
        .from('applications')
        .insert({
          student_id: finalStudentId,
          program_id: pid,
          partner_id: partnerRecordId,
          status: 'draft',
          profile_snapshot: profileSnapshot,
          notes: requested_university_program_note || null,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating application for program_id:', pid, error);
        continue;
      }
      
      if (application) {
        createdApplications.push(application);
      }
    }

    if (createdApplications.length === 0) {
      return NextResponse.json({ error: 'Failed to create any applications' }, { status: 500 });
    }

    return NextResponse.json({ 
      application: createdApplications[0],
      applications: createdApplications,
      count: createdApplications.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in applications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
