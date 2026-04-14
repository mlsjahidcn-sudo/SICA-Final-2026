import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET - List all universities (admin view, includes inactive)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;
    const search = searchParams.get('search');
    const isActive = searchParams.get('is_active');
    const province = searchParams.get('province');
    const type = searchParams.get('type');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = supabase
      .from('universities')
      .select('*', { count: 'exact' });

    // Apply sorting
    const validSortFields = ['created_at', 'ranking_national', 'name_en'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc';
    
    // For ranking, we need to handle nulls (put them at the end)
    if (validSortBy === 'ranking_national') {
      query = query.order('ranking_national', { ascending: validSortOrder === 'asc', nullsFirst: false });
    } else {
      query = query.order(validSortBy, { ascending: validSortOrder === 'asc' });
    }
    
    query = query.range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name_en.ilike.%${search}%,name_cn.ilike.%${search}%`);
    }

    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }

    if (province && province !== 'all') {
      query = query.eq('province', province);
    }

    // Type filter (985/211/Double First-Class) - type is an array
    if (type && type !== 'all') {
      query = query.contains('type', [type]);
    }

    const { data: universities, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get stats
    const { count: totalCount } = await supabase
      .from('universities')
      .select('*', { count: 'exact', head: true });

    const { count: activeCount } = await supabase
      .from('universities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: scholarshipCount } = await supabase
      .from('universities')
      .select('*', { count: 'exact', head: true })
      .eq('scholarship_available', true);

    const { count: programsCount } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true });

    // Get program counts for each university
    const universityIds = universities?.map(u => u.id) || [];
    const { data: programCounts } = await supabase
      .from('programs')
      .select('university_id')
      .in('university_id', universityIds);

    // Count programs per university
    const programCountMap: Record<string, number> = {};
    (programCounts || []).forEach(p => {
      programCountMap[p.university_id] = (programCountMap[p.university_id] || 0) + 1;
    });

    // Transform universities to include program count
    const transformedUniversities = universities?.map(uni => ({
      ...uni,
      _count: {
        programs: programCountMap[uni.id] || 0
      }
    })) || [];

    return NextResponse.json({
      universities: transformedUniversities,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      stats: {
        total: totalCount || 0,
        active: activeCount || 0,
        withScholarship: scholarshipCount || 0,
        totalPrograms: programsCount || 0
      }
    });
  } catch (error) {
    console.error('Get universities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new university
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();

    // Validate required fields
    if (!body.name_en || !body.province || !body.city || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name_en, province, city, type' },
        { status: 400 }
      );
    }

    // Create university - only use columns that exist in external database
    const { data: university, error: createError } = await supabase
      .from('universities')
      .insert({
        name_en: body.name_en,
        name_cn: body.name_cn || null,
        short_name: body.short_name || null,
        slug: body.slug || null,
        logo_url: body.logo_url || null,
        cover_image_url: body.cover_image_url || null,
        province: body.province,
        city: body.city,
        country: body.country || 'China',
        type: body.type && Array.isArray(body.type) && body.type.length > 0 
          ? body.type 
          : ['Provincial'],
        category: body.category || null,
        tier: body.tier || null,
        website: body.website || body.website_url || null,
        ranking_national: body.ranking_national || null,
        ranking_international: body.ranking_international || body.ranking_world || null,
        founded_year: body.founded_year || body.established_year || null,
        student_count: body.student_count || null,
        international_student_count: body.international_student_count || null,
        faculty_count: body.faculty_count || null,
        teaching_languages: body.teaching_languages || null,
        // Descriptions (bilingual)
        description: body.description || null,
        description_en: body.description_en || null,
        description_cn: body.description_cn || null,
        // Facilities (bilingual)
        facilities: body.facilities || null,
        facilities_en: body.facilities_en || null,
        facilities_cn: body.facilities_cn || null,
        // Accommodation (bilingual)
        accommodation_info: body.accommodation_info || null,
        accommodation_info_en: body.accommodation_info_en || null,
        accommodation_info_cn: body.accommodation_info_cn || null,
        // Address (bilingual)
        address: body.address || null,
        address_en: body.address_en || null,
        address_cn: body.address_cn || null,
        // Location
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        // Tuition
        tuition_min: body.tuition_min || null,
        tuition_max: body.tuition_max || null,
        tuition_currency: body.tuition_currency || 'CNY',
        // Scholarship
        scholarship_available: body.scholarship_available || false,
        scholarship_percentage: body.scholarship_percentage || null,
        scholarship_info: body.scholarship_info || null,
        scholarship_info_cn: body.scholarship_info_cn || null,
        // Admissions
        application_deadline: body.application_deadline || null,
        intake_months: body.intake_months || null,
        csca_required: body.csca_required || false,
        has_application_fee: body.has_application_fee || false,
        acceptance_flexibility: body.acceptance_flexibility || null,
        // Contact
        contact_email: body.contact_email || null,
        contact_phone: body.contact_phone || null,
        // SEO
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
        meta_keywords: body.meta_keywords || null,
        // Status
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ university });
  } catch (error) {
    console.error('Create university error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
