import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/admin/programs - List all programs (admin)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const universityId = searchParams.get('university_id') || '';
    const degreeType = searchParams.get('degree_level') || searchParams.get('degree_type') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const teachingLanguage = searchParams.get('teaching_language') || '';
    const scholarship = searchParams.get('scholarship') || '';
    const featured = searchParams.get('featured') || '';
    
    const offset = (page - 1) * limit;

    // Build query using existing schema
    let query = supabase
      .from('programs')
      .select(`
        id,
        name,
        name_fr,
        code,
        degree_level,
        category,
        sub_category,
        duration_years,
        tuition_fee_per_year,
        currency,
        language,
        is_active,
        description,
        description_en,
        description_cn,
        scholarship_types,
        universities (
          id,
          name_en,
          name_cn,
          city,
          province
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,name_fr.ilike.%${search}%,code.ilike.%${search}%`);
    }

    if (universityId) {
      query = query.eq('university_id', universityId);
    }

    if (degreeType) {
      query = query.eq('degree_level', degreeType);
    }

    if (status) {
      query = query.eq('is_active', status === 'active');
    }

    if (category) {
      query = query.eq('discipline', category);
    }

    if (teachingLanguage) {
      query = query.ilike('teaching_language', `%${teachingLanguage}%`);
    }

    if (scholarship) {
      // Check if scholarship_types is not null or empty
      if (scholarship === 'yes') {
        query = query.not('scholarship_types', 'is', null);
      } else {
        query = query.is('scholarship_types', null);
      }
    }

    // Note: featured filter removed as is_featured column doesn't exist in schema

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: programs, error, count } = await query;

    if (error) {
      console.error('Error fetching programs:', error);
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
    }

    // Get stats for overview
    const [totalResult, activeResult, scholarshipResult] = await Promise.all([
      supabase.from('programs').select('id', { count: 'exact', head: true }),
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('programs').select('id', { count: 'exact', head: true }).not('scholarship_types', 'is', null),
    ]);

    const stats = {
      total: totalResult.count || 0,
      active: activeResult.count || 0,
      featured: 0, // Column doesn't exist
      withScholarship: scholarshipResult.count || 0,
      archived: (totalResult.count || 0) - (activeResult.count || 0),
    };

    // Transform to match frontend expectations
    const transformedPrograms = (programs || []).map(p => ({
      ...p,
      scholarship_available: p.scholarship_types && Object.keys(p.scholarship_types).length > 0,
      status: p.is_active ? 'active' : 'inactive',
      view_count: 0, // Column doesn't exist
      universities: p.universities
    }));

    return NextResponse.json({
      programs: transformedPrograms,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      stats,
    });
  } catch (error) {
    console.error('Error in programs GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/programs - Create a new program (admin)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      university_id,
      name,
      name_fr,
      description,
      description_en,
      description_cn,
      degree_level,
      category,
      discipline,
      sub_category,
      major,
      duration_years,
      duration_months,
      start_month,
      language,
      teaching_language,
      language_requirement,
      entrance_exam_required,
      tuition_fee_per_year,
      tuition_per_year,
      tuition_currency,
      currency,
      scholarship_available,
      scholarship_types,
      scholarship_details,
      application_fee,
      application_documents,
      application_requirements,
      capacity,
      is_active,
      tags,
      code,
    } = body;

    // Validate required fields
    if (!university_id || !name) {
      return NextResponse.json(
        { error: 'University and program name are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Map to actual schema columns
    const programData = {
      university_id,
      name,
      name_fr: name_fr || null,
      code: code || null,
      description: description || description_en || null,
      description_en: description_en || description || null,
      description_cn: description_cn || null,
      degree_level: degree_level || null,
      category: category || discipline || null,
      sub_category: sub_category || major || null,
      language: language || teaching_language || 'Chinese',
      duration_years: duration_years || null,
      tuition_fee_per_year: tuition_fee_per_year || tuition_per_year || null,
      currency: currency || tuition_currency || 'CNY',
      scholarship_types: scholarship_types || null,
      scholarship_available: scholarship_available || false,
      application_fee: application_fee || null,
      is_active: is_active !== undefined ? is_active : true,
      tags: tags || null,
    };

    const { data: program, error } = await supabase
      .from('programs')
      .insert(programData)
      .select(`
        id,
        name,
        name_fr,
        code,
        degree_level,
        category,
        sub_category,
        language,
        duration_years,
        tuition_fee_per_year,
        currency,
        scholarship_available,
        is_active,
        universities (
          id,
          name_en,
          name_cn,
          city,
          province
        )
      `)
      .single();

    if (error) {
      console.error('Error creating program:', error);
      return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
    }

    return NextResponse.json({ 
      program: {
        ...program,
        status: program.is_active ? 'active' : 'inactive'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error in programs POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
