/**
 * Standalone token management utility.
 * Can be used outside React component context (unlike useAuth().getAccessToken).
 * 
 * - Checks token expiry before returning
 * - Auto-refreshes via /api/auth/refresh when expired
 * - Deduplicates concurrent refresh calls
 */

const TOKEN_KEY = 'sica_auth_token';
const REFRESH_TOKEN_KEY = 'sica_refresh_token';
const EXPIRES_AT_KEY = 'sica_token_expires_at';

/** Refresh 5 minutes before expiry */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        clearTokens();
        return null;
      }

      const data = await response.json();
      const session = data.session;

      localStorage.setItem(TOKEN_KEY, session.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
      localStorage.setItem(EXPIRES_AT_KEY, String(session.expires_at));

      return session.access_token;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem('sica_user_data');
}

/**
 * Get a valid access token, refreshing if expired or about to expire.
 * Returns null if not authenticated or refresh fails.
 */
export async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const expiresAtStr = localStorage.getItem(EXPIRES_AT_KEY);
  if (expiresAtStr) {
    const expiresAtMs = parseInt(expiresAtStr, 10) * 1000;
    const now = Date.now();
    if (now >= expiresAtMs - REFRESH_BUFFER_MS) {
      return refreshAccessToken();
    }
  }

  return token;
}

/**
 * Drop-in replacement for `localStorage.getItem('sica_auth_token')`.
 * Returns a valid token (refreshing if needed) or null.
 * 
 * Usage: `const token = await getAuthToken();`
 */
export async function getAuthToken(): Promise<string | null> {
  return getValidToken();
}

/**
 * Fetch wrapper that automatically attaches a valid auth token
 * and retries once on 401 after refreshing the token.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getValidToken();
  
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(input, { ...init, headers });

  // On 401, try refreshing the token and retry once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(input, { ...init, headers: retryHeaders });
    }
  }

  return response;
}
