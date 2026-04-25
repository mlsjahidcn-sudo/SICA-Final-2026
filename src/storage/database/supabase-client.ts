import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Custom Fetch with Extended Timeout
// ============================================

/**
 * Custom fetch wrapper with extended timeout for slow network connections
 * (VPN, proxy, etc.)
 */
function createTimeoutFetch(timeoutMs: number = 60000): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

// ============================================
// Environment Variable Validation
// ============================================

interface SupabaseCredentials {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Validates and retrieves Supabase credentials from environment variables.
 * SECURITY: Never hardcode credentials in source code.
 * 
 * Required environment variables:
 * - COZE_SUPABASE_URL: The Supabase project URL
 * - COZE_SUPABASE_ANON_KEY: The anonymous/public key
 * - COZE_SUPABASE_SERVICE_ROLE_KEY: The service role key (for admin operations)
 */
function getSupabaseCredentials(): SupabaseCredentials {
  const url = process.env.COZE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

  // During build time, return placeholder credentials to prevent build failures
  // API routes will fail at runtime if credentials are missing
  const isBuildTime = 
    process.env.NODE_ENV === 'production' && 
    typeof window === 'undefined' && 
    !url;

  if (isBuildTime) {
    console.warn('⚠️ Build time: Using placeholder Supabase credentials');
    return { 
      url: 'https://placeholder.supabase.co', 
      anonKey: 'placeholder-key',
      serviceRoleKey: 'placeholder-service-key'
    };
  }

  // Validate required credentials
  if (!url) {
    throw new Error(
      '❌ COZE_SUPABASE_URL is not set. Please add it to your .env.local file.\n' +
      'Example: COZE_SUPABASE_URL=https://your-project.supabase.co'
    );
  }

  if (!anonKey) {
    throw new Error(
      '❌ COZE_SUPABASE_ANON_KEY is not set. Please add it to your .env.local file.\n' +
      'Get it from: Supabase Dashboard → Settings → API → anon public key'
    );
  }

  // Warn if service role key is missing (needed for admin operations)
  if (!serviceRoleKey) {
    console.warn('⚠️ COZE_SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will fail.');
    console.warn('⚠️ Get it from: Supabase Dashboard → Settings → API → service_role key');
  }

  // Validate URL format
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    console.warn('⚠️ COZE_SUPABASE_URL should be in format: https://your-project.supabase.co');
  }

  // Log successful configuration (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Supabase configured:', url);
  }

  return { url, anonKey, serviceRoleKey };
}

// ============================================
// Server-Side Client Singleton
// ============================================

/**
 * Singleton instance for server-side operations (no user token).
 * Reuses connection for better performance.
 * 
 * IMPORTANT: Only use for server-side operations. 
 * For user-specific requests, use getSupabaseClient(token).
 */
let serverClient: SupabaseClient | null = null;

/**
 * Creates or returns a Supabase client instance.
 * 
 * @param token - Optional user JWT token. If provided, creates a user-scoped client.
 *               If not provided, uses service role key for admin operations.
 * 
 * @returns SupabaseClient instance
 * 
 * @example
 * // Admin operations (bypasses RLS)
 * const adminClient = getSupabaseClient();
 * 
 * // User operations (respects RLS)
 * const userClient = getSupabaseClient(userToken);
 */
function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey, serviceRoleKey } = getSupabaseCredentials();

  // User-scoped client: always create new instance with user's token
  if (token) {
    return createClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
        fetch: createTimeoutFetch(60000),
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Server-side client: use singleton for connection reuse
  if (serverClient) {
    return serverClient;
  }

  // Use service role key for admin operations (bypasses RLS)
  const key = serviceRoleKey ?? anonKey;

  serverClient = createClient(url, key, {
    global: {
      fetch: createTimeoutFetch(60000),
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}

/**
 * Clears the server-side client singleton.
 * Useful for testing or when credentials change.
 */
export function clearSupabaseClient(): void {
  serverClient = null;
}

// ============================================
// Exports
// ============================================

export { getSupabaseCredentials, getSupabaseClient };
