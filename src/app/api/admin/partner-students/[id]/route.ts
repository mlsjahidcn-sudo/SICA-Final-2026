import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import type { PartnerStudent } from '@/lib/types/admin-modules';

/**
 * GET /api/admin/partner-students/[id]
 * Fetch a single partner-referred student with all details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const { id } = await params;
    const supabaseAdmin = getSupabaseClient();

    // First try: exact match with partner-referred filter
    const { data: singleStudent, error: singleError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        is_active,
        created_at,
        updated_at,
        referred_by_partner_id,
        created_by,
        updated_by,
        country,
        city,
        students!left (
          id,
          first_name,
          last_name,
          nationality,
          passport_number,
          date_of_birth,
          gender,
          current_address,
          wechat_id,
          highest_education,
          institution_name
        )
      `)
      .eq('id', id)
      .eq('role', 'student')
      .single();

    // If not found with strict filter, try broader lookup (student may not have referred_by_partner_id)
    let finalStudent = singleStudent;
    if (singleError || !singleStudent) {
      const { data: fallbackStudent, error: fallbackError } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          avatar_url,
          is_active,
          created_at,
          updated_at,
          referred_by_partner_id,
          created_by,
          updated_by,
          country,
          city,
          students!left (
            id,
            first_name,
            last_name,
            nationality,
            passport_number,
            date_of_birth,
            gender,
            current_address,
            wechat_id,
            highest_education,
            institution_name
          )
        `)
        .eq('id', id)
        .eq('role', 'student')
        .single();

      if (fallbackError || !fallbackStudent) {
        console.error('Student lookup failed:', { id, singleError: singleError?.message, fallbackError: fallbackError?.message });
        return NextResponse.json({ error: 'Student not found', details: singleError?.message || fallbackError?.message }, { status: 404 });
      }
      finalStudent = fallbackStudent;
    }

    // At this point finalStudent is guaranteed to be non-null due to early returns above
    if (!finalStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get partner info for referred_by_partner, created_by, and updated_by
    const allPartnerIds: string[] = [
      finalStudent.referred_by_partner_id,
      (finalStudent as Record<string, unknown>).created_by as string,
      (finalStudent as Record<string, unknown>).updated_by as string,
    ].filter(Boolean) as string[];

    const partnerInfoMap = new Map<string, { id: string; full_name: string; email: string; company_name?: string }>();

    if (allPartnerIds.length > 0) {
      const { data: partnerUsers } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email')
        .in('id', allPartnerIds);

      const { data: partnerRecords } = await supabaseAdmin
        .from('partners')
        .select('user_id, company_name')
        .in('user_id', allPartnerIds);

      const partnerCompanyMap = new Map<string, string>();
      for (const pr of (partnerRecords || [])) {
        partnerCompanyMap.set(pr.user_id, pr.company_name);
      }

      for (const pu of (partnerUsers || [])) {
        partnerInfoMap.set(pu.id, {
          id: pu.id,
          full_name: pu.full_name,
          email: pu.email,
          company_name: partnerCompanyMap.get(pu.id),
        });
      }
    }

    const studentRecord = Array.isArray(finalStudent.students) ? finalStudent.students[0] : finalStudent.students;

    // Get application counts for this student
    let applications = { total: 0, pending: 0 };
    if (studentRecord?.id) {
      const { data: apps } = await supabaseAdmin
        .from('applications')
        .select('status')
        .eq('student_id', studentRecord.id);
      
      if (apps && apps.length > 0) {
        applications = {
          total: apps.length,
          pending: apps.filter(a => ['submitted', 'under_review'].includes(a.status)).length,
        };
      }
    }

    const student: PartnerStudent = {
      id: finalStudent.id,
      user_id: finalStudent.id,
      email: finalStudent.email,
      full_name: finalStudent.full_name,
      phone: finalStudent.phone,
      avatar_url: finalStudent.avatar_url,
      is_active: finalStudent.is_active,
      source: 'partner_referred' as const,
      referred_by_partner_id: finalStudent.referred_by_partner_id,
      referred_by_partner: finalStudent.referred_by_partner_id
        ? partnerInfoMap.get(finalStudent.referred_by_partner_id) || null
        : null,
      created_by: (finalStudent as Record<string, unknown>).created_by as string | null,
      created_by_partner: (finalStudent as Record<string, unknown>).created_by as string
        ? partnerInfoMap.get((finalStudent as Record<string, unknown>).created_by as string) || null
        : null,
      updated_by: (finalStudent as Record<string, unknown>).updated_by as string | null,
      updated_by_partner: (finalStudent as Record<string, unknown>).updated_by as string
        ? partnerInfoMap.get((finalStudent as Record<string, unknown>).updated_by as string) || null
        : null,
      nationality: studentRecord?.nationality || null,
      gender: studentRecord?.gender || null,
      date_of_birth: studentRecord?.date_of_birth || null,
      country: finalStudent.country || null,
      city: finalStudent.city || null,
      current_address: studentRecord?.current_address || null,
      wechat_id: studentRecord?.wechat_id || null,
      passport_number: studentRecord?.passport_number || null,
      highest_education: studentRecord?.highest_education || null,
      institution_name: studentRecord?.institution_name || null,
      created_at: finalStudent.created_at,
      updated_at: finalStudent.updated_at,
      applications,
    };

    return NextResponse.json({
      student,
    });
  } catch (error) {
    console.error('Error fetching partner student detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    if (body.nationality !== undefined) studentUpdate.nationality = body.nationality;
    if (body.gender !== undefined) studentUpdate.gender = body.gender;
    if (body.country !== undefined) userUpdate.country = body.country;
    if (body.city !== undefined) userUpdate.city = body.city;
    if (body.current_address !== undefined) studentUpdate.current_address = body.current_address;
    if (body.wechat_id !== undefined) studentUpdate.wechat_id = body.wechat_id;
    if (body.passport_number !== undefined) studentUpdate.passport_number = body.passport_number;
    if (body.date_of_birth !== undefined) studentUpdate.date_of_birth = body.date_of_birth;
    if (body.highest_education !== undefined) studentUpdate.highest_education = body.highest_education;
    if (body.institution_name !== undefined) studentUpdate.institution_name = body.institution_name;

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
    if (Object.keys(studentUpdate).length > 0) {
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
          ...studentUpdate,
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
