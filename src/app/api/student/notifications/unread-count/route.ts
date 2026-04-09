import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/notifications/unread-count - Get unread notification count
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
    }

    return NextResponse.json({
      unreadCount: count || 0,
    });

  } catch (error) {
    console.error('Error in unread-count GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
