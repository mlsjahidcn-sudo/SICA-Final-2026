import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - Bulk operations on universities
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient(token);

    // Verify admin role - must pass JWT explicitly since persistSession is false
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ids } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: action and ids array are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'activate':
        result = await supabase
          .from('universities')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .in('id', ids);
        break;

      case 'deactivate':
        result = await supabase
          .from('universities')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('id', ids);
        break;

      case 'delete':
        result = await supabase
          .from('universities')
          .delete()
          .in('id', ids);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: activate, deactivate, delete' },
          { status: 400 }
        );
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      affectedCount: ids.length,
      message: `Successfully ${action}d ${ids.length} universit${ids.length === 1 ? 'y' : 'ies'}`
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
