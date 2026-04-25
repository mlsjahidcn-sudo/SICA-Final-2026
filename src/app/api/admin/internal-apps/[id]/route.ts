import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/admin/internal-apps/[id] - Get single internal application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data: application, error } = await supabase
      .from('internal_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ data: application });
  } catch (error) {
    console.error('Internal app GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/internal-apps/[id] - Update internal application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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
      portal_username,
      portal_password,
      partner,
      note,
      application_date,
      follow_up_date,
      comments
    } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (student_name !== undefined) updateData.student_name = student_name;
    if (passport !== undefined) updateData.passport = passport;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (degree !== undefined) updateData.degree = degree;
    if (major !== undefined) updateData.major = major;
    if (university_choice !== undefined) updateData.university_choice = university_choice;
    if (overview !== undefined) updateData.overview = overview;
    if (missing_docs !== undefined) updateData.missing_docs = missing_docs;
    if (remarks_for_university !== undefined) updateData.remarks_for_university = remarks_for_university;
    if (status !== undefined) updateData.status = status;
    if (user_id !== undefined) updateData.user_id = user_id;
    if (email !== undefined) updateData.email = email;
    if (portal_link !== undefined) updateData.portal_link = portal_link;
    if (portal_username !== undefined) updateData.portal_username = portal_username;
    if (portal_password !== undefined) updateData.portal_password = portal_password;
    if (partner !== undefined) updateData.partner = partner;
    if (note !== undefined) updateData.note = note;
    if (application_date !== undefined) updateData.application_date = application_date || null;
    if (follow_up_date !== undefined) updateData.follow_up_date = follow_up_date || null;
    if (comments !== undefined) updateData.comments = comments;

    const { data, error } = await supabase
      .from('internal_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating internal application:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ data, message: 'Application updated successfully' });
  } catch (error) {
    console.error('Internal app PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/internal-apps/[id] - Delete internal application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('internal_applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting internal application:', error);
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Internal app DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
