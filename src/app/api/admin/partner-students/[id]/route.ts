import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * PATCH /api/admin/partner-students/[id]
 * Admin updates a partner-referred student's profile.
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

    // Verify student exists
    const { data: existingStudent, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', studentId)
      .single();

    if (fetchError || !existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (existingStudent.role !== 'student') {
      return NextResponse.json({ error: 'This user is not a student' }, { status: 400 });
    }

    // Build update object with only provided fields
    const userUpdate: Record<string, unknown> = {};
    const studentUpdate: Record<string, unknown> = {};

    if (body.full_name !== undefined) userUpdate.full_name = body.full_name;
    if (body.phone !== undefined) userUpdate.phone = body.phone;
    if (body.email !== undefined) userUpdate.email = body.email;
    if (body.nationality !== undefined) userUpdate.nationality = body.nationality;
    if (body.gender !== undefined) userUpdate.gender = body.gender;
    if (body.country !== undefined) userUpdate.country = body.country;
    if (body.city !== undefined) userUpdate.city = body.city;
    if (body.current_address !== undefined) userUpdate.current_address = body.current_address;
    if (body.wechat_id !== undefined) userUpdate.wechat_id = body.wechat_id;
    if (body.passport_number !== undefined) userUpdate.passport_number = body.passport_number;
    if (body.date_of_birth !== undefined) userUpdate.date_of_birth = body.date_of_birth;
    if (body.highest_education !== undefined) userUpdate.highest_education = body.highest_education;
    if (body.institution_name !== undefined) userUpdate.institution_name = body.institution_name;

    if (body.is_active !== undefined) userUpdate.is_active = body.is_active;

    // Update users table record
    if (Object.keys(userUpdate).length > 0) {
      userUpdate.updated_at = new Date().toISOString();
      const { error: updateUserError } = await supabaseAdmin
        .from('users')
        .update(userUpdate)
        .eq('id', studentId);

      if (updateUserError) {
        console.error('Error updating student:', updateUserError);
        return NextResponse.json(
          { error: 'Failed to update student', details: { message: updateUserError.message } },
          { status: 500 }
        );
      }
    }

    // Update students table record for profile fields
    if (body.nationality !== undefined || body.gender !== undefined ||
        body.highest_education !== undefined || body.institution_name !== undefined) {
      if (body.nationality !== undefined) studentUpdate.nationality = body.nationality;
      if (body.gender !== undefined) studentUpdate.gender = body.gender;
      if (body.date_of_birth !== undefined) studentUpdate.date_of_birth = body.date_of_birth;
      if (body.current_address !== undefined) studentUpdate.current_address = body.current_address;
      if (body.wechat_id !== undefined) studentUpdate.wechat_id = body.wechat_id;
      if (body.passport_number !== undefined) studentUpdate.passport_number = body.passport_number;
      if (body.highest_education !== undefined) studentUpdate.highest_education = body.highest_education;
      if (body.institution_name !== undefined) studentUpdate.institution_name = body.institution_name;

      const { data: studentRecord } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', studentId)
        .maybeSingle();

      if (studentRecord) {
        const { error: updateStudentError } = await supabaseAdmin
          .from('students')
          .update(studentUpdate)
          .eq('id', studentRecord.id);

        if (updateStudentError) {
          console.log('Note: Could not update students table:', updateStudentError.message);
          // Non-critical - main user record was updated
        }
      } else {
        // Create students record if it doesn't exist
        const nameParts = (body.full_name || '').split(' ');
        const { error: studentInsertError } = await supabaseAdmin.from('students').insert({
          user_id: studentId,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          nationality: body.nationality || null,
          gender: body.gender || null,
          highest_education: body.highest_education || null,
          institution_name: body.institution_name || null,
        });
        if (studentInsertError) {
          console.log('Note: Could not create students record:', studentInsertError.message);
        }
      }
    }

    console.log(`Student ${studentId} updated by admin ${adminUser.id}`);

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      student_id: studentId,
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
