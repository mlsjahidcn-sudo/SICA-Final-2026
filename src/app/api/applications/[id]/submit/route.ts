import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth } from '@/lib/partner/roles';

/**
 * POST /api/applications/[id]/submit
 * 
 * Submit a draft application for review.
 * Changes application status from 'draft' to 'submitted'.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const partnerAuth = await verifyPartnerAuth(request);
    if ('error' in partnerAuth) {
      return partnerAuth.error;
    }

    const { user: partnerUser } = partnerAuth;
    const { id: applicationId } = await params;
    const supabase = getSupabaseClient();

    // Fetch the application to verify ownership and status
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('id, student_id, status, program_id')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if application is in draft status
    if (application.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft applications can be submitted' },
        { status: 400 }
      );
    }

    // Verify partner has access to this student
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    
    // Get student's user_id
    const { data: student } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', application.student_id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get student user record
    const { data: studentUser } = await supabase
      .from('users')
      .select('id, referred_by_partner_id')
      .eq('id', student.user_id)
      .single();

    if (!studentUser) {
      return NextResponse.json(
        { error: 'Student user not found' },
        { status: 404 }
      );
    }

    // Verify access
    if (!isAdmin) {
      // Member can only submit applications for students they personally referred
      if (studentUser.referred_by_partner_id !== partnerUser.id) {
        return NextResponse.json(
          { error: 'You do not have access to this application' },
          { status: 403 }
        );
      }
    } else {
      // Admin can submit for team's students
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
        .eq('role', 'partner');
      
      const teamUserIds = [partnerUser.id, ...(teamMembers || []).map(m => m.id)];
      
      if (!teamUserIds.includes(studentUser.referred_by_partner_id)) {
        return NextResponse.json(
          { error: 'You do not have access to this application' },
          { status: 403 }
        );
      }
    }

    // Update application status to submitted
    const now = new Date().toISOString();
    const { data: updatedApp, error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: now,
        updated_at: now,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error submitting application:', updateError);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Application submitted successfully',
      application: updatedApp,
    });
  } catch (error) {
    console.error('Error in submit application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
