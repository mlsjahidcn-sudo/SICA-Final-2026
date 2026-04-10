import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - Get single university by ID (admin view)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('[GET University] ID:', id, 'Token exists:', !!token);

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

    console.log('[GET University] Auth result:', { userId: authUser?.id, authError: authError?.message });

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Use service role key client for database operations (bypasses RLS)
    const supabase = getSupabaseClient();
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    console.log('[GET University] Profile result:', { role: profile?.role, error: profileError?.message });

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { data: university, error } = await supabase
      .from('universities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'University not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ university });
  } catch (error) {
    console.error('Get university error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update university
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('[PUT University] ID:', id, 'Token exists:', !!token);

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

    console.log('[PUT University] Auth result:', { userId: authUser?.id, authError: authError?.message });

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Use service role key client for database operations (bypasses RLS)
    const supabase = getSupabaseClient();
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    console.log('[PUT University] Profile result:', { role: profile?.role, error: profileError?.message });

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('[PUT University] Request body keys:', Object.keys(body));

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only allow fields that exist in the external database
    const allowedFields = [
      // Basic Info
      'name_en', 'name_cn', 'short_name', 'slug', 'established_year',
      'website_url', 'logo_url', 'cover_image_url', 'og_image', 'image_url',
      // Location
      'province', 'city', 'country', 'location',
      // Classification
      'type', 'category', 'tier',
      // Rankings
      'ranking_national', 'ranking_world',
      // Stats
      'is_active',
      // Description
      'description',
      // Facilities
      'facilities',
      // Accommodation
      'accommodation_available',
      // Scholarship
      'scholarship_available', 'scholarship_percentage', 'scholarship_by_degree',
      // Tuition
      'tuition_min', 'tuition_max', 'tuition_currency',
      'default_tuition_per_year', 'default_tuition_currency', 'use_default_tuition', 'tuition_by_degree',
      // Application
      'has_application_fee', 'application_deadline', 'intake_months',
      'csca_required', 'acceptance_flexibility',
      // Media
      'images', 'video_urls',
      // SEO
      'meta_title', 'meta_description', 'meta_keywords',
      // Tags
      'tags',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    console.log('[PUT University] Update data keys:', Object.keys(updateData));

    const { data: university, error: updateError } = await supabase
      .from('universities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log('[PUT University] Update result:', { 
      success: !updateError, 
      error: updateError?.message,
      universityId: university?.id 
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ university });
  } catch (error) {
    console.error('Update university error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle university active status (activate/deactivate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { is_active } = body;

    const { data: university, error: updateError } = await supabase
      .from('universities')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ university });
  } catch (error) {
    console.error('Toggle university active error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Permanently delete university
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient(token);

    // Verify admin role
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

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

    // Permanently delete from database
    const { error: deleteError } = await supabase
      .from('universities')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'University permanently deleted' });
  } catch (error) {
    console.error('Delete university error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
