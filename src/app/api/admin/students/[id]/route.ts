import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseAdmin = getSupabaseClient();
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get student details
    const { data: student, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        nationality,
        created_at,
        last_sign_in_at,
        students!students_user_id_users_id_fk (
          id,
          passport_first_name,
          passport_last_name,
          passport_number,
          date_of_birth,
          gender,
          city,
          province,
          address,
          emergency_contact_name,
          emergency_contact_phone,
          education_level,
          gpa,
          language_proficiency
        )
      `)
      .eq('id', studentId)
      .eq('role', 'student')
      .single();

    if (error || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get student's applications
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        submitted_at,
        programs (
          id,
          name_en,
          degree_type,
          universities (
            id,
            name_en,
            city
          )
        )
      `)
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });

    // Get student's documents
    const { data: documents } = await supabaseAdmin
      .from('application_documents')
      .select(`
        id,
        document_type,
        file_url,
        uploaded_at,
        verified,
        application_id
      `)
      .eq('application_id', applications?.[0]?.id || '');

    // Get student's meetings
    const { data: meetings } = await supabaseAdmin
      .from('meetings')
      .select(`
        id,
        title,
        scheduled_at,
        status,
        meeting_url
      `)
      .eq('student_id', studentId)
      .order('scheduled_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      student: {
        ...student,
        applications: applications || [],
        documents: documents || [],
        meetings: meetings || [],
      },
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseAdmin = getSupabaseClient();
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { full_name, phone, nationality, is_active } = body;

    // Update user
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        full_name,
        phone,
        nationality,
        ...(typeof is_active !== 'undefined' && { is_active }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating student:', error);
      return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
    }

    return NextResponse.json({ student: data });
  } catch (error) {
    console.error('Error in PUT student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
