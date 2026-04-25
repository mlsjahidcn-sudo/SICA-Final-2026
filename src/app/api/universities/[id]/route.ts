import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { HeaderUtils } from 'coze-coding-dev-sdk';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('=== University Detail API called for ID:', id);
    
    // Extract headers for forwarding
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    
    // Initialize Supabase client
    const client = getSupabaseClient();
    console.log('Supabase client created');

    // Fetch university by ID
    console.log('Querying university with ID:', id);
    
    const { data, error } = await client
      .from('universities')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    console.log('Query result - data:', !!data, 'error:', error);

    if (error) {
      console.error('Error fetching university:', error);
      return NextResponse.json(
        { error: 'University not found', details: error.message },
        { status: 404 }
      );
    }

    if (!data) {
      console.log('University not found in database');
      return NextResponse.json(
        { error: 'University not found' },
        { status: 404 }
      );
    }

    console.log('Returning university:', data.name_en);
    return NextResponse.json({ university: data });
  } catch (error) {
    console.error('Error in university detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
