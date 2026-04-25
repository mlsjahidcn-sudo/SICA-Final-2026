import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// POST /api/leads - Create a new lead (PUBLIC - no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      whatsapp_number,
      nationality,
      degree_level,
      major_interest,
      preferred_language,
      budget_range,
      preferred_programs,
      preferred_universities,
      source,
      chat_session_id,
    } = body;

    // Validate required fields
    if (!name || !email || !whatsapp_number || !degree_level || !major_interest) {
      return NextResponse.json(
        { error: 'Name, email, WhatsApp number, degree level, and major interest are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate WhatsApp number (basic international format)
    const phoneRegex = /^\+?[\d\s-]{7,15}$/;
    if (!phoneRegex.test(whatsapp_number.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Invalid WhatsApp number format' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Build insert data with both old and new schema columns for compatibility
    const insertData: Record<string, unknown> = {
      // Old schema columns (for backward compatibility)
      first_name: name,
      last_name: '',
      phone: whatsapp_number,
      email,
      nationality: nationality || null,
      desired_program: major_interest,
      source: source || 'chat',
      status: 'new',
      type: 'b2c',
      // New schema columns
      name,
      whatsapp_number,
      degree_level,
      major_interest,
      preferred_language: preferred_language || null,
      budget_range: budget_range || null,
      preferred_programs: preferred_programs?.length ? preferred_programs : null,
      preferred_universities: preferred_universities?.length ? preferred_universities : null,
      chat_session_id: chat_session_id || null,
    };

    // Check for duplicate lead (same email within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(1);

    if (existingLead && existingLead.length > 0) {
      // Update existing lead instead of creating duplicate
      const { data: updated, error: updateError } = await supabase
        .from('leads')
        .update({
          first_name: name,
          phone: whatsapp_number,
          whatsapp_number,
          nationality: nationality || null,
          preferred_language: preferred_language || null,
          budget_range: budget_range || null,
          desired_program: major_interest,
          degree_level,
          major_interest,
          name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead[0].id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating lead:', JSON.stringify(updateError));
        return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
      }

      return NextResponse.json({ lead: updated, updated: true });
    }

    // Create new lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', JSON.stringify(error));
      return NextResponse.json({ error: 'Failed to create lead', details: error.message || String(error) }, { status: 500 });
    }

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('Error in leads POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/leads - List leads (admin/partner only)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || (user.role !== 'admin' && user.role !== 'partner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = getSupabaseClient();

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (source) query = query.eq('source', source);
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    return NextResponse.json({
      leads,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in leads GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
