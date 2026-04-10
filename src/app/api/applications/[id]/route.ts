import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// Helper to get partner ID for the current user
function getPartnerIdForUser(user: { id: string; role: string; partner_id?: string } | null): string | null {
  if (user?.role === 'partner') {
    return user.id;
  }
  if (user?.partner_id) {
    return user.partner_id;
  }
  return null;
}

// GET /api/applications/[id] - Get application details (for partners, admins, and students)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Build base query
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        submitted_at,
        intake,
        personal_statement,
        study_plan,
        notes,
        profile_snapshot,
        programs (
          id,
          name,
          name_en,
          name_cn,
          degree_level,
          category,
          language,
          duration_years,
          tuition_fee_per_year,
          currency,
          scholarship_coverage,
          application_end_date,
          universities (
            id,
            name,
            name_en,
            name_cn,
            city,
            province,
            logo_url,
            website_url
          )
        ),
        students (
          id,
          first_name,
          last_name,
          nationality,
          date_of_birth,
          gender,
          email,
          phone,
          current_address,
          permanent_address,
          highest_degree,
          graduation_school,
          graduation_date,
          gpa,
          chinese_level,
          chinese_test_score,
          chinese_test_date,
          english_level,
          english_test_type,
          english_test_score,
          english_test_date,
          passport_number
        ),
        application_documents (
          id,
          document_type,
          status,
          file_url,
          rejection_reason,
          created_at
        )
      `)
      .eq('id', id);

    // Apply role-based filters
    if (user.role === 'student') {
      // Students can only see their own applications
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!studentRecord) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }
      
      query = query.eq('student_id', studentRecord.id);
    } else if (user.role === 'partner' || user.partner_id) {
      // Partners can only see applications they referred
      const partnerId = getPartnerIdForUser(user);
      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }
    }
    // Admins can see all applications, no filter needed

    const { data: application, error } = await query.single();

    if (error || !application) {
      console.error('Error fetching application:', error);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get timeline from application_status_history
    const { data: timeline } = await supabase
      .from('application_status_history')
      .select(`
        id,
        old_status,
        new_status,
        changed_at,
        notes,
        users (
          id,
          full_name,
          email
        )
      `)
      .eq('application_id', id)
      .order('changed_at', { ascending: true });

    // Get single student from array (Supabase returns array for has-many relations)
    const student = Array.isArray(application.students) ? application.students[0] : application.students;
    const program = Array.isArray(application.programs) ? application.programs[0] : application.programs;
    
    // Merge profile_snapshot into the application for backward compatibility
    const mergedApplication = {
      ...application,
      programs: program,
      students: student,
      ...(application.profile_snapshot || {}),
      // Use students data as primary source
      passport_first_name: student?.first_name,
      passport_last_name: student?.last_name,
      first_name: student?.first_name,
      last_name: student?.last_name,
    };

    return NextResponse.json({ 
      application: mergedApplication,
      events: timeline?.map(event => {
        const eventUser = Array.isArray(event.users) ? event.users[0] : event.users;
        return {
          id: event.id,
          old_status: event.old_status,
          new_status: event.new_status,
          changed_at: event.changed_at,
          changed_by_name: eventUser?.full_name,
          notes: event.notes
        };
      }) || []
    });

  } catch (error) {
    console.error('Error in application GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
