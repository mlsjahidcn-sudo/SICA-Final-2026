import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET - Get programs for a specific university
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const degreeType = searchParams.get('degree_type') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('programs')
      .select('*', { count: 'exact' })
      .eq('university_id', id);

    // Filter by status (default to active only for better UX)
    if (status === 'all') {
      // Show all programs
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    } else {
      // Default: show active programs only
      query = query.eq('is_active', true);
    }

    if (search) {
      query = query.or(`name_en.ilike.%${search}%,name_cn.ilike.%${search}%,major.ilike.%${search}%`);
    }

    if (degreeType) {
      query = query.eq('degree_type', degreeType);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: programs, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      programs: programs || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Get university programs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new program for this university
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();

    // Validate required fields
    if (!body.name_en) {
      return NextResponse.json({ error: 'Program name (name_en) is required' }, { status: 400 });
    }

    const programData = {
      university_id: id,
      name_en: body.name_en,
      name_cn: body.name_cn || null,
      degree_type: body.degree_type || body.degree_level || 'Bachelor',
      discipline: body.discipline || body.category || null,
      major: body.major || body.name_en, // Default to program name if major not provided
      teaching_language: body.teaching_language || 'English',
      duration_months: body.duration_months || null,
      duration_description: body.duration_description || null,
      tuition_per_year: body.tuition_per_year || null,
      tuition_currency: body.tuition_currency || 'CNY',
      application_fee: body.application_fee || null,
      accommodation_fee_per_year: body.accommodation_fee_per_year || null,
      scholarship_available: body.scholarship_available ?? false,
      scholarship_details: body.scholarship_details || null,
      entry_requirements: body.entry_requirements || null,
      required_documents: body.required_documents || null,
      intake_months: body.intake_months || null,
      application_deadline_fall: body.application_deadline_fall || null,
      application_deadline_spring: body.application_deadline_spring || null,
      description: body.description || null,
      curriculum: body.curriculum || null,
      career_prospects: body.career_prospects || null,
      is_featured: body.is_featured ?? false,
      is_popular: body.is_popular ?? false,
      is_active: body.is_active ?? true,
      slug: body.slug || null,
      risk_level: body.risk_level || 'Medium',
    };

    const { data: program, error: createError } = await supabase
      .from('programs')
      .insert(programData)
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ program });
  } catch (error) {
    console.error('Create program error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Batch create programs
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { programs } = body;

    if (!Array.isArray(programs) || programs.length === 0) {
      return NextResponse.json({ error: 'No programs provided' }, { status: 400 });
    }

    const programsData = programs.map(p => ({
      university_id: id,
      name_en: p.name_en,
      name_cn: p.name_cn || null,
      degree_type: p.degree_type || p.degree_level || 'Bachelor',
      discipline: p.discipline || p.category || null,
      major: p.major || p.name_en,
      teaching_language: p.teaching_language || 'English',
      duration_months: p.duration_months || null,
      duration_description: p.duration_description || null,
      tuition_per_year: p.tuition_per_year || null,
      tuition_currency: p.tuition_currency || 'CNY',
      application_fee: p.application_fee || null,
      accommodation_fee_per_year: p.accommodation_fee_per_year || null,
      scholarship_available: p.scholarship_available ?? false,
      scholarship_details: p.scholarship_details || null,
      entry_requirements: p.entry_requirements || null,
      required_documents: p.required_documents || null,
      intake_months: p.intake_months || null,
      application_deadline_fall: p.application_deadline_fall || null,
      application_deadline_spring: p.application_deadline_spring || null,
      description: p.description || null,
      curriculum: p.curriculum || null,
      career_prospects: p.career_prospects || null,
      is_featured: p.is_featured ?? false,
      is_popular: p.is_popular ?? false,
      is_active: p.is_active ?? true,
      slug: p.slug || null,
      risk_level: p.risk_level || 'Medium',
    }));

    const { data: createdPrograms, error: createError } = await supabase
      .from('programs')
      .insert(programsData)
      .select();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      programs: createdPrograms,
      count: createdPrograms?.length || 0 
    });
  } catch (error) {
    console.error('Batch create programs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
