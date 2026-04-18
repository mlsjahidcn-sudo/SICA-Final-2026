import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    
    // Use centralized auth helper
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabaseAdmin = getSupabaseClient();

    // Get student details - only select columns that exist in the actual Supabase tables
    const { data: student, error } = await supabaseAdmin
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
        students (
          id,
          first_name,
          last_name,
          nationality,
          passport_number,
          passport_expiry_date,
          date_of_birth,
          gender,
          current_address,
          wechat_id,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          highest_education,
          institution_name,
          field_of_study,
          graduation_date,
          gpa,
          hsk_level,
          hsk_score,
          ielts_score,
          toefl_score,
          education_history,
          work_experience
        )
      `)
      .eq('id', studentId)
      .eq('role', 'student')
      .single();

    if (error || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch referring partner info if student was referred
    let referredByPartner: { full_name: string; email: string; company_name?: string; id: string } | null = null;
    if (student.referred_by_partner_id) {
      const { data: partnerUser } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email')
        .eq('id', student.referred_by_partner_id)
        .single();

      if (partnerUser) {
        const { data: partnerRecord } = await supabaseAdmin
          .from('partners')
          .select('company_name')
          .eq('user_id', student.referred_by_partner_id)
          .maybeSingle();

        referredByPartner = {
          id: partnerUser.id,
          full_name: partnerUser.full_name,
          email: partnerUser.email,
          company_name: partnerRecord?.company_name,
        };
      }
    }

    // Get student's applications
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        submitted_at,
        programs (
          id,
          name_en,
          degree_type,
          universities (
            id,
            name_en,
            city
          )
        )
      `)
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });

    // Get student's documents
    const studentData = student.students as any;
    const studentRecordId = Array.isArray(studentData) ? studentData[0]?.id : studentData?.id;
    let documents: any[] = [];
    if (studentRecordId) {
      const { data: docs } = await supabaseAdmin
        .from('documents')
        .select('id, type, file_key, uploaded_at, status, application_id')
        .eq('student_id', studentRecordId)
        .order('uploaded_at', { ascending: false });
        
      documents = (docs || []).map((d: any) => ({
        id: d.id,
        document_type: d.type,
        file_url: d.file_key,
        uploaded_at: d.uploaded_at,
        status: d.status,
        application_id: d.application_id,
        verified: d.status === 'verified'
      }));
    }

    // Get student's meetings
    const { data: meetings } = await supabaseAdmin
      .from('meetings')
      .select(`
        id,
        title,
        scheduled_at,
        status,
        meeting_url
      `)
      .eq('student_id', studentId)
      .order('scheduled_at', { ascending: false })
      .limit(10);

    // Flatten students table fields to top level for frontend convenience
    // studentData already declared on line 114
    const flatStudent = {
      ...student,
      ...(studentData || {}),  // Spread students fields at top level
      source: student.referred_by_partner_id ? 'partner_referred' as const : 'individual' as const,
      referred_by_partner: referredByPartner,
      applications: applications || [],
      documents: documents || [],
      meetings: meetings || [],
    };
    // Remove the nested students property since we've flattened it
    delete (flatStudent as any).students;

    return NextResponse.json({
      student: flatStudent,
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseAdmin = getSupabaseClient();
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // User table fields
    const { 
      full_name, 
      phone, 
      is_active,
      // Student table fields (flat format)
      nationality,
      date_of_birth,
      gender,
      current_address,
      permanent_address,
      postal_code,
      chinese_name,
      marital_status,
      religion,
      passport_number,
      passport_expiry_date,
      passport_issuing_country,
      wechat_id,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      highest_education,
      institution_name,
      field_of_study,
      graduation_date,
      gpa,
      hsk_level,
      hsk_score,
      ielts_score,
      toefl_score,
      education_history,
      work_experience,
      family_members,
      extracurricular_activities,
      awards,
      publications,
      research_experience,
      scholarship_application,
      financial_guarantee,
      study_mode,
      funding_source,
    } = body;

    // Update user table
    const userUpdateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) userUpdateData.full_name = full_name;
    if (phone !== undefined) userUpdateData.phone = phone;
    if (typeof is_active !== 'undefined') userUpdateData.is_active = is_active;

    const { data: updatedUser, error: userError } = await supabaseAdmin
      .from('users')
      .update(userUpdateData)
      .eq('id', studentId)
      .select()
      .single();

    if (userError) {
      console.error('Error updating user:', userError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Update student table - include ALL fields
    const studentUpdateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const studentFields = [
      'nationality', 'date_of_birth', 'gender', 'current_address', 'postal_code',
      'permanent_address', 'chinese_name', 'marital_status', 'religion',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
      'passport_number', 'passport_expiry_date', 'passport_issuing_country', 'wechat_id',
      'highest_education', 'institution_name', 'field_of_study', 'graduation_date', 'gpa',
      'hsk_level', 'hsk_score', 'ielts_score', 'toefl_score',
      'education_history', 'work_experience',
      'family_members', 'extracurricular_activities', 'awards', 'publications',
      'research_experience', 'scholarship_application', 'financial_guarantee',
      'study_mode', 'funding_source',
    ];
    
    for (const field of studentFields) {
      if ((body as Record<string, unknown>)[field] !== undefined) {
        studentUpdateData[field] = (body as Record<string, unknown>)[field];
      }
    }

    // Only update if there are student fields to update
    if (Object.keys(studentUpdateData).length > 1) {
      const { error: studentError } = await supabaseAdmin
        .from('students')
        .update(studentUpdateData)
        .eq('user_id', studentId);

      if (studentError) {
        console.error('Error updating student record:', studentError);
        // Don't fail the whole request, just log the error
      }
    }

    // Fetch the updated student with all related data
    const { data: student, error: fetchError } = await supabaseAdmin
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
        students (
          id,
          first_name,
          last_name,
          nationality,
          passport_number,
          passport_expiry_date,
          date_of_birth,
          gender,
          current_address,
          wechat_id,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          highest_education,
          institution_name,
          field_of_study,
          graduation_date,
          gpa,
          hsk_level,
          hsk_score,
          ielts_score,
          toefl_score
        )
      `)
      .eq('id', studentId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated student:', fetchError);
    }

    return NextResponse.json({ student: student || updatedUser });
  } catch (error) {
    console.error('Error in PUT student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    
    // Use centralized auth helper
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabaseAdmin = getSupabaseClient();

    // First, check if this is an orphan student (student record without user_id)
    const { data: studentRecord, error: studentCheckError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', studentId)
      .maybeSingle();

    // If found as student record with no user_id, it's an orphan student
    if (studentRecord && !studentRecord.user_id) {
      // Check if orphan student has applications
      const { data: orphanApplications } = await supabaseAdmin
        .from('applications')
        .select('id')
        .eq('student_id', studentId)
        .limit(1);

      if (orphanApplications && orphanApplications.length > 0) {
        // Soft delete - mark as deleted and inactive
        const { error } = await supabaseAdmin
          .from('students')
          .update({ 
            is_active: false,
            deleted_at: new Date().toISOString()
          })
          .eq('id', studentId);

        if (error) {
          console.error('Error deactivating orphan student:', error);
          return NextResponse.json({ error: 'Failed to deactivate student' }, { status: 500 });
        }

        return NextResponse.json({
          message: 'Orphan student has applications and was deactivated',
          action: 'deactivated'
        });
      }

      // Hard delete orphan student - no applications
      const { error: deleteError } = await supabaseAdmin
        .from('students')
        .delete()
        .eq('id', studentId);

      if (deleteError) {
        console.error('Error deleting orphan student:', deleteError);
        return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Orphan student deleted successfully',
        action: 'deleted'
      });
    }

    // Regular student with user account
    // Check if student has applications
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('user_id', studentId)
      .limit(1);

    if (applications && applications.length > 0) {
      // Soft delete - just deactivate the account
      const { error } = await supabaseAdmin
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', studentId);

      if (error) {
        console.error('Error deactivating student:', error);
        return NextResponse.json({ error: 'Failed to deactivate student' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Student has applications and was deactivated instead of deleted',
        action: 'deactivated'
      });
    }

    // Hard delete - no applications, safe to delete
    // First delete student record
    await supabaseAdmin
      .from('students')
      .delete()
      .eq('user_id', studentId);

    // Then delete user record
    const { error: userDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', studentId);

    if (userDeleteError) {
      console.error('Error deleting user:', userDeleteError);
      return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
    }

    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(studentId);

    return NextResponse.json({
      message: 'Student deleted successfully',
      action: 'deleted'
    });
  } catch (error) {
    console.error('Error in DELETE student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
