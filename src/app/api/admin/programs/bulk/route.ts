import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// POST /api/admin/programs/bulk - Bulk operations on programs
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, programIds, data } = body;

    if (!action || !programIds || !Array.isArray(programIds) || programIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and program IDs are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    let result;

    switch (action) {
      case 'activate':
        result = await supabase
          .from('programs')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .in('id', programIds);
        break;

      case 'deactivate':
        result = await supabase
          .from('programs')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('id', programIds);
        break;

      case 'archive':
        result = await supabase
          .from('programs')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('id', programIds);
        break;

      case 'feature':
        result = await supabase
          .from('programs')
          .update({ is_featured: true, updated_at: new Date().toISOString() })
          .in('id', programIds);
        break;

      case 'unfeature':
        result = await supabase
          .from('programs')
          .update({ is_featured: false, updated_at: new Date().toISOString() })
          .in('id', programIds);
        break;

      case 'delete':
        // Permanent delete - use with caution
        result = await supabase
          .from('programs')
          .delete()
          .in('id', programIds);
        break;

      case 'updateUniversity':
        if (!data?.university_id) {
          return NextResponse.json(
            { error: 'University ID is required for updateUniversity action' },
            { status: 400 }
          );
        }
        result = await supabase
          .from('programs')
          .update({ 
            university_id: data.university_id, 
            updated_at: new Date().toISOString() 
          })
          .in('id', programIds);
        break;

      case 'updateStatus':
        result = await supabase
          .from('programs')
          .update({ 
            is_active: data?.is_active ?? true, 
            updated_at: new Date().toISOString() 
          })
          .in('id', programIds);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (result.error) {
      console.error('Error in bulk operation:', result.error);
      return NextResponse.json(
        { error: 'Failed to perform bulk operation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      affectedCount: programIds.length,
      message: `Successfully ${action}d ${programIds.length} program(s)`,
    });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
