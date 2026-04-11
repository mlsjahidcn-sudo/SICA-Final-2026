/**
 * Direct SQL execution utilities
 * Bypasses PostgREST schema cache issues
 */

// Execute SQL using the exec_sql tool from the backend
// This function is designed to be called from API routes
export async function execSqlDirect<T = unknown>(sql: string): Promise<{ data: T[] | null; error: string | null }> {
  // This is a server-side only function
  if (typeof window !== 'undefined') {
    return { data: null, error: 'execSqlDirect can only be called on the server' };
  }

  // We'll use fetch to call our internal API that has access to exec_sql
  try {
    const response = await fetch(`${process.env.COZE_PROJECT_DOMAIN_DEFAULT}/api/internal/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || 'internal-secret',
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { data: null, error };
    }

    const result = await response.json();
    return { data: result.data, error: result.error };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}
