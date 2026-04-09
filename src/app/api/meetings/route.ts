import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Get the current user's ID from query params or auth
    const userId = request.nextUrl.searchParams.get('user_id');
    const status = request.nextUrl.searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    let query = supabase
      .from('meetings')
      .select(`
        *,
        applications (
          id,
          status,
          programs (
            name_en,
            degree_type,
            universities (
              name_en,
              city
            )
          )
        )
      `)
      .eq('student_id', userId)
      .order('meeting_date', { ascending: true });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: meetings, error } = await query;
    
    if (error) {
      console.error('Error fetching meetings:', error);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }
    
    return NextResponse.json({ meetings });
    
  } catch (error) {
    console.error('Meetings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
