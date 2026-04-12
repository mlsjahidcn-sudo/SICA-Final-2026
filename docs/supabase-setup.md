# Supabase Setup Guide

## Quick Start

### 1. Configure Environment Variables

```bash
# Copy the template
cp .env.local.template .env.local

# Edit with your credentials
# ⚠️ NEVER commit .env.local to git!
```

### 2. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `maqzxlcsgfpwnfyleoga`
3. Navigate to: **Settings** → **API**
4. Copy the following:
   - **Project URL** → `COZE_SUPABASE_URL`
   - **anon public** → `COZE_SUPABASE_ANON_KEY`
   - **service_role** → `COZE_SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### 3. Get Database Password

1. In Supabase Dashboard, go to: **Settings** → **Database**
2. Copy the connection string
3. Replace `[YOUR-PASSWORD]` with your database password
4. Set as `DATABASE_URL` in `.env.local`

### 4. Verify Connection

```bash
# Run the integration tests
pnpm test src/tests/integration/supabase.test.ts

# Or start the dev server
pnpm dev
# Look for: ✅ Supabase configured: https://maqzxlcsgfpwnfyleoga.supabase.co
```

---

## Security Best Practices

### ⚠️ CRITICAL: Rotate Exposed Keys

The previous implementation had hardcoded credentials. **You must rotate them now:**

1. Go to Supabase Dashboard → Settings → API
2. Click **Regenerate** for both keys:
   - **anon key** (was exposed, regenerate it)
   - **service_role key** (🔴 CRITICAL - has full admin access)
3. Update `.env.local` with new keys
4. Restart your dev server

### Key Rotation Schedule

- **Recommended**: Every 90 days
- **Required**: After any exposure (like this case)
- **Process**: 
  1. Generate new keys
  2. Update environment variables
  3. Deploy
  4. Revoke old keys after successful deployment

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `COZE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `COZE_SUPABASE_ANON_KEY` | Anonymous/public key | `eyJhbGci...` |
| `COZE_SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) | `eyJhbGci...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Direct Postgres connection | - |
| `MOONSHOT_API_KEY` | LLM API key | - |
| `RESEND_API_KEY` | Email service key | - |
| `NEXT_PUBLIC_APP_URL` | Production URL | `https://sica.edu` |

---

## Architecture

### Server-Side Proxy Pattern

```
┌─────────────────┐
│  Browser        │
│  (React Client) │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Next.js API    │
│  Routes         │
└────────┬────────┘
         │ Service Role
         ▼
┌─────────────────┐
│  Supabase       │
│  (PostgreSQL)   │
└─────────────────┘
```

**Benefits**:
- ✅ Keys never exposed to browser
- ✅ Can use service role key safely
- ✅ Centralized auth validation
- ✅ Rate limiting possible

### Client Types

1. **User-scoped client** (with token):
   ```typescript
   const client = getSupabaseClient(userToken);
   // Respects RLS policies
   ```

2. **Admin client** (no token):
   ```typescript
   const client = getSupabaseClient();
   // Uses service role key, bypasses RLS
   ```

---

## RLS (Row Level Security)

### Known Issue: `users` Table RLS

The `users` table has RLS enabled but causes infinite recursion when queried with anon key.

**Workaround**: Use service role client for user lookups.

```typescript
// ✅ Correct - uses service role, bypasses RLS
const supabase = getSupabaseClient();
const { data } = await supabase.from('users').select('*');

// ❌ Wrong - causes infinite recursion
const supabase = createClient(url, anonKey);
const { data } = await supabase.from('users').select('*');
```

---

## Connection Pooling

See: [docs/supabase-connection-pooling.md](./supabase-connection-pooling.md)

**Quick Setup**:
1. Enable in Supabase Dashboard → Settings → Database → Connection Pooling
2. Mode: **Transaction**
3. Max Connections: **15-20**
4. Update `DATABASE_URL` to use pooler endpoint (port 6543)

---

## Testing

### Run Integration Tests

```bash
# All Supabase tests
pnpm test src/tests/integration/supabase.test.ts

# Watch mode
pnpm test:run src/tests/integration/supabase.test.ts
```

### Test Coverage

- ✅ Connection verification
- ✅ Service role access
- ✅ Data integrity
- ✅ Performance benchmarks
- ✅ Error handling

---

## Monitoring

### Check Database Health

```bash
# Via Supabase CLI
supabase db ping

# Via API
curl -s "https://maqzxlcsgfpwnfyleoga.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY"
```

### Monitor Connections

1. Go to Supabase Dashboard
2. Navigate to **Database** → **Reports**
3. Check **Database Size & Connections**

**Warning Signs**:
- High connection count (>80% of max)
- Slow query times
- Connection timeout errors

---

## Troubleshooting

### Error: "Missing credentials"

```
❌ COZE_SUPABASE_URL is not set
```

**Solution**: Create `.env.local` file with required variables.

### Error: "Invalid JWT"

```
❌ COZE_SUPABASE_ANON_KEY must be a valid JWT token
```

**Solution**: Ensure the key starts with `eyJ` and is from Supabase Dashboard.

### Error: "Infinite recursion"

```
42P17: infinite recursion detected in policy for relation "users"
```

**Solution**: Use service role client (`getSupabaseClient()` without token).

### Error: "Too many connections"

**Solution**: Enable connection pooling (see [connection pooling guide](./supabase-connection-pooling.md)).

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [API Reference](https://supabase.com/docs/reference/javascript/introduction)

---

## Support

For issues specific to this project:
1. Check `SUPABASE_INTEGRATION_ANALYSIS.md` for detailed analysis
2. Run integration tests to diagnose connectivity issues
3. Check Supabase Dashboard for service status
