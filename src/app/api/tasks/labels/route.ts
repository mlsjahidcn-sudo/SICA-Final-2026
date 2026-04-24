import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// GET /api/tasks/labels - Get all task labels
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('task_labels')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching labels:', error);
      return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
    }

    return NextResponse.json({ labels: data || [] });
  } catch (error) {
    console.error('Labels GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tasks/labels - Create a new label
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { name, color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('task_labels')
      .insert({
        name: name.trim(),
        color: color || '#6366f1',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Label with this name already exists' }, { status: 400 });
      }
      console.error('Error creating label:', error);
      return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
    }

    return NextResponse.json({ label: data }, { status: 201 });
  } catch (error) {
    console.error('Label POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
