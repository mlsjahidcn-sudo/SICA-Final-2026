import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/applications/[id] - Get application details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Get student record for the user
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!studentRecord) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        submitted_at,
        profile_snapshot,
        notes,
        programs (
          id,
          name,
          degree_level,
          category,
          language,
          duration_years,
          tuition_fee_per_year,
          currency,
          scholarship_coverage,
          scholarship_types,
          application_end_date,
          universities (
            id,
            name_en,
            city,
            province,
            logo_url,
            website_url
          )
        ),
        application_documents (
          id,
          document_type,
          status,
          file_key,
          file_name,
          rejection_reason,
          created_at
        )
      `)
      .eq('id', id)
      .eq('student_id', studentRecord.id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get timeline from application_status_history
    const { data: timeline } = await supabase
      .from('application_status_history')
      .select('status, created_at, notes')
      .eq('application_id', id)
      .order('created_at', { ascending: true });

    // Extract personal_statement, study_plan, intake from profile_snapshot for frontend convenience
    const snapshot = (application.profile_snapshot || {}) as Record<string, unknown>;

    return NextResponse.json({ 
      application: {
        ...application,
        personal_statement: snapshot.personal_statement || '',
        study_plan: snapshot.study_plan || '',
        intake: snapshot.intake || '',
        timeline: timeline || []
      }
    });

  } catch (error) {
    console.error('Error in application GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/student/applications/[id] - Update application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    // Get student record for the user
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!studentRecord) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Check if application exists and belongs to user
    const { data: existing } = await supabase
      .from('applications')
      .select('id, status')
      .eq('id', id)
      .eq('student_id', studentRecord.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Only allow updates for draft applications
    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only edit draft applications' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Handle profile_snapshot fields (personal_statement, study_plan, intake)
    // These should be merged into profile_snapshot JSONB column
    const profileSnapshotFields = ['personal_statement', 'study_plan', 'intake'];
    const snapshotUpdates: Record<string, unknown> = {};

    for (const field of profileSnapshotFields) {
      if (body[field] !== undefined) {
        snapshotUpdates[field] = body[field];
      }
    }

    // If there are snapshot updates, merge them into existing profile_snapshot
    if (Object.keys(snapshotUpdates).length > 0) {
      // Get current profile_snapshot
      const { data: currentApp } = await supabase
        .from('applications')
        .select('profile_snapshot')
        .eq('id', id)
        .single();

      const currentSnapshot = (currentApp?.profile_snapshot || {}) as Record<string, unknown>;
      updateData.profile_snapshot = { ...currentSnapshot, ...snapshotUpdates };
    }

    // Handle program_id update (direct column)
    if (body.program_id !== undefined) {
      updateData.program_id = body.program_id;
    }

    const { data: application, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        status,
        updated_at,
        profile_snapshot,
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name_en,
            city,
            province,
            logo_url
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // Extract snapshot fields for frontend convenience
    const snapshot = (application?.profile_snapshot || {}) as Record<string, unknown>;

    return NextResponse.json({ 
      application: {
        ...application,
        intake: snapshot.intake || null,
        personal_statement: snapshot.personal_statement || null,
        study_plan: snapshot.study_plan || null,
      }
    });

  } catch (error) {
    console.error('Error in application PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/student/applications/[id] - Delete application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Get student record for the user
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!studentRecord) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Check if application exists and belongs to user
    const { data: existing } = await supabase
      .from('applications')
      .select('id, status')
      .eq('id', id)
      .eq('student_id', studentRecord.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Only allow deletion for draft applications
    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft applications' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting application:', error);
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Application deleted' });

  } catch (error) {
    console.error('Error in application DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
