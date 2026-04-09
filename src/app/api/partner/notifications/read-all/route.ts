import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('is_read', false);
    
    if (error) {
      console.error('Error marking all notifications as read:', error);
      return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Mark all read API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
