import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// GET - Get single scholarship
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scholarshipId: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { scholarshipId } = await params;
    const supabase = getSupabaseClient();

    const { data: scholarship, error } = await supabase
      .from('university_scholarships')
      .select('*')
      .eq('id', scholarshipId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Scholarship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ scholarship });
  } catch (error) {
    console.error('Get scholarship error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update scholarship
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scholarshipId: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { scholarshipId } = await params;
    const supabase = getSupabaseClient();

    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      'name_en', 'name_cn', 'type', 'coverage_percentage',
      'coverage_tuition', 'coverage_accommodation', 'coverage_stipend', 'coverage_medical',
      'stipend_amount', 'stipend_currency', 'description', 'eligibility',
      'application_process', 'deadline', 'is_active'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: scholarship, error: updateError } = await supabase
      .from('university_scholarships')
      .update(updateData)
      .eq('id', scholarshipId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ scholarship });
  } catch (error) {
    console.error('Update scholarship error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete scholarship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scholarshipId: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { scholarshipId } = await params;
    const supabase = getSupabaseClient();

    const { error: deleteError } = await supabase
      .from('university_scholarships')
      .delete()
      .eq('id', scholarshipId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete scholarship error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
