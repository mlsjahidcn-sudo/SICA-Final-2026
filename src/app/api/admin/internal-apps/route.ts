import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/admin/internal-apps - List all internal applications
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
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const university = searchParams.get('university') || '';
    const partner = searchParams.get('partner') || '';
    
    const offset = (page - 1) * limit;

    let query = supabase
      .from('internal_applications')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (university) {
      query = query.ilike('university_choice', `%${university}%`);
    }

    if (partner) {
      query = query.ilike('partner', `%${partner}%`);
    }

    if (search) {
      query = query.or(`student_name.ilike.%${search}%,passport.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching internal applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({
      data: applications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Internal apps GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/internal-apps - Create a new internal application
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();

    const {
      student_name,
      passport,
      nationality,
      degree,
      major,
      university_choice,
      overview,
      missing_docs,
      remarks_for_university,
      status,
      user_id,
      email,
      portal_link,
      partner,
      note,
      application_date,
      follow_up_date,
      comments
    } = body;

    if (!student_name) {
      return NextResponse.json({ error: 'Student name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('internal_applications')
      .insert({
        student_name,
        passport: passport || null,
        nationality: nationality || null,
        degree: degree || null,
        major: major || null,
        university_choice: university_choice || null,
        overview: overview || null,
        missing_docs: missing_docs || [],
        remarks_for_university: remarks_for_university || null,
        status: status || 'pending',
        user_id: user_id || null,
        email: email || null,
        portal_link: portal_link || null,
        partner: partner || null,
        note: note || null,
        application_date: application_date || null,
        follow_up_date: follow_up_date || null,
        comments: comments || null,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating internal application:', error);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Application created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Internal apps POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
