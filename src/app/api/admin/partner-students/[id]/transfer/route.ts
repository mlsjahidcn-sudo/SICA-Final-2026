import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * POST /api/admin/partner-students/[id]/transfer
 * Transfer a student from one partner to another
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabaseAdmin = getSupabaseClient();
    const body = await request.json();
    
    const {
      new_partner_id,
      reason,
      notify_student = true,
      notify_old_partner = true,
      transfer_applications = true,
    } = body;

    // Verify student exists and is partner-referred
    const { data: student, error: studentError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, referred_by_partner_id')
      .eq('id', studentId)
      .eq('role', 'student')
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student.referred_by_partner_id) {
      return NextResponse.json(
        { error: 'Cannot transfer individual student. This student is not partner-referred.' },
        { status: 400 }
      );
    }

    const oldPartnerId = student.referred_by_partner_id;

    // Verify new partner exists
    const { data: newPartner, error: partnerError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', new_partner_id)
      .eq('role', 'partner')
      .single();

    if (partnerError || !newPartner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Update student's referred_by_partner_id
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        referred_by_partner_id: new_partner_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId);

    if (updateError) {
      console.error('Error transferring student:', updateError);
      return NextResponse.json({ error: 'Failed to transfer student' }, { status: 500 });
    }

    // Transfer applications if requested
    let applicationsUpdated = 0;
    if (transfer_applications) {
      const { data: apps, error: appsUpdateError } = await supabaseAdmin
        .from('applications')
        .update({ partner_id: new_partner_id })
        .eq('user_id', studentId)
        .eq('partner_id', oldPartnerId)
        .select('id');

      if (!appsUpdateError && apps) {
        applicationsUpdated = apps.length;
      }
    }

    // TODO: Send notifications if requested
    // if (notify_student) { ... }
    // if (notify_old_partner) { ... }

    // Log the transfer (you might want to create an audit log table)
    console.log(`Student ${studentId} transferred from ${oldPartnerId} to ${new_partner_id}. Reason: ${reason}`);

    return NextResponse.json({
      success: true,
      message: 'Student transferred successfully',
      student_id: studentId,
      old_partner_id: oldPartnerId,
      new_partner_id,
      applications_updated: applicationsUpdated,
    });
  } catch (error) {
    console.error('Error in student transfer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
