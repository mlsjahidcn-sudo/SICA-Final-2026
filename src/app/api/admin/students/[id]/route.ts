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

    // Get student details - only select columns that exist in the actual Supabase tables
    const { data: student, error } = await supabaseAdmin
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
        students (
          id,
          first_name,
          last_name,
          nationality,
          passport_number,
          date_of_birth,
          gender,
          current_address,
          wechat_id,
          emergency_contact_name,
          emergency_contact_phone,
          highest_education,
          gpa,
          hsk_level,
          hsk_score,
          ielts_score,
          toefl_score,
          education_history,
          work_experience
        )
      `)
      .eq('id', studentId)
      .eq('role', 'student')
      .single();

    if (error || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch referring partner info if student was referred
    let referredByPartner: { full_name: string; email: string; company_name?: string; id: string } | null = null;
    if (student.referred_by_partner_id) {
      const { data: partnerUser } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email')
        .eq('id', student.referred_by_partner_id)
        .single();

      if (partnerUser) {
        const { data: partnerRecord } = await supabaseAdmin
          .from('partners')
          .select('company_name')
          .eq('user_id', student.referred_by_partner_id)
          .maybeSingle();

        referredByPartner = {
          id: partnerUser.id,
          full_name: partnerUser.full_name,
          email: partnerUser.email,
          company_name: partnerRecord?.company_name,
        };
      }
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
        source: student.referred_by_partner_id ? 'partner_referred' as const : 'individual' as const,
        referred_by_partner: referredByPartner,
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
