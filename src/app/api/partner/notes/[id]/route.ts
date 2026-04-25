import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/partner/notes/[id] - Get note details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || (user.role !== 'partner' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data: note, error } = await supabase
      .from('partner_notes_details')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ note });

  } catch (error) {
    console.error('Error in note GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/partner/notes/[id] - Update note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || (user.role !== 'partner' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    // Check if note exists and belongs to user (or user is admin)
    const { data: existing } = await supabase
      .from('partner_notes')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Only author or admin can update
    if (existing.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to update this note' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.content !== undefined) {
      if (!body.content.trim()) {
        return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
      }
      updateData.content = body.content.trim();
    }
    if (body.is_private !== undefined) {
      updateData.is_private = body.is_private;
    }

    const { data: note, error } = await supabase
      .from('partner_notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }

    // Fetch with author info
    const { data: noteWithAuthor } = await supabase
      .from('partner_notes_details')
      .select('*')
      .eq('id', id)
      .single();

    return NextResponse.json({ note: noteWithAuthor || note });

  } catch (error) {
    console.error('Error in note PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/partner/notes/[id] - Delete note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || (user.role !== 'partner' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Check if note exists and belongs to user (or user is admin)
    const { data: existing } = await supabase
      .from('partner_notes')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Only author or admin can delete
    if (existing.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to delete this note' }, { status: 403 });
    }

    const { error } = await supabase
      .from('partner_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Note deleted' });

  } catch (error) {
    console.error('Error in note DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
