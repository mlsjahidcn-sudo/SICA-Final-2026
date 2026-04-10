import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface BulkProgramInput {
  name: string;
  name_fr?: string;
  code?: string;
  degree_level?: string;
  category?: string;
  sub_category?: string;
  duration_years?: number;
  language?: string;
  tuition_fee_per_year?: number;
  currency?: string;
  description?: string;
  description_en?: string;
  description_cn?: string;
  scholarship_types?: Record<string, unknown>;
  capacity?: number;
  tags?: string;
  is_active?: boolean;
}

interface BulkProgramRequest {
  university_id: string;
  programs: BulkProgramInput[];
}

// POST /api/admin/programs/bulk - Bulk create programs
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

    // Use anon key client for auth verification
    const supabaseAuth = getSupabaseClient(token);
    
    // Verify user token
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Use service role key client for database operations (bypasses RLS)
    const supabase = getSupabaseClient();
    
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

    const body: BulkProgramRequest = await request.json();
    const { university_id, programs } = body;

    // Validate
    if (!university_id) {
      return NextResponse.json(
        { error: 'University ID is required' },
        { status: 400 }
      );
    }

    if (!programs || !Array.isArray(programs) || programs.length === 0) {
      return NextResponse.json(
        { error: 'Programs array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (programs.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 programs can be created at once' },
        { status: 400 }
      );
    }

    // Verify university exists
    const { data: university, error: universityError } = await supabase
      .from('universities')
      .select('id, name_en')
      .eq('id', university_id)
      .single();

    if (universityError || !university) {
      return NextResponse.json(
        { error: 'University not found' },
        { status: 404 }
      );
    }

    // Validate each program has required fields
    const invalidPrograms = programs.filter(p => !p.name || p.name.trim() === '');
    if (invalidPrograms.length > 0) {
      return NextResponse.json(
        { error: `Invalid programs found: ${invalidPrograms.length} programs are missing names` },
        { status: 400 }
      );
    }

    // Prepare programs for insertion
    const programsToInsert = programs.map(p => ({
      university_id,
      name: p.name.trim(),
      name_fr: p.name_fr?.trim() || null,
      code: p.code?.trim() || null,
      degree_level: p.degree_level || 'Bachelor',
      category: p.category || null,
      sub_category: p.sub_category || null,
      duration_years: p.duration_years || null,
      language: p.language || 'English',
      tuition_fee_per_year: p.tuition_fee_per_year || null,
      currency: p.currency || 'CNY',
      description: p.description || null,
      description_en: p.description_en || null,
      description_cn: p.description_cn || null,
      scholarship_types: p.scholarship_types || null,
      capacity: p.capacity || null,
      tags: p.tags || null,
      is_active: p.is_active !== false, // default to true
    }));

    // Insert programs
    const { data: insertedPrograms, error: insertError } = await supabase
      .from('programs')
      .insert(programsToInsert)
      .select('id, name, degree_level, language');

    if (insertError) {
      console.error('Error inserting programs:', insertError);
      return NextResponse.json(
        { error: `Failed to create programs: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${insertedPrograms?.length || 0} programs`,
      count: insertedPrograms?.length || 0,
      programs: insertedPrograms,
      university: {
        id: university.id,
        name: university.name_en,
      },
    });
  } catch (error) {
    console.error('Error in bulk programs creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/programs/bulk - Get universities list for dropdown
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Use anon key client for auth verification
    const supabaseAuth = getSupabaseClient(token);
    
    // Verify user token
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Use service role key client for database operations (bypasses RLS)
    const supabase = getSupabaseClient();
    
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

    // Get all active universities
    const { data: universities, error } = await supabase
      .from('universities')
      .select('id, name_en, name_cn, city, province')
      .eq('is_active', true)
      .order('name_en');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch universities' },
        { status: 500 }
      );
    }

    return NextResponse.json({ universities });
  } catch (error) {
    console.error('Error fetching universities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
