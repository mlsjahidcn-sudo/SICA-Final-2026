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

    // Fetch application - must belong to this partner
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .or(`partner_id.eq.${partnerUserId},referred_by_partner_id.eq.${partnerUserId}`)
      .single();

    if (appError || !app) {
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
        .select('id, name, universities(id, name_en)')
        .eq('id', app.program_id)
        .single();
      program = prog;
    }

    // Fetch partner info
    let partner = null;
    if (app.partner_id) {
      const { data: p } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', app.partner_id)
        .single();
      partner = p;
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

    // Verify application belongs to this partner
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('id', id)
      .or(`partner_id.eq.${partnerUserId},referred_by_partner_id.eq.${partnerUserId}`)
      .single();

    if (!existing) {
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
