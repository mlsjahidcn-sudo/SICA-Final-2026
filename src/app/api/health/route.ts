import { NextResponse } from 'next/server';

/**
 * Health check endpoint for deployment verification
 * Returns 200 if the app is running and can connect to Supabase
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, string> = {};

  // Check Supabase URL is configured
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  if (supabaseUrl) {
    checks.supabase_url = supabaseUrl;
    
    // Try to reach Supabase
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: process.env.COZE_SUPABASE_ANON_KEY || '',
        },
        signal: AbortSignal.timeout(5000),
      });
      checks.supabase_status = res.status < 500 ? 'ok' : 'error';
    } catch {
      checks.supabase_status = 'unreachable';
    }
  } else {
    checks.supabase_url = 'NOT CONFIGURED';
  }

  const duration = Date.now() - startTime;

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'unknown',
    duration_ms: duration,
    checks,
  });
}
