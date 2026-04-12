import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/chat/lead - Capture lead from chat widget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from('chat_leads')
      .select('id')
      .eq('email', email)
      .single();

    if (existingLead) {
      // Update existing lead
      await supabase
        .from('chat_leads')
        .update({
          name: name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id);

      return NextResponse.json({ success: true, message: 'Lead updated' });
    }

    // Create new lead
    const { error } = await supabase
      .from('chat_leads')
      .insert({
        email,
        name: name || null,
        source: 'chat_widget',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Lead captured' });
  } catch (error) {
    console.error('Error in lead capture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
