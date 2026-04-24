/**
 * Execute raw SQL queries against Supabase
 * This is a workaround for PostgREST schema cache issues
 */

const SUPABASE_URL = process.env.COZE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

interface SqlResult<T = unknown> {
  data: T[] | null;
  error: string | null;
}

/**
 * Execute a SQL query directly against Supabase using the SQL endpoint
 * This bypasses PostgREST schema cache issues
 */
export async function executeSql<T = unknown>(
  query: string
): Promise<SqlResult<T>> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { data: null, error: 'Supabase credentials not configured' };
  }

  try {
    // Use the SQL execution endpoint
    const response = await fetch(`${SUPABASE_URL}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SQL execution error:', error);
      return { data: null, error };
    }

    const data = await response.json();
    return { data: data as T[], error: null };
  } catch (error) {
    console.error('SQL execution error:', error);
    return { data: null, error: String(error) };
  }
}
