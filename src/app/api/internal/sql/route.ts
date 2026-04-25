import { NextRequest, NextResponse } from 'next/server';

// Internal API to execute SQL against external Supabase
// Uses exec_sql tool which is configured to connect to maqzxlcsgfpwnfyleoga.supabase.co

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, params } = body;

    if (!sql) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 });
    }

    // Call exec_sql which routes to the correct external Supabase
    const response = await fetch('https://maqzxlcsgfpwnfyleoga.supabase.co/rest/v1/rpc/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''}`,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error('SQL execution error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
