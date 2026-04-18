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
            phone,
            referred_by_partner_id
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
            province,
            logo_url
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
        changed_by,
        created_at
      `)
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    // Fetch changed_by user info for status history
    const historyWithUsers = await Promise.all(
      (history || []).map(async (h) => {
        let changedByName: string | null = null;
        if (h.changed_by) {
          const { data: changer } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', h.changed_by)
            .maybeSingle();
          changedByName = changer?.full_name || null;
        }
        return { ...h, changed_by_name: changedByName };
      })
    );

    // Fetch documents for this application
    const { data: documents } = await supabase
      .from('documents')
      .select(`
        id,
        type as document_type,
        file_key,
        file_name,
        file_size,
        mime_type as content_type,
        status,
        rejection_reason,
        uploaded_at,
        created_at
      `)
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    // Fetch meetings for this application
    const { data: meetings } = await supabase
      .from('meetings')
      .select(`
        id,
        title,
        meeting_date,
        duration_minutes,
        platform,
        meeting_link,
        meeting_id,
        password,
        status,
        notes,
        created_at
      `)
      .eq('application_id', id)
      .order('meeting_date', { ascending: true });

    // Extract profile_snapshot fields
    const snapshot = application.profile_snapshot || {};
    const personal_statement = snapshot.personal_statement || null;
    const study_plan = snapshot.study_plan || null;
    const intake = snapshot.intake || null;

    // Determine student_source and partner_info from users.referred_by_partner_id
    const studentUser = application.students?.users
      ? (Array.isArray(application.students.users) ? application.students.users[0] : application.students.users)
      : null;
    const referredByPartnerId = studentUser?.referred_by_partner_id || null;
    const student_source = referredByPartnerId ? 'partner_referred' : 'individual';

    // partnerInfo already fetched above for applications with partner_id
    // For student_source, we need partner info from the referred_by_partner_id (which may differ from application.partner_id)
    let studentPartnerInfo: typeof partnerInfo = null;
    if (referredByPartnerId && referredByPartnerId !== application.partner_id) {
      // Fetch partner info for the student if different from application partner
      const { data: studentPartnerRecord } = await supabase
        .from('partners')
        .select('id, user_id, company_name')
        .eq('user_id', referredByPartnerId)
        .maybeSingle();

      if (studentPartnerRecord) {
        const { data: studentPartnerUser } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', referredByPartnerId)
          .maybeSingle();

        if (studentPartnerUser) {
          studentPartnerInfo = {
            id: studentPartnerUser.id,
            full_name: studentPartnerUser.full_name,
            email: studentPartnerUser.email,
            company_name: studentPartnerRecord.company_name,
          };
        }
      }
    }

    return NextResponse.json({
      application: {
        ...application,
        personal_statement,
        study_plan,
        intake,
        student_source,
        partner: partnerInfo,
        student_partner: studentPartnerInfo,
        reviewer: reviewerInfo,
        status_history: historyWithUsers || [],
        documents: documents || [],
        meetings: meetings || []
      }
    });
  } catch (error) {
    console.error('Error in admin application GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/applications/[id] - Update application (status review or content edit)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update applications' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    // Check if this is a status update (review) or content update (edit)
    const { 
      status, 
      review_notes, 
      rejection_reason,
      // Content update fields
      program_id,
      priority,
      notes,
      profile_snapshot
    } = body;

    // Status update mode (review)
    if (status) {
      const validStatuses = [
        'under_review', 'document_request', 'interview_scheduled',
        'accepted', 'rejected', 'draft', 'submitted'
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

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

      // Set submitted_at when status changes to 'submitted'
      if (status === 'submitted' && existing.status !== 'submitted') {
        updateData.submitted_at = now;
      }

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
    }

    // Content update mode (edit)
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      updated_at: now,
    };

    if (program_id !== undefined) updateData.program_id = program_id;
    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (profile_snapshot !== undefined) updateData.profile_snapshot = profile_snapshot;

    const { data: updatedApp, error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        status,
        priority,
        notes,
        profile_snapshot,
        students (
          id,
          users (
            id,
            full_name,
            email
          )
        ),
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

    if (updateError) {
      console.error('Error updating application content:', updateError);
      return NextResponse.json({ error: 'Failed to update application', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      application: updatedApp 
    });
  } catch (error) {
    console.error('Error in admin application PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
