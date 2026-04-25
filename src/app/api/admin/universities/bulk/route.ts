import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// POST - Bulk operations on universities
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();

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
