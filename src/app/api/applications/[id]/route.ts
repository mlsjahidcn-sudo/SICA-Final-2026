import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// Helper to get partner ID for the current user.
// applications.partner_id stores users.id (not partners.id), so we return user.id for partners.
function getPartnerIdForUser(user: { id: string; email: string; role: string; partner_id?: string } | null): string | null {
  if (!user) return null;
  if (user.role === 'partner') {
    return user.id;
  }
  if (user.partner_id) {
    return user.partner_id;
  }
  return null;
}

// GET /api/applications/[id] - Get a single application by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const partnerId = getPartnerIdForUser(user);

    let query = supabase
      .from('applications')
      .select(`
        *,
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name_en,
            name_cn,
            city
          )
        ),
        students (
          id,
          user_id,
          first_name,
          last_name,
          nationality,
          email,
          users (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('id', id);

    // If user is partner, only allow access to their own applications
    if (user.role === 'partner' || partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    // If user is student, only allow access to their own applications
    if (user.role === 'student') {
      const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (studentRec) {
        query = query.eq('student_id', studentRec.id);
      } else {
        return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
      }
    }

    const { data: application, error } = await query.single();

    if (error) {
      console.error('Error fetching application:', error);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Fix relations (Supabase returns arrays for has-many)
    const normalizedApplication = {
      ...application,
      programs: Array.isArray(application.programs) ? application.programs[0] : application.programs,
      students: Array.isArray(application.students) ? application.students[0] : application.students,
    };

    return NextResponse.json({ application: normalizedApplication });
  } catch (error) {
    console.error('Error in applications [id] GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/applications/[id] - Submit an application
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuthToken(request);
    const partnerId = getPartnerIdForUser(user);

    if (!user || !['student', 'partner', 'admin'].includes(user.role) && !partnerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    // First, get the application to verify ownership
    const { data: existingApp, error: fetchError } = await supabase
      .from('applications')
      .select('id, student_id, partner_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify ownership
    if (user.role === 'partner' || partnerId) {
      if (existingApp.partner_id !== partnerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else if (user.role === 'student') {
      const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!studentRec || existingApp.student_id !== studentRec.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Update application status to submitted
    const { data: updatedApp, error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error submitting application:', updateError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    return NextResponse.json({ application: updatedApp });
  } catch (error) {
    console.error('Error in applications [id] POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
