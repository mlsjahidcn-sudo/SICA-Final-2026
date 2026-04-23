import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePartner } from '@/lib/auth-utils';

// GET /api/partner/applications/[id] - Get partner application detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requirePartner(request);
    if (authUser instanceof NextResponse) return authUser;

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Get partner user id
    const { data: partnerUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .eq('role', 'partner')
      .single();

    if (!partnerUser) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const partnerUserId = partnerUser.id;

    // Fetch partner record ID (applications.partner_id references partners.id)
    const { data: partnerRecord } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', partnerUserId)
      .maybeSingle();
    const partnerRecordId = partnerRecord?.id || null;

    // Fetch application
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify partner has access: either created the app or the student is referred by them
    const { data: studentData } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', app.student_id)
      .single();

    const { data: studentUserRecord } = await supabase
      .from('users')
      .select('referred_by_partner_id')
      .eq('id', studentData?.user_id || '')
      .single();

    const isReferredByPartner = studentUserRecord?.referred_by_partner_id === partnerUserId;
    const isCreatedByPartner = partnerRecordId ? app.partner_id === partnerRecordId : false;

    if (!isReferredByPartner && !isCreatedByPartner) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Fetch student info
    const { data: student } = await supabase
      .from('students')
      .select('id, user_id, full_name, first_name, last_name, email, phone, nationality')
      .eq('id', app.student_id)
      .single();

    const { data: studentUser } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', student?.user_id || '')
      .single();

    // Fetch program info
    let program = null;
    if (app.program_id) {
      const { data: prog } = await supabase
        .from('programs')
        .select('id, name')
        .eq('id', app.program_id)
        .single();
      if (prog) {
        const { data: univ } = await supabase
          .from('universities')
          .select('id, name_en')
          .eq('id', app.university_id || '')
          .maybeSingle();
        program = { ...prog, universities: univ ? [univ] : [] };
      }
    }

    // Fetch partner info
    let partner = null;
    if (app.partner_id) {
      const { data: partnerRec } = await supabase
        .from('partners')
        .select('id, company_name, user_id')
        .eq('id', app.partner_id)
        .single();
      if (partnerRec?.user_id) {
        const { data: pUser } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', partnerRec.user_id)
          .single();
        partner = pUser;
      }
    }

    return NextResponse.json({
      application: {
        ...app,
        student: student
          ? {
              id: student.id,
              full_name: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
              email: studentUser?.email || student.email,
              phone: student.phone,
              nationality: student.nationality,
            }
          : null,
        program,
        partner,
      },
    });
  } catch (error) {
    console.error('Partner application GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/partner/applications/[id] - Update partner application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requirePartner(request);
    if (authUser instanceof NextResponse) return authUser;

    const { id } = await params;
    const body = await request.json();
    const { status, notes, program_id } = body;

    const supabase = getSupabaseClient();

    // Get partner user id
    const { data: partnerUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .eq('role', 'partner')
      .single();

    if (!partnerUser) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const partnerUserId = partnerUser.id;

    // Fetch partner record ID (applications.partner_id references partners.id)
    const { data: partnerRecord } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', partnerUserId)
      .maybeSingle();
    const partnerRecordId = partnerRecord?.id || null;

    // Fetch application to verify ownership
    const { data: existingApp } = await supabase
      .from('applications')
      .select('student_id, partner_id')
      .eq('id', id)
      .single();

    if (!existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify partner has access
    const { data: studentData } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', existingApp.student_id)
      .single();

    const { data: studentUserRecord } = await supabase
      .from('users')
      .select('referred_by_partner_id')
      .eq('id', studentData?.user_id || '')
      .single();

    const isReferredByPartner = studentUserRecord?.referred_by_partner_id === partnerUserId;
    const isCreatedByPartner = partnerRecordId ? existingApp.partner_id === partnerRecordId : false;

    if (!isReferredByPartner && !isCreatedByPartner) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (program_id !== undefined) updateData.program_id = program_id;

    const { data, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    return NextResponse.json({ application: data });
  } catch (error) {
    console.error('Partner application PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
