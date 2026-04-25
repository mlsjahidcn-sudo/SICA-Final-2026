import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * PATCH /api/admin/partner-students/[id]/toggle-status
 * Admin toggles a student's active/inactive status.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const { id: studentId } = await params;
    const supabaseAdmin = getSupabaseClient();
    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean (true or false)' },
        { status: 400 }
      );
    }

    // Verify student exists
    const { data: student, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, is_active')
      .eq('id', studentId)
      .eq('role', 'student')
      .single();

    if (fetchError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Update the student's active status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId);

    if (updateError) {
      console.error('Error updating student status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update student status', details: { message: updateError.message } },
        { status: 500 }
      );
    }

    console.log(`Student ${studentId} status changed to ${is_active} by admin ${adminUser.id}`);

    return NextResponse.json({
      success: true,
      message: `Student ${is_active ? 'activated' : 'deactivated'} successfully`,
      student_id: studentId,
      new_status: is_active ? 'active' : 'inactive',
    });
  } catch (error) {
    console.error('Error in toggle student status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
