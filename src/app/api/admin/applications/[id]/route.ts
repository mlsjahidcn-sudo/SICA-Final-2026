import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { sendEmail, logEmail, getApplicationStatusUpdateTemplate } from '@/lib/email';

// GET /api/admin/applications/[id] - Get application details for review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || !['admin', 'partner'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Query with correct schema - no FK hints since no FK constraints exist
    // applications has: student_id (-> students.id), program_id (-> programs.id), partner_id (-> partners.id)
    // Use students join then students->users for student info
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        id,
        student_id,
        program_id,
        partner_id,
        status,
        priority,
        notes,
        profile_snapshot,
        submitted_at,
        reviewed_at,
        reviewed_by,
        created_at,
        updated_at,
        students (
          id,
          user_id,
          first_name,
          last_name,
          nationality,
          gender,
          highest_education,
          current_address,
          wechat_id,
          users (
            id,
            full_name,
            email,
            phone
          )
        ),
        programs (
          id,
          name,
          degree_level,
          language,
          tuition_fee_per_year,
          currency,
          duration_years,
          scholarship_types,
          universities (
            id,
            name_en,
            name_cn,
            city,
            province
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Partners can only see their own students' applications
    if (user.role === 'partner' && application.partner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch partner info separately if exists
    let partnerInfo: { id: string; full_name: string; email: string; company_name?: string } | null = null;
    if (application.partner_id) {
      // partner_id references partners.id, get the partner user info
      const { data: partnerRecord } = await supabase
        .from('partners')
        .select('id, user_id, company_name')
        .eq('id', application.partner_id)
        .maybeSingle();
      
      if (partnerRecord?.user_id) {
        const { data: partnerUser } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', partnerRecord.user_id)
          .maybeSingle();
        
        if (partnerUser) {
          partnerInfo = {
            id: partnerUser.id,
            full_name: partnerUser.full_name,
            email: partnerUser.email,
            company_name: partnerRecord.company_name,
          };
        }
      }
    }

    // Fetch reviewer info separately
    let reviewerInfo: { id: string; full_name: string } | null = null;
    if (application.reviewed_by) {
      const { data: reviewerUser } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', application.reviewed_by)
        .maybeSingle();
      
      if (reviewerUser) {
        reviewerInfo = { id: reviewerUser.id, full_name: reviewerUser.full_name };
      }
    }

    // Get status history from assessment_status_history
    // (application_status_history doesn't exist; assessment_status_history is the closest)
    const { data: history } = await supabase
      .from('assessment_status_history')
      .select(`
        id,
        old_status,
        new_status,
        notes,
        created_at
      `)
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ 
      application: {
        ...application,
        partner: partnerInfo,
        reviewer: reviewerInfo,
        status_history: history || []
      }
    });
  } catch (error) {
    console.error('Error in admin application GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/applications/[id] - Update application status (review)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update application status' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, review_notes, rejection_reason } = body;

    const validStatuses = [
      'under_review', 'document_request', 'interview_scheduled',
      'accepted', 'rejected'
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Get current application
    const { data: existing, error: fetchError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Update application - only use columns that exist
    const updateData: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
    };

    if (review_notes) updateData.notes = review_notes;
    if (rejection_reason) updateData.notes = rejection_reason;

    const { error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // Record status history in assessment_status_history
    // (application_status_history doesn't exist)
    await supabase
      .from('assessment_status_history')
      .insert({
        application_id: id,
        old_status: existing.status,
        new_status: status,
        notes: review_notes || rejection_reason || `Status changed to ${status}`,
        changed_by: user.id,
      });

    // Send email notification to student (async, don't block response)
    (async () => {
      try {
        // Get full application details for email
        const { data: fullApp } = await supabase
          .from('applications')
          .select(`
            id,
            students (
              users (
                full_name,
                email
              )
            ),
            programs (
              name,
              universities (
                name_en
              )
            )
          `)
          .eq('id', id)
          .single();

        if (fullApp) {
          const student = Array.isArray(fullApp.students) ? fullApp.students[0] : fullApp.students;
          const studentUser = student?.users
            ? (Array.isArray(student.users) ? student.users[0] : student.users)
            : null;
          const program = Array.isArray(fullApp.programs) ? fullApp.programs[0] : fullApp.programs;
          const university = program?.universities
            ? (Array.isArray(program.universities) ? program.universities[0] : program.universities)
            : null;
          
          const studentEmail = studentUser?.email || '';
          const studentName = studentUser?.full_name || 'Student';
          
          const emailPayload = getApplicationStatusUpdateTemplate({
            applicationId: id,
            studentName,
            studentEmail,
            programName: program?.name || 'Program',
            universityName: university?.name_en || 'Unknown University',
            status,
            rejectionReason: rejection_reason,
          });

          const result = await sendEmail(emailPayload);
          
          await logEmail({
            userId: user.id,
            emailType: 'application_status_update',
            recipient: studentEmail,
            subject: emailPayload.subject,
            status: result.success ? 'sent' : 'failed',
            error: result.error,
          });
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    })();

    return NextResponse.json({ 
      success: true, 
      message: `Application ${status}` 
    });
  } catch (error) {
    console.error('Error in admin application PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
