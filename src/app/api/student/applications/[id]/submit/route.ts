import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// POST /api/student/applications/[id]/submit - Submit application
export async function POST(
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

    // Get application with documents
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        personal_statement,
        study_plan,
        intake,
        application_documents (
          id,
          status
        )
      `)
      .eq('id', id)
      .eq('student_id', studentRecord.id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Validate application can be submitted
    if (application.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft applications can be submitted' },
        { status: 400 }
      );
    }

    // Check required fields (only fields that exist in the database)
    const missingFields: string[] = [];
    if (!application.personal_statement) missingFields.push('personal_statement');
    if (!application.study_plan) missingFields.push('study_plan');
    if (!application.intake) missingFields.push('intake');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields', missingFields },
        { status: 400 }
      );
    }

    // Check if all required documents are uploaded and verified
    const pendingDocs = application.application_documents?.filter(
      (doc: { status: string }) => doc.status === 'pending' || doc.status === 'rejected'
    );

    if (pendingDocs && pendingDocs.length > 0) {
      return NextResponse.json(
        { error: 'Please ensure all documents are uploaded and verified before submitting' },
        { status: 400 }
      );
    }

    // Update application status
    const { data: updatedApp, error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        id,
        status,
        submitted_at,
        intake,
        programs (
          id,
          name_en,
          universities (
            name_en
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Error submitting application:', updateError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    // Create status history entry
    await supabase
      .from('application_status_history')
      .insert({
        application_id: id,
        status: 'submitted',
        notes: 'Application submitted by student',
        changed_by: user.id,
      });

    // Create notification for the student
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'application',
        title: 'Application Submitted',
        content: `Your application has been submitted successfully.`,
        link: `/student-v2/applications/${id}`,
      });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application: updatedApp,
    });

  } catch (error) {
    console.error('Error in application submit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
