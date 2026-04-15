import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// GET - Get single university by ID (admin view)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const supabase = getSupabaseClient();

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
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const supabase = getSupabaseClient();

    const body = await request.json();
    console.log('[PUT University] Request body keys:', Object.keys(body));

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only allow fields that exist in the external database
    const allowedFields = [
      // Basic Info
      'name_en', 'name_cn', 'short_name', 'slug', 'established_year', 'founded_year',
      'website_url', 'website', 'logo_url', 'cover_image_url', 'og_image', 'image_url',
      // Location
      'province', 'city', 'country', 'location', 'address', 'address_en', 'address_cn',
      'latitude', 'longitude',
      // Classification
      'type', 'category', 'tier',
      // Rankings
      'ranking_national', 'ranking_world', 'ranking_international',
      // Stats
      'is_active', 'student_count', 'international_student_count', 'faculty_count',
      // Description
      'description', 'description_en', 'description_cn',
      // Facilities
      'facilities', 'facilities_en', 'facilities_cn',
      // Accommodation
      'accommodation_available', 'accommodation_info', 'accommodation_info_en', 'accommodation_info_cn',
      // Scholarship
      'scholarship_available', 'scholarship_percentage', 'scholarship_by_degree',
      'scholarship_info', 'scholarship_info_cn',
      // Tuition
      'tuition_min', 'tuition_max', 'tuition_currency',
      'default_tuition_per_year', 'default_tuition_currency', 'use_default_tuition', 'tuition_by_degree',
      // Application
      'has_application_fee', 'application_deadline', 'intake_months',
      'csca_required', 'acceptance_flexibility',
      // Teaching Languages
      'teaching_languages',
      // Contact
      'contact_email', 'contact_phone',
      // Media
      'images', 'video_urls',
      // SEO
      'meta_title', 'meta_description', 'meta_keywords',
      // Tags
      'tags',
      // View count
      'view_count',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Handle date fields - convert empty string to null
        if (field === 'application_deadline' && body[field] === '') {
          updateData[field] = null;
        } else {
          updateData[field] = body[field];
        }
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
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const supabase = getSupabaseClient();

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
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const supabase = getSupabaseClient();

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
