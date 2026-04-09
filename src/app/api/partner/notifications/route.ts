import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Get query params
    const type = request.nextUrl.searchParams.get('type') || 'all';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    
    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Apply type filter
    if (type !== 'all' && type !== 'unread') {
      query = query.eq('type', type);
    }
    
    const { data: notifications, error } = await query;
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
    
    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    
    if (countError) {
      console.error('Error counting notifications:', countError);
    }
    
    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
    
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
