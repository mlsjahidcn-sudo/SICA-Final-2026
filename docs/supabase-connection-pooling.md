# ============================================
# Supabase Connection Pooling Configuration
# ============================================
#
# This document describes the recommended connection pooling
# configuration for optimal performance in production.
#
# ============================================

# Why Connection Pooling?

When using Supabase in serverless or high-traffic environments,
connection pooling helps:
- Reduce connection overhead
- Handle more concurrent requests
- Prevent database connection exhaustion
- Improve response times

# ============================================

## Option 1: Supabase Connection Pooling (Recommended)

Enable connection pooling in Supabase Dashboard:

1. Go to: Supabase Dashboard → Your Project → Settings → Database
2. Scroll to "Connection Pooling"
3. Enable it with these settings:

   Mode: Transaction
   Max Connections: 15-20 (adjust based on your plan)
   Pool Size: 15

4. Update your connection string to use the pooler:

   # Instead of:
   DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres

   # Use:
   DATABASE_URL=postgresql://postgres:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres

Note: Port 6543 for connection pooling (not 5432)

# ============================================

## Option 2: Application-Level Pooling

Add this to your Supabase client configuration:

```typescript
// In src/storage/database/supabase-client.ts

const client = createClient(url, key, {
  db: {
    pooler: {
      max: 10,              // Max connections in pool
      idle_timeout: 20,      // Close idle connections after 20s
      connect_timeout: 10,   // Connection timeout in seconds
    },
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

# ============================================

## Current Implementation

✅ Already implemented:
- Server-side client singleton pattern (reuses connections)
- Query timeouts (5-10 seconds)
- Separate user-scoped clients for authenticated requests

⏳ To be implemented:
- Supabase-level connection pooling (requires dashboard config)
- Connection pool size monitoring
- Automatic scaling based on load

# ============================================

## Monitoring Connections

Check active connections in Supabase Dashboard:
- Dashboard → Database → Reports → Database Size & Connections

Or query directly:
```sql
SELECT count(*) FROM pg_stat_activity;
```

Warning signs:
- Consistently high connection count (>80% of max)
- Slow query times
- Connection timeout errors

# ============================================

## Best Practices

1. **Serverless Functions**: Use connection pooling always
2. **Traditional Servers**: Connection pooling recommended for >10 concurrent requests
3. **Development**: Can skip pooling for simplicity
4. **Testing**: Use separate test database to avoid connection conflicts

# ============================================

## Production Checklist

- [ ] Enable connection pooling in Supabase Dashboard
- [ ] Update DATABASE_URL to use pooler endpoint
- [ ] Test connection with new endpoint
- [ ] Monitor connection count for 24-48 hours
- [ ] Adjust max connections if needed
- [ ] Set up alerts for connection exhaustion

# ============================================

## Troubleshooting

**Problem**: "Sorry, too many clients already"
**Solution**: Enable connection pooling or reduce max_connections

**Problem**: Connection pooling not working
**Solution**: Ensure you're using port 6543, not 5432

**Problem**: Slow queries after enabling pooling
**Solution**: Reduce pool size or check for long-running transactions

# ============================================

For more information:
https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
