import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// PATCH /api/student/applications/[id]/autosave - Autosave application draft
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    let studentId: string | null = null;
    let partnerId: string | null = null;

    // Get student record for students
    if (user.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!studentRecord) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }
      studentId = studentRecord.id;
    }
    // Get partner record for partners
    else if (user.role === 'partner' || user.partner_id) {
      const partnerUserId = user.role === 'partner' ? user.id : user.partner_id;
      const { data: partnerRecord } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', partnerUserId)
        .maybeSingle();
      
      if (partnerRecord) {
        partnerId = partnerRecord.id;
      }
    }
    else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if application exists and belongs to user
    let query = supabase
      .from('applications')
      .select('id, status, updated_at')
      .eq('id', id);

    if (studentId) {
      query = query.eq('student_id', studentId);
    } else if (partnerId) {
      query = query.eq('partner_id', partnerId);
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: existing } = await query.single();

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Allow autosave for draft and submitted (for editing before review starts)
    if (!['draft', 'submitted'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Can only autosave draft applications' },
        { status: 400 }
      );
    }

    // Only update allowed fields for autosave
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Autosave fields - text content and application-specific data
    const autosaveFields = [
      'personal_statement',
      'study_plan',
      'intake',
      'hsk_level',
      'hsk_score',
      'ielts_score',
      'toefl_score',
      'other_languages',
      'scholarship_application',
      'financial_guarantee',
    ];

    for (const field of autosaveFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: application, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        status,
        intake,
        updated_at,
        personal_statement,
        study_plan
      `)
      .single();

    if (error) {
      console.error('Error autosaving application:', error);
      return NextResponse.json({ error: 'Failed to autosave' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Draft autosaved',
      saved_at: application?.updated_at,
      application 
    });

  } catch (error) {
    console.error('Error in application autosave:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
