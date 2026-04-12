import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// GET - Get scholarships for a university
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data: scholarships, error } = await supabase
      .from('university_scholarships')
      .select('*')
      .eq('university_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ scholarships });
  } catch (error) {
    console.error('Get scholarships error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new scholarship
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const supabase = getSupabaseClient();

    const body = await request.json();

    const scholarshipData = {
      university_id: id,
      name_en: body.name_en,
      name_cn: body.name_cn || null,
      type: body.type || null,
      coverage_percentage: body.coverage_percentage || null,
      coverage_tuition: body.coverage_tuition ?? false,
      coverage_accommodation: body.coverage_accommodation ?? false,
      coverage_stipend: body.coverage_stipend ?? false,
      coverage_medical: body.coverage_medical ?? false,
      stipend_amount: body.stipend_amount || null,
      stipend_currency: body.stipend_currency || 'CNY',
      description: body.description || null,
      eligibility: body.eligibility || null,
      application_process: body.application_process || null,
      deadline: body.deadline || null,
      is_active: body.is_active ?? true,
    };

    const { data: scholarship, error: createError } = await supabase
      .from('university_scholarships')
      .insert(scholarshipData)
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ scholarship });
  } catch (error) {
    console.error('Create scholarship error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
