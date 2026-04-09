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

    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        programs (
          id,
          name_en,
          name_cn,
          degree_type,
          discipline,
          duration_months,
          tuition_per_year,
          tuition_currency,
          scholarship_available,
          universities (
            id,
            name_en,
            name_cn,
            city,
            province
          )
        ),
        users!applications_student_id_fkey (
          id,
          full_name,
          email
        ),
        partner:users!applications_partner_id_fkey (
          id,
          full_name,
          email
        ),
        reviewer:users!applications_reviewed_by_fkey (
          id,
          full_name
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

    // Get status history
    const { data: history } = await supabase
      .from('application_status_history')
      .select(`
        id,
        old_status,
        new_status,
        notes,
        changed_at,
        users (
          id,
          full_name
        )
      `)
      .eq('application_id', id)
      .order('changed_at', { ascending: false });

    return NextResponse.json({ 
      application: {
        ...application,
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

    // Update application
    const updateData: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
    };

    if (review_notes) updateData.review_notes = review_notes;
    if (rejection_reason) updateData.rejection_reason = rejection_reason;
    if (status === 'accepted') updateData.offer_sent_at = now;

    const { error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // Record status history
    await supabase
      .from('application_status_history')
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
            users!applications_student_id_fkey (full_name, email),
            programs (name_en, universities (name_en))
          `)
          .eq('id', id)
          .single();

        if (fullApp) {
          // Handle Supabase response - nested relationships may be arrays
          const usersData = fullApp.users as unknown as { full_name: string; email: string };
          const programsData = fullApp.programs as unknown as { name_en: string; universities: { name_en: string } };
          
          const studentEmail = usersData?.email || '';
          const studentName = usersData?.full_name || 'Student';
          
          const emailPayload = getApplicationStatusUpdateTemplate({
            applicationId: id,
            studentName,
            studentEmail,
            programName: programsData?.name_en || 'Program',
            universityName: programsData?.universities?.name_en || 'Unknown University',
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
