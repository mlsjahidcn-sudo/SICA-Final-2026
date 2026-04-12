import { z } from 'zod';

// ============================================
// Environment Variable Schema
// ============================================

const envSchema = z.object({
  // Supabase (Required)
  COZE_SUPABASE_URL: z.string()
    .url('COZE_SUPABASE_URL must be a valid URL')
    .refine(
      (url) => url.includes('.supabase.co'),
      'COZE_SUPABASE_URL must be a Supabase URL (e.g., https://your-project.supabase.co)'
    ),
  COZE_SUPABASE_ANON_KEY: z.string()
    .min(1, 'COZE_SUPABASE_ANON_KEY is required')
    .refine(
      (key) => key.startsWith('eyJ') || key.startsWith('sb_publishable_'),
      'COZE_SUPABASE_ANON_KEY must be a valid JWT token (eyJ...) or publishable key (sb_publishable_...)'
    ),
  COZE_SUPABASE_SERVICE_ROLE_KEY: z.string()
    .min(1, 'COZE_SUPABASE_SERVICE_ROLE_KEY is required')
    .refine(
      (key) => key.startsWith('eyJ') || key.startsWith('sb_secret_') || key.startsWith('sb_service_') || key === '⚠️ UPDATE_REQUIRED - Get from Supabase Dashboard → Settings → API → service_role',
      'COZE_SUPABASE_SERVICE_ROLE_KEY must be a valid service role key'
    )
    .optional(),
  DATABASE_URL: z.string()
    .startsWith('postgresql://', 'DATABASE_URL must be a valid PostgreSQL connection string')
    .optional(),

  // LLM Configuration (Optional)
  MOONSHOT_API_KEY: z.string().optional(),
  MOONSHOT_BASE_URL: z.string().url().optional(),
  MOONSHOT_MODEL: z.string().optional(),

  // Email Configuration (Optional)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  ADMIN_EMAIL: z.string().email().optional(),

  // Application URLs (Optional)
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

// ============================================
// Validation Function
// ============================================

/**
 * Validates environment variables at application startup.
 * Throws an error if required variables are missing or invalid.
 * 
 * @example
 * // In your app entry point (e.g., next.config.ts or server.ts)
 * import { validateEnv } from '@/lib/env-validation';
 * 
 * try {
 *   validateEnv();
 * } catch (error) {
 *   console.error('❌ Invalid environment configuration:', error.message);
 *   process.exit(1);
 * }
 */
export function validateEnv(): z.infer<typeof envSchema> {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((err) => {
        return `  - ${err.path.join('.')}: ${err.message}`;
      });
      throw new Error(
        '❌ Environment variable validation failed:\n' + messages.join('\n')
      );
    }
    throw error;
  }
}

/**
 * Validates only the critical environment variables.
 * Use this for builds where some variables may not be needed.
 */
export function validateCriticalEnv(): {
  COZE_SUPABASE_URL: string;
  COZE_SUPABASE_ANON_KEY: string;
} {
  const criticalSchema = z.object({
    COZE_SUPABASE_URL: z.string().url(),
    COZE_SUPABASE_ANON_KEY: z.string().min(1),
  });

  try {
    return criticalSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((err) => {
        return `  - ${err.path.join('.')}: ${err.message}`;
      });
      throw new Error(
        '❌ Critical environment variables missing:\n' + messages.join('\n')
      );
    }
    throw error;
  }
}

/**
 * Checks if running in a build environment.
 * Returns true during Next.js build process.
 */
export function isBuildEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    typeof window === 'undefined' &&
    !process.env.COZE_SUPABASE_URL
  );
}

/**
 * Logs environment configuration status (safe for development).
 */
export function logEnvStatus(): void {
  if (process.env.NODE_ENV === 'production') return;

  console.log('\n📋 Environment Configuration:');
  console.log('  Database:', process.env.COZE_SUPABASE_URL ? '✅ Configured' : '❌ Missing');
  console.log('  Service Role:', process.env.COZE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '⚠️ Missing');
  console.log('  Email:', process.env.RESEND_API_KEY ? '✅ Configured' : '⚠️ Missing');
  console.log('  LLM:', process.env.MOONSHOT_API_KEY ? '✅ Configured' : '⚠️ Missing');
  console.log('');
}
