import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth, getPartnerAdminId } from '@/lib/partner-auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Verify partner authentication (both admin and member can view activity)
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const partnerUser = authResult.user;
    const partnerAdminId = await getPartnerAdminId(partnerUser.id);
    
    if (!partnerAdminId) {
      return NextResponse.json(
        { error: 'Failed to determine partner admin ID' },
        { status: 500 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const actionFilter = searchParams.get('action');
    const userFilter = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    const supabase = getSupabaseClient();
    
    // Build query
    let query = supabase
      .from('partner_team_activity')
      .select(`
        id,
        partner_id,
        actor_id,
        target_user_id,
        action,
        action_details,
        ip_address,
        created_at,
        actor: users!partner_team_activity_actor_id_fkey(id, full_name, email),
        target_user: users!partner_team_activity_target_user_id_fkey(id, full_name, email)
      `)
      .eq('partner_id', partnerAdminId)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (actionFilter) {
      query = query.eq('action', actionFilter);
    }
    
    if (userFilter) {
      query = query.or(`actor_id.eq.${userFilter},target_user_id.eq.${userFilter}`);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    // Execute query
    const { data: activities, error, count } = await query;
    
    if (error) {
      console.error('Error fetching team activity:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team activity' },
        { status: 500 }
      );
    }
    
    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('partner_team_activity')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerAdminId);
    
    return NextResponse.json({
      success: true,
      data: activities || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching team activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team activity' },
      { status: 500 }
    );
  }
}
