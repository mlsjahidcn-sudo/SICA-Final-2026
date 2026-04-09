import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { sendEmail, logEmail, getApplicationSubmittedTemplate, getNewApplicationAdminTemplate, ADMIN_EMAIL } from '@/lib/email';

// GET /api/applications/[id] - Get a single application
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
        )
      `)
      .eq('id', id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check access
    const isStudent = application.student_id === user.id;
    const isPartner = application.partner_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isStudent && !isPartner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error in application GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/applications/[id] - Update an application (student only, draft status)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    // Check ownership and status
    const { data: existing, error: fetchError } = await supabase
      .from('applications')
      .select('id, student_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (existing.student_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json({ error: 'Can only edit draft applications' }, { status: 400 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      'passport_number', 'passport_first_name', 'passport_last_name',
      'nationality', 'date_of_birth', 'gender',
      'email', 'phone', 'current_address', 'permanent_address',
      'highest_degree', 'graduation_school', 'graduation_date', 'gpa',
      'chinese_level', 'chinese_test_score', 'chinese_test_date',
      'english_level', 'english_test_type', 'english_test_score', 'english_test_date',
      'study_plan', 'research_interest', 'career_goals',
      'passport_copy_url', 'diploma_url', 'transcript_url',
      'recommendation_letter_1_url', 'recommendation_letter_2_url',
      'language_certificate_url', 'study_plan_url', 'photo_url', 'medical_certificate_url',
      'other_documents',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: application, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error in application PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/applications/[id] - Submit application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Check ownership and status
    const { data: existing, error: fetchError } = await supabase
      .from('applications')
      .select('id, student_id, status, passport_number, email, highest_degree')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (existing.student_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json({ error: 'Application already submitted' }, { status: 400 });
    }

    // Validate required fields
    const requiredFields = ['passport_number', 'email', 'highest_degree'];
    const missingFields = requiredFields.filter(field => !existing[field as keyof typeof existing]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Update status and record history
    const now = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: now,
        updated_at: now,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error submitting application:', updateError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    // Record status history
    await supabase
      .from('application_status_history')
      .insert({
        application_id: id,
        old_status: 'draft',
        new_status: 'submitted',
        changed_by: user.id,
        notes: 'Application submitted by student',
      });

    // Send email notifications (async, don't block response)
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
          
          const emailData = {
            applicationId: id,
            studentName: usersData?.full_name || 'Student',
            studentEmail: usersData?.email || '',
            programName: programsData?.name_en || 'Program',
            universityName: programsData?.universities?.name_en || 'Unknown University',
          };

          // Send confirmation to student
          const studentEmail = getApplicationSubmittedTemplate(emailData);
          const studentResult = await sendEmail(studentEmail);
          
          await logEmail({
            userId: user.id,
            emailType: 'application_submitted',
            recipient: emailData.studentEmail,
            subject: studentEmail.subject,
            status: studentResult.success ? 'sent' : 'failed',
            error: studentResult.error,
          });

          // Notify admin
          const adminEmail = getNewApplicationAdminTemplate(emailData);
          const adminResult = await sendEmail(adminEmail);
          
          await logEmail({
            userId: user.id,
            emailType: 'new_application_admin',
            recipient: ADMIN_EMAIL,
            subject: adminEmail.subject,
            status: adminResult.success ? 'sent' : 'failed',
            error: adminResult.error,
          });
        }
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
      }
    })();

    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully' 
    });
  } catch (error) {
    console.error('Error in application POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/applications/[id] - Withdraw application
export async function DELETE(
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

    // Check ownership
    const { data: existing, error: fetchError } = await supabase
      .from('applications')
      .select('id, student_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Only student who owns it can withdraw, or admin
    if (existing.student_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update status to withdrawn
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('applications')
      .update({
        status: 'withdrawn',
        updated_at: now,
      })
      .eq('id', id);

    if (error) {
      console.error('Error withdrawing application:', error);
      return NextResponse.json({ error: 'Failed to withdraw application' }, { status: 500 });
    }

    // Record status history
    await supabase
      .from('application_status_history')
      .insert({
        application_id: id,
        old_status: existing.status,
        new_status: 'withdrawn',
        changed_by: user.id,
        notes: 'Application withdrawn',
      });

    return NextResponse.json({ success: true, message: 'Application withdrawn' });
  } catch (error) {
    console.error('Error in application DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
