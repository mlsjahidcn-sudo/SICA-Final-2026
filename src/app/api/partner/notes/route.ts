import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/partner/notes - Get notes for an application or student
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || (user.role !== 'partner' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('application_id');
    const studentId = searchParams.get('student_id');

    if (!applicationId && !studentId) {
      return NextResponse.json(
        { error: 'Either application_id or student_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    let query = supabase
      .from('partner_notes_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data: notes, error } = await query;

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json({ notes: notes || [] });

  } catch (error) {
    console.error('Error in notes GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/partner/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || (user.role !== 'partner' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { application_id, student_id, content, is_private } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!application_id && !student_id) {
      return NextResponse.json(
        { error: 'Either application_id or student_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: note, error } = await supabase
      .from('partner_notes')
      .insert({
        user_id: user.id,
        application_id: application_id || null,
        student_id: student_id || null,
        content: content.trim(),
        is_private: is_private !== false, // Default to true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    // Fetch with author info
    const { data: noteWithAuthor } = await supabase
      .from('partner_notes_details')
      .select('*')
      .eq('id', note.id)
      .single();

    return NextResponse.json({ note: noteWithAuthor || note });

  } catch (error) {
    console.error('Error in notes POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
