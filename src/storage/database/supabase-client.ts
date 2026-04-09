import { createClient, SupabaseClient } from '@supabase/supabase-js';

let envLoaded = false;

// External Supabase configuration - MUST use external database
const EXTERNAL_SUPABASE_URL = 'https://maqzxlcsgfpwnfyleoga.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4';
const EXTERNAL_SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY';

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  // Force external Supabase - use hardcoded external values
  process.env.COZE_SUPABASE_URL = EXTERNAL_SUPABASE_URL;
  process.env.COZE_SUPABASE_ANON_KEY = EXTERNAL_SUPABASE_ANON_KEY;
  process.env.COZE_SUPABASE_SERVICE_ROLE_KEY = EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;
  envLoaded = true;
}

function getSupabaseCredentials(): SupabaseCredentials {
  loadEnv();

  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;

  // During build time, return empty credentials to prevent build failures
  // API routes will fail at runtime if credentials are missing
  const isBuildTime = process.env.NODE_ENV === 'production' && typeof window === 'undefined' && !process.env.COZE_SUPABASE_URL;
  
  if (isBuildTime) {
    console.warn('⚠️ Build time: Using placeholder Supabase credentials');
    return { url: 'https://placeholder.supabase.co', anonKey: 'placeholder-key' };
  }

  if (!url) {
    throw new Error('❌ COZE_SUPABASE_URL is not set. MUST use external Supabase database at ' + EXTERNAL_SUPABASE_URL);
  }
  if (!anonKey) {
    throw new Error('❌ COZE_SUPABASE_ANON_KEY is not set. Required for external Supabase connection.');
  }

  // Validate that we're using the correct external Supabase
  if (!url.includes('maqzxlcsgfpwnfyleoga')) {
    console.warn('⚠️ WARNING: Using non-standard Supabase project:', url);
    console.warn('⚠️ Expected external Supabase:', EXTERNAL_SUPABASE_URL);
  }

  console.log('✅ Using external Supabase database:', url);

  return { url, anonKey };
}

function getSupabaseServiceRoleKey(): string | undefined {
  loadEnv();
  const serviceRoleKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.warn('⚠️ COZE_SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations may fail.');
  }
  
  return serviceRoleKey;
}

function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();

  let key: string;
  if (token) {
    key = anonKey;
  } else {
    const serviceRoleKey = getSupabaseServiceRoleKey();
    key = serviceRoleKey ?? anonKey;
  }

  if (token) {
    return createClient(url, key, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      db: {
        timeout: 60000,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient(url, key, {
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { loadEnv, getSupabaseCredentials, getSupabaseServiceRoleKey, getSupabaseClient };
