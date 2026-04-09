import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/applications/check-duplicate - Check if user already applied to a program
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');
    const universityId = searchParams.get('university_id');
    const intake = searchParams.get('intake');

    if (!programId) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Get student record
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!studentRecord) {
      return NextResponse.json({ 
        hasExisting: false,
        applications: [],
      });
    }

    // Check for existing applications to the same program
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        intake,
        created_at,
        programs (
          id,
          name_en,
          universities (
            name_en
          )
        )
      `)
      .eq('student_id', studentRecord.id)
      .eq('program_id', programId);

    // Also check by intake if provided
    if (intake) {
      query = query.eq('intake', intake);
    }

    const { data: existingApplications, error } = await query;

    if (error) {
      console.error('Error checking duplicates:', error);
      return NextResponse.json({ error: 'Failed to check for duplicates' }, { status: 500 });
    }

    // Filter out withdrawn applications (allow re-application)
    const activeApplications = (existingApplications || []).filter(
      app => app.status !== 'withdrawn'
    );

    // Check for applications to same university (warning, not blocking)
    let universityApplications: typeof activeApplications = [];
    if (universityId && programId) {
      const { data: uniApps } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          intake,
          created_at,
          programs (
            id,
            name_en,
            universities (
              id,
              name_en
            )
          )
        `)
        .eq('student_id', studentRecord.id)
        .eq('university_id', universityId)
        .neq('program_id', programId); // Exclude the same program

      universityApplications = (uniApps || []).filter(
        app => app.status !== 'withdrawn'
      );
    }

    return NextResponse.json({
      hasExisting: activeApplications.length > 0,
      sameProgramApplications: activeApplications,
      sameUniversityApplications: universityApplications,
      totalActive: activeApplications.length + universityApplications.length,
    });

  } catch (error) {
    console.error('Error in duplicate check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
