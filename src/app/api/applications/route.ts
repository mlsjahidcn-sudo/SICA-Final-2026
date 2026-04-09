import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

interface User {
  id: string;
  email: string;
  role: string;
  partner_id?: string;
}

// Helper to get partner ID for the current user (either partner themselves or team member)
function getPartnerIdForUser(user: User | null): string | null {
  // If user is a partner, use their own ID
  if (user?.role === 'partner') {
    return user.id;
  }
  // If user has partner_id (team member), use that
  if (user?.partner_id) {
    return user.partner_id;
  }
  return null;
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    
    const offset = (page - 1) * limit;

    // Build query based on role
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        reviewed_at,
        created_at,
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name_en,
            name_cn,
            city,
            province
          )
        ),
        students (
          id,
          user_id,
          first_name,
          last_name,
          email,
          users (
            id,
            full_name,
            email
          )
        )
      `, { count: 'exact' });

    // Students can only see their own applications
    if (user.role === 'student') {
      // First, get the student's student record id
      const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (studentRec) {
        query = query.eq('student_id', studentRec.id);
      }
    }
    // Partners (and team members) can see applications of students they referred
    else if (user.role === 'partner' || user.partner_id) {
      const partnerId = getPartnerIdForUser(user);
      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }
    }
    // Admins can see all applications
    // No filter needed for admin

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({
      applications,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
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
    const partnerId = getPartnerIdForUser(user);
    if (!user || !['student', 'partner', 'admin'].includes(user.role) && !partnerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      student_id, // Required for partners/admins (students.id, not users.id)
      user_id, // Alternative: if partner provides users.id, look up students.id
      program_id,
    } = body;

    // Validate required fields
    if (!program_id) {
      return NextResponse.json(
        { error: 'Program is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    // Determine student ID (students.id, not users.id)
    let finalStudentId: string;
    if (user.role === 'student') {
      // For students, get their student record id via user_id
      const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!studentRec) {
        return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
      }
      finalStudentId = studentRec.id;
    } else {
      // Partner or admin: use student_id if provided, else look up via user_id
      if (student_id) {
        finalStudentId = student_id;
      } else if (user_id) {
        const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user_id).single();
        if (!studentRec) {
          return NextResponse.json({ error: 'Student record not found for this user' }, { status: 404 });
        }
        finalStudentId = studentRec.id;
      } else {
        return NextResponse.json({ error: 'Either student_id or user_id is required' }, { status: 400 });
      }
    }

    // Determine partner ID
    const finalPartnerId: string | null = partnerId;

    // Check if student already has an application for this program
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('student_id', finalStudentId)
      .eq('program_id', program_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Student has already applied for this program' },
        { status: 400 }
      );
    }

    // Store all extra form data in profile_snapshot JSONB column
    // The applications table only has: student_id, program_id, partner_id, status, priority, notes, profile_snapshot
    const profileSnapshot = {
      passport_number: body.passport_number,
      first_name: body.passport_first_name || body.first_name,
      last_name: body.passport_last_name || body.last_name,
      nationality: body.nationality,
      date_of_birth: body.date_of_birth,
      gender: body.gender,
      email: body.email,
      phone: body.phone,
      current_address: body.current_address,
      permanent_address: body.permanent_address,
      highest_degree: body.highest_degree,
      graduation_school: body.graduation_school,
      graduation_date: body.graduation_date,
      gpa: body.gpa,
      chinese_level: body.chinese_level,
      chinese_test_score: body.chinese_test_score,
      chinese_test_date: body.chinese_test_date,
      english_level: body.english_level,
      english_test_type: body.english_test_type,
      english_test_score: body.english_test_score,
      english_test_date: body.english_test_date,
      study_plan: body.study_plan,
      research_interest: body.research_interest,
      career_goals: body.career_goals,
    };

    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        student_id: finalStudentId,
        program_id,
        partner_id: finalPartnerId,
        status: 'draft',
        profile_snapshot: profileSnapshot,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Error in applications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
