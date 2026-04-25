import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePartner } from '@/lib/auth-utils';
import type { PartnerStudentDetail } from '@/app/(partner-v2)/partner-v2/students/lib/types';

/**
 * GET /api/partner/students/[id] - Get a single student's details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePartner(request);
    if (user instanceof NextResponse) return user;

    const { id: studentId } = await params;
    const supabase = getSupabaseClient();

    // Fetch student with all details
    const { data: student, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (error || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify this is actually a student
    if (student.role !== 'student') {
      return NextResponse.json({ error: 'Not a student record' }, { status: 400 });
    }

    // Check access control: partner must be able to see this student
    const { data: fullUser } = await supabase
      .from('users')
      .select('id, partner_role, partner_id')
      .eq('id', user.id)
      .single();

    const isAdmin = !fullUser?.partner_role || fullUser.partner_role === 'partner_admin';

    let referrerIds: string[];
    if (isAdmin) {
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${user.id},partner_id.eq.${user.id}`)
        .eq('role', 'partner');
      referrerIds = (teamMembers || []).map(m => m.id);
      if (!referrerIds.includes(user.id)) referrerIds.push(user.id);
    } else {
      referrerIds = [user.id];
    }

    // Access control: admin sees team students, member sees only their own
    // Students with referred_by_partner_id = null are NOT accessible to partner admins
    // for privacy - only the system/superadmin should access unassigned students
    const studentReferrer = student.referred_by_partner_id || '';
    const hasAccess = referrerIds.includes(studentReferrer);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get application counts for this student
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentId)
      .maybeSingle();

    const actualStudentId = studentRecord?.id || studentId;

    // Fetch extended student data from students table (awards, publications, etc.)
    let studentsData: Record<string, unknown> = {};
    if (studentRecord) {
      const { data: extendedData } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentRecord.id)
        .maybeSingle();
      if (extendedData) {
        studentsData = extendedData;
      }
    }

    const { data: applications } = await supabase
      .from('applications')
      .select('status')
      .eq('student_id', actualStudentId);

    const appStats = {
      total: (applications || []).length,
      pending: (applications || []).filter(a =>
        ['submitted', 'under_review', 'document_request', 'interview_scheduled'].includes(a.status)
      ).length,
      approved: (applications || []).filter(a => a.status === 'accepted').length,
      rejected: (applications || []).filter(a =>
        ['rejected', 'withdrawn'].includes(a.status)
      ).length,
    };

    // Get documents count
    let documentsCount = 0;
    if (actualStudentId) {
      const { count: docsCount } = await supabase
        .from('application_documents')
        .select('*', { count: 'exact', head: true })
        .or(`entity_type.eq.student,and(entity_id.eq.${actualStudentId},and(user_id.eq.${studentId}))`);
      documentsCount = docsCount || 0;
      
      // Also check partner_documents table
      try {
        const { count: partnerDocsCount } = await supabase
          .from('partner_documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', studentId);
        documentsCount += partnerDocsCount || 0;
      } catch {
        // partner_documents table might not exist
      }
    }

    // Build detailed response
    const detail: PartnerStudentDetail = {
      id: student.id,
      user_id: student.id,
      email: student.email || '',
      full_name: student.full_name || '',
      phone: student.phone || null,
      avatar_url: student.avatar_url || null,
      is_active: student.is_active ?? true,
      referred_by_partner_id: student.referred_by_partner_id || null,
      created_at: student.created_at,
      updated_at: student.updated_at,
      city: student.city || null,
      country: student.country || null,

      // Personal (from students table)
      nationality: studentsData.nationality as string | null || null,
      gender: studentsData.gender as string | null || null,
      date_of_birth: studentsData.date_of_birth as string | null || null,
      chinese_name: studentsData.chinese_name as string | null || null,
      marital_status: studentsData.marital_status as string | null || null,
      religion: studentsData.religion as string | null || null,
      current_address: studentsData.current_address as string | null || null,
      permanent_address: studentsData.permanent_address as string | null || null,
      postal_code: studentsData.postal_code as string | null || null,
      wechat_id: studentsData.wechat_id as string | null || null,
      passport_number: studentsData.passport_number as string | null || null,

      // Emergency contact (from students table)
      emergency_contact_name: studentsData.emergency_contact_name as string | null || null,
      emergency_contact_phone: studentsData.emergency_contact_phone as string | null || null,
      emergency_contact_relationship: studentsData.emergency_contact_relationship as string | null || null,

      // Passport (from students table)
      passport_expiry_date: studentsData.passport_expiry_date as string | null || null,
      passport_issuing_country: studentsData.passport_issuing_country as string | null || null,

      // Academic (from students table)
      education_history: (studentsData.education_history as PartnerStudentDetail['education_history']) || [],
      work_experience: (studentsData.work_experience as PartnerStudentDetail['work_experience']) || [],
      highest_education: studentsData.highest_education as string | null || null,
      institution_name: studentsData.institution_name as string | null || null,
      field_of_study: studentsData.field_of_study as string | null || null,
      graduation_date: studentsData.graduation_date as string | null || null,
      gpa: studentsData.gpa as string | null || null,
      hsk_level: (studentsData.hsk_level as number | null) ?? null,
      hsk_score: (studentsData.hsk_score as number | null) ?? null,
      ielts_score: studentsData.ielts_score as string | null || null,
      toefl_score: (studentsData.toefl_score as number | null) ?? null,

      // Family & Additional (from students table)
      family_members: (studentsData.family_members as PartnerStudentDetail['family_members']) || [],
      extracurricular_activities: (studentsData.extracurricular_activities as PartnerStudentDetail['extracurricular_activities']) || null,
      awards: (studentsData.awards as PartnerStudentDetail['awards']) || null,
      publications: (studentsData.publications as PartnerStudentDetail['publications']) || null,
      research_experience: (studentsData.research_experience as PartnerStudentDetail['research_experience']) || null,

      // Preferences (from students table)
      study_mode: studentsData.study_mode as string | null || null,
      funding_source: studentsData.funding_source as string | null || null,
      scholarship_application: studentsData.scholarship_application as Record<string, unknown> | null || null,
      financial_guarantee: studentsData.financial_guarantee as Record<string, unknown> | null || null,

      // Computed
      applications: appStats,
      documents_count: documentsCount,
    };

    return NextResponse.json({ success: true, data: detail });

  } catch (error) {
    console.error('Get student detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/partner/students/[id] - Update an existing student
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePartner(request);
    if (user instanceof NextResponse) return user;

    const { id: studentId } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    // Verify student exists and belongs to this partner
    const { data: existingStudent, error: fetchError } = await supabase
      .from('users')
      .select('id, role, referred_by_partner_id')
      .eq('id', studentId)
      .maybeSingle();

    if (fetchError || !existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (existingStudent.role !== 'student') {
      return NextResponse.json({ error: 'Not a student record' }, { status: 400 });
    }

    // Check access control
    const { data: fullUser } = await supabase
      .from('users')
      .select('id, partner_role, partner_id')
      .eq('id', user.id)
      .single();

    const isAdmin = !fullUser?.partner_role || fullUser.partner_role === 'partner_admin';

    let referrerIds: string[];
    if (isAdmin) {
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${user.id},partner_id.eq.${user.id}`)
        .eq('role', 'partner');
      referrerIds = (teamMembers || []).map(m => m.id);
      if (!referrerIds.includes(user.id)) referrerIds.push(user.id);
    } else {
      referrerIds = [user.id];
    }

    if (!referrerIds.includes(existingStudent.referred_by_partner_id || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build update payloads from body directly (no Zod)
    // Fields that exist in the users table (only these can be updated directly)
    const usersTableFields = [
      'full_name', 'phone', 'country', 'city', 'is_active',
    ];

    // Fields that exist in the students table (everything else)
    const studentsTableFields = [
      'chinese_name', 'nationality', 'date_of_birth', 'gender',
      'marital_status', 'religion',
      'current_address', 'permanent_address', 'postal_code', 'wechat_id',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
      'passport_number', 'passport_expiry_date', 'passport_issuing_country',
      'education_history', 'work_experience',
      'highest_education', 'institution_name',
      'graduation_date', 'hsk_level', 'hsk_score', 'ielts_score', 'toefl_score',
      'field_of_study', 'gpa',
      'family_members', 'extracurricular_activities', 'awards', 'publications', 'research_experience',
      'study_mode', 'funding_source', 'scholarship_application', 'financial_guarantee',
    ];

    // Build users table update payload
    const usersUpdatePayload: Record<string, unknown> = {};
    for (const field of usersTableFields) {
      if (body[field] !== undefined) {
        usersUpdatePayload[field] = body[field] || null;
      }
    }

    // Add updated timestamp for users table
    usersUpdatePayload.updated_at = new Date().toISOString();
    usersUpdatePayload.updated_by = user.id; // Track which team member updated this student

    // Build students table update payload
    const studentsUpdatePayload: Record<string, unknown> = {};
    for (const field of studentsTableFields) {
      if (body[field] !== undefined) {
        studentsUpdatePayload[field] = body[field] || null;
      }
    }

    // Handle field_of_study mapping (form sends field_of_study_legacy)
    if (body.field_of_study_legacy !== undefined) {
      studentsUpdatePayload.field_of_study = body.field_of_study_legacy;
    } else if (body.field_of_study !== undefined) {
      studentsUpdatePayload.field_of_study = body.field_of_study;
    }

    // Handle gpa mapping (form sends gpa_legacy)
    if (body.gpa_legacy !== undefined) {
      studentsUpdatePayload.gpa = body.gpa_legacy;
    } else if (body.gpa !== undefined) {
      studentsUpdatePayload.gpa = body.gpa;
    }

    // Update users table first
    const { error: usersUpdateError } = await supabase
      .from('users')
      .update(usersUpdatePayload)
      .eq('id', studentId);

    if (usersUpdateError) {
      console.error('Error updating student in users table:', usersUpdateError);
      return NextResponse.json(
        { error: 'Failed to update student', details: { message: usersUpdateError.message } },
        { status: 500 }
      );
    }

    // Update students table if there are students-specific fields to update
    if (Object.keys(studentsUpdatePayload).length > 0) {
      // First check if a students record exists for this user
      const { data: existingStudentRecord, error: studentRecordError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', studentId)
        .maybeSingle();

      if (studentRecordError) {
        console.error('Error checking students record:', studentRecordError);
        // Non-fatal error, continue
      } else if (existingStudentRecord) {
        // Update existing students record
        const { error: studentsUpdateError } = await supabase
          .from('students')
          .update(studentsUpdatePayload)
          .eq('id', existingStudentRecord.id);

        if (studentsUpdateError) {
          console.error('Error updating student in students table:', studentsUpdateError);
          return NextResponse.json(
            { error: 'Failed to update student details', details: { message: studentsUpdateError.message } },
            { status: 500 }
          );
        }
      }
      // If no students record exists, we could create one, but for now we skip it
      // to avoid creating orphaned records
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Student updated successfully' },
    });

  } catch (error) {
    console.error('Update student API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/partner/students/[id] - Delete a student
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePartner(request);
    if (user instanceof NextResponse) return user;

    const { id: studentId } = await params;
    const supabase = getSupabaseClient();

    // Verify student exists and belongs to this partner
    const { data: existingStudent, error: fetchError } = await supabase
      .from('users')
      .select('id, role, referred_by_partner_id')
      .eq('id', studentId)
      .maybeSingle();

    if (fetchError || !existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (existingStudent.role !== 'student') {
      return NextResponse.json({ error: 'Not a student record' }, { status: 400 });
    }

    // Check access control - only partner_admin can delete students
    const { data: fullUser } = await supabase
      .from('users')
      .select('id, partner_role, partner_id')
      .eq('id', user.id)
      .single();

    const isAdmin = !fullUser?.partner_role || fullUser.partner_role === 'partner_admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only partner admin can delete students' }, { status: 403 });
    }

    // Check if student belongs to this partner's team
    let referrerIds: string[];
    const { data: teamMembers } = await supabase
      .from('users')
      .select('id')
      .or(`id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq('role', 'partner');
    referrerIds = (teamMembers || []).map(m => m.id);
    if (!referrerIds.includes(user.id)) referrerIds.push(user.id);

    if (!referrerIds.includes(existingStudent.referred_by_partner_id || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check for existing applications
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentId)
      .maybeSingle();

    const actualStudentId = studentRecord?.id || studentId;

    const { data: applications } = await supabase
      .from('applications')
      .select('id')
      .eq('student_id', actualStudentId);

    if (applications && applications.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete student with existing applications', details: { message: 'Please withdraw or delete all applications first' } },
        { status: 400 }
      );
    }

    // Delete from students table first (if exists)
    if (studentRecord) {
      const { error: deleteStudentsError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentRecord.id);

      if (deleteStudentsError) {
        console.error('Error deleting student record:', deleteStudentsError);
        return NextResponse.json(
          { error: 'Failed to delete student record', details: { message: deleteStudentsError.message } },
          { status: 500 }
        );
      }
    }

    // Delete documents
    await supabase
      .from('application_documents')
      .delete()
      .or(`user_id.eq.${studentId},and(entity_type.eq.student,entity_id.eq.${actualStudentId})`);

    // Delete from users table
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', studentId);

    if (deleteUserError) {
      console.error('Error deleting student user:', deleteUserError);
      return NextResponse.json(
        { error: 'Failed to delete student', details: { message: deleteUserError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Student deleted successfully' },
    });

  } catch (error) {
    console.error('Delete student API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
