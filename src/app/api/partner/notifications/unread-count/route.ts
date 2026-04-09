import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    
    if (error) {
      console.error('Error counting unread notifications:', error);
      return NextResponse.json({ error: 'Failed to count notifications' }, { status: 500 });
    }
    
    return NextResponse.json({ count: count || 0 });
    
  } catch (error) {
    console.error('Unread count API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
