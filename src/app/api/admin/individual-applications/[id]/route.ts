import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * GET /api/admin/individual-applications/[id]
 * Fetch a single individual application by ID using step-by-step queries
 * (avoids complex PostgREST joins that can fail silently)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const { id: appId } = await params;
    const supabaseAdmin = getSupabaseClient();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appId)) {
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
    }

    // Step 1: Fetch the application
    const { data: app, error: appError } = await supabaseAdmin
      .from('applications')
      .select('id, status, priority, notes, submitted_at, created_at, updated_at, partner_id, student_id, program_id, profile_snapshot, reviewed_at, reviewed_by, created_by, updated_by')
      .eq('id', appId)
      .single();

    if (appError || !app) {
      console.error('Individual application not found:', appError?.message);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Ensure this is an individual application
    if (app.partner_id) {
      return NextResponse.json({ error: 'This endpoint is for individual applications only' }, { status: 403 });
    }

    // Step 2: Fetch student data separately
    let studentData: Record<string, unknown> | null = null;
    if (app.student_id) {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id, user_id, first_name, last_name, nationality, gender, passport_number, date_of_birth, current_address, wechat_id, highest_education, institution_name')
        .eq('id', app.student_id)
        .single();

      if (student) {
        // Step 3: Fetch user data separately
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, full_name, email, phone, country, city, referred_by_partner_id')
          .eq('id', student.user_id)
          .single();

        studentData = {
          id: student.id,
          user_id: student.user_id,
          full_name: user?.full_name || null,
          email: user?.email || null,
          phone: user?.phone || null,
          country: user?.country || null,
          city: user?.city || null,
          nationality: student.nationality || null,
          gender: student.gender || null,
          passport_number: student.passport_number || null,
          date_of_birth: student.date_of_birth || null,
          current_address: student.current_address || null,
          wechat_id: student.wechat_id || null,
          highest_education: student.highest_education || null,
          institution_name: student.institution_name || null,
          source: 'individual' as const,
        };
      }
    }

    // Step 4: Fetch program data separately
    let programData: Record<string, unknown> | null = null;
    if (app.program_id) {
      const { data: program } = await supabaseAdmin
        .from('programs')
        .select('id, name, name_fr, degree_level, tuition_fee_per_year, currency, duration_years, university_id, start_month, language')
        .eq('id', app.program_id)
        .single();

      if (program) {
        // Step 5: Fetch university data separately
        let universityData: Record<string, unknown> | null = null;
        if (program.university_id) {
          const { data: university } = await supabaseAdmin
            .from('universities')
            .select('id, name_en, name_cn, city, province, logo_url')
            .eq('id', program.university_id)
            .single();

          if (university) {
            universityData = {
              id: university.id,
              name_en: university.name_en,
              name_cn: university.name_cn,
              city: university.city,
              province: university.province,
              logo_url: university.logo_url,
            };
          }
        }

        programData = {
          id: program.id,
          name: program.name,
          name_fr: program.name_fr,
          degree_level: program.degree_level,
          tuition_fee_per_year: program.tuition_fee_per_year,
          currency: program.currency,
          duration_years: program.duration_years,
          start_month: program.start_month,
          language: program.language,
          university: universityData,
        };
      }
    }

    const snapshot = app.profile_snapshot as Record<string, unknown> | null;

    return NextResponse.json({
      id: app.id,
      status: app.status,
      priority: app.priority,
      notes: app.notes,
      personal_statement: (snapshot?.personal_statement as string) || null,
      study_plan: (snapshot?.study_plan as string) || null,
      intake: (snapshot?.intake as string) || null,
      submitted_at: app.submitted_at,
      created_at: app.created_at,
      updated_at: app.updated_at,
      partner_id: app.partner_id,
      program: programData,
      student: studentData,
    });
  } catch (error) {
    console.error('Error fetching individual application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/individual-applications/[id]
 * Update an individual student application (personal_statement, study_plan, intake, notes)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const { id: appId } = await params;
    const supabaseAdmin = getSupabaseClient();
    const body = await request.json();
    const { personal_statement, study_plan, intake, notes } = body || {};

    // Fetch the current application
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, status, partner_id, profile_snapshot')
      .eq('id', appId)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Ensure this is an individual application (no partner)
    if (app.partner_id) {
      return NextResponse.json(
        { error: 'This endpoint is for individual applications only' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // personal_statement, study_plan, intake are stored in profile_snapshot (JSONB)
    const snapshot = (app.profile_snapshot as Record<string, unknown>) || {};
    if (personal_statement !== undefined) snapshot.personal_statement = personal_statement;
    if (study_plan !== undefined) snapshot.study_plan = study_plan;
    if (intake !== undefined) snapshot.intake = intake;
    updateData.profile_snapshot = snapshot;
    if (notes !== undefined) updateData.notes = notes;

    // Update the application
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update(updateData)
      .eq('id', appId);

    if (updateError) {
      console.error('Error updating individual application:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application', details: { message: updateError.message } },
        { status: 500 }
      );
    }

    console.log(`Individual application ${appId} updated by admin ${adminUser.id}`);

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully',
      application_id: appId,
    });
  } catch (error) {
    console.error('Error in update individual application API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}