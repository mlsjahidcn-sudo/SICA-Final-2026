import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/meetings/[id] - Get meeting details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data: meeting, error } = await supabase
      .from('meetings')
      .select(`
        id,
        title,
        meeting_date,
        duration_minutes,
        platform,
        meeting_url,
        meeting_id,
        meeting_password,
        status,
        notes,
        created_at,
        updated_at,
        applications (
          id,
          status,
          programs (
            id,
            name_en,
            name_cn,
            degree_type,
            universities (
              id,
              name_en,
              name_cn,
              city,
              logo_url
            )
          )
        ),
        users!meetings_interviewer_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('id', id)
      .eq('student_id', user.id)
      .single();

    if (error || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({ meeting });

  } catch (error) {
    console.error('Error in meeting GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
