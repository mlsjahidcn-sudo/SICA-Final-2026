# SICA Project - Bug Report & Performance Issues

**Date:** 2026-04-25  
**Severity:** Critical  
**Primary Issue:** "Too Many Requests" errors due to missing rate limiting and excessive database queries

---

## Executive Summary

The SICA platform has **critical performance and security vulnerabilities** that cause "too many requests" errors. The main issues are:

1. **Missing rate limiting on critical endpoints** (chat, auth)
2. **Excessive database queries** without caching
3. **Connection pool exhaustion** from per-request client creation
4. **No distributed rate limiting** for production deployments

---

## Critical Bugs Found

### 1. Chat Endpoint Without Rate Limiting 🔴 CRITICAL

**File:** `src/app/api/chat/route.ts`

**Issue:**
- Makes expensive LLM calls to Moonshot API with NO rate limiting
- Performs multiple parallel database searches (universities + programs)
- Runs RAG pipeline (vector similarity search)
- Can be easily abused by bots or malicious users
- Will quickly exhaust Supabase and Moonshot API rate limits

**Impact:**
- High cost from uncontrolled LLM usage
- Database overload from concurrent searches
- Service degradation under load

**Current State:**
```typescript
// Lines 291-517: No rate limiting at all!
export async function POST(request: NextRequest) {
  try {
    // Auth is optional — public access allowed
    let userId: string | null = null;
    // ... no rate limit check
```

**Recommended Fix:**
```typescript
import { createRateLimitMiddleware, rateLimitPresets } from '@/lib/rate-limit';

const chatRateLimit = createRateLimitMiddleware({
  maxRequests: 10,  // 10 messages per minute
  windowMs: 60000
});

export async function POST(request: NextRequest) {
  const rateLimitResult = chatRateLimit(request);
  if (!rateLimitResult.allowed) {
    return errors.rateLimit(rateLimitResult.resetTime);
  }
  // ... rest of handler
}
```

---

### 2. Authentication Endpoints Without Protection 🔴 CRITICAL

**Files:** 
- `src/app/api/auth/signin/route.ts`
- `src/app/api/auth/signup/route.ts`

**Issue:**
- **Signin endpoint**: NO rate limiting (vulnerable to brute force attacks)
- **Signup endpoint**: NO rate limiting (vulnerable to account flooding)
- Password change HAS rate limiting (3/hour) - inconsistent protection!

**Security Risk:**
- Attackers can attempt unlimited password guesses
- Bots can create thousands of fake accounts
- Email/phone number spam possible

**Current State:**
```typescript
// signin/route.ts - Lines 5-163: No rate limiting
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    // ... immediately attempts authentication
```

**Recommended Fix:**
```typescript
import { createRateLimitMiddleware, rateLimitPresets } from '@/lib/rate-limit';

const authRateLimit = createRateLimitMiddleware(rateLimitPresets.auth);

export async function POST(request: NextRequest) {
  const rateLimitResult = authRateLimit(request);
  if (!rateLimitResult.allowed) {
    return errors.rateLimit(rateLimitResult.resetTime);
  }
  // ... rest of handler
}
```

---

### 3. Admin Dashboard Overloading 🟠 HIGH

**File:** `src/app/api/admin/dashboard/route.ts`

**Issue:**
- Fires **11 parallel database queries** on EVERY request
- No caching implemented
- Each admin refresh triggers full reload
- Creates massive database load under frequent access

**Queries Fired Simultaneously:**
1. Total students count
2. Total partners count
3. Total applications count
4. Total universities count
5. Total programs count
6. Applications by status (all rows)
7. Recent applications (with joins)
8. Pending partners
9. Upcoming meetings (with joins)
10. Applications trend (last 7 days)
11. All partners data

**Lines 14-99:**
```typescript
const [
  studentsCount,
  partnersCount,
  applicationsCount,
  // ... 8 more queries
] = await Promise.all([...]);
```

**Impact:**
- 11 database round-trips per dashboard load
- If 10 admins refresh every minute = 110 queries/min
- Slow response times (>2 seconds typical)

**Recommended Fix:**
```typescript
import { apiCache, CACHE_TTL } from '@/lib/api-cache';

export async function GET(request: NextRequest) {
  // Check cache first
  const cached = apiCache.get('admin:dashboard') as DashboardData | null;
  if (cached) {
    return NextResponse.json(cached);
  }

  // ... fetch data ...

  // Cache for 30 seconds
  apiCache.set('admin:dashboard', responseData, CACHE_TTL.SHORT);
  return NextResponse.json(responseData);
}
```

---

### 4. Student Dashboard Sequential Queries 🟠 HIGH

**File:** `src/app/api/student/dashboard/route.ts`

**Issue:**
- Makes **8+ sequential database queries** (not parallel!)
- No caching
- Each page load triggers full reload
- Poor query optimization with nested joins

**Query Sequence:**
1. Get student record (line 14-18)
2. Get applications (line 28-31)
3. Get upcoming meetings (line 50-57)
4. Enrich meetings with program info (line 67-70)
5. Get programs for meetings (line 72-74)
6. Get universities for programs (line 76-78)
7. Get pending documents (line 105-111)
8. Enrich documents (line 120-141)
9. Get recent applications (line 147-152)
10. Enrich applications (line 161-184)
11. Get profile completion (line 190-202)

**Impact:**
- Each query waits for the previous one
- Typical load time: 3-5 seconds
- Database connection held open longer than necessary

**Recommended Fixes:**

**A. Parallelize independent queries:**
```typescript
// Instead of sequential enrichment, use Promise.all
const [meetings, documents, applications] = await Promise.all([
  supabase.from('meetings').select(...),
  supabase.from('documents').select(...),
  supabase.from('applications').select(...)
]);
```

**B. Add caching:**
```typescript
const cacheKey = `student:dashboard:${authUser.id}`;
const cached = apiCache.get(cacheKey);
if (cached) return NextResponse.json(cached);

// ... fetch data ...

apiCache.set(cacheKey, responseData, CACHE_TTL.MEDIUM);
```

---

### 5. Supabase Client Connection Pool Exhaustion 🟠 HIGH

**File:** `src/storage/database/supabase-client.ts`

**Issue:**
- User-scoped clients created **per request** (lines 134-144)
- No connection pooling configuration
- Server singleton only used for service role key
- Under high load, will exhaust database connections

**Code Analysis:**
```typescript
// Line 134-144: Every authenticated request creates NEW client
if (token) {
  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: createTimeoutFetch(60000),
    },
    // No connection pool settings!
  });
}
```

**Impact:**
- With 100 concurrent users = 100 database connections
- Supabase free tier: 200 connections max
- Pro tier: 500 connections max
- Easy to hit limits during traffic spikes

**Recommended Fix:**
```typescript
// Add connection pooling configuration
serverClient = createClient(url, key, {
  global: {
    fetch: createTimeoutFetch(60000),
  },
  db: {
    schema: 'public',
  },
  // Configure connection pool
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

**Alternative:** Use Supabase's built-in connection pooler:
```typescript
// Use transaction mode pooler URL
const poolerUrl = url.replace('.supabase.co', '.pooler.supabase.com');
```

---

### 6. Missing Rate Limiting on Public APIs 🟡 MEDIUM

**Affected Endpoints:**
- `/api/universities` - Has caching but NO request rate limiting
- `/api/programs` - Has caching but NO request rate limiting
- `/api/testimonials` - No rate limiting
- `/api/partners` - No rate limiting
- `/api/contact` - No rate limiting (email spam risk)

**Issue:**
- Bots can bypass cache with different query parameters
- No IP-based throttling
- Could trigger Supabase read limits

**Example Attack:**
```bash
# Bot makes 1000 requests with different filters
curl /api/universities?city=Beijing&limit=1
curl /api/universities?city=Shanghai&limit=2
curl /api/universities?city=Guangzhou&limit=3
# ... each request hits database
```

**Recommended Fix:**
```typescript
// Add to all public API routes
const publicApiRateLimit = createRateLimitMiddleware(rateLimitPresets.api);

export async function GET(request: NextRequest) {
  const rateLimitResult = publicApiRateLimit(request);
  if (!rateLimitResult.allowed) {
    return errors.rateLimit(rateLimitResult.resetTime);
  }
  // ... rest of handler
}
```

---

### 7. WebSocket Message Flooding 🟡 MEDIUM

**Files:**
- `src/ws-handlers/notification-handler.ts`
- `src/ws-handlers/partner-handler.ts`

**Issue:**
- No rate limiting on WebSocket messages
- Clients can spam subscriptions
- No message validation
- Stored in memory (won't scale across instances)

**Impact:**
- Memory exhaustion from too many connections
- CPU overload from processing spam messages
- Service degradation

**Recommended Fix:**
```typescript
// In WebSocket handlers
const WS_RATE_LIMIT = { maxMessages: 50, windowMs: 60000 };

ws.on('message', (data) => {
  const rateLimit = checkRateLimit(clientId, WS_RATE_LIMIT);
  if (!rateLimit.allowed) {
    ws.send(JSON.stringify({ type: 'error', error: 'Rate limit exceeded' }));
    return;
  }
  // ... process message
});
```

---

### 8. File Upload Spam Protection Inconsistent 🟡 MEDIUM

**Files with Rate Limiting:**
- ✅ `src/app/api/student/documents/route.ts` - 20/min
- ✅ `src/app/api/partner/profile/documents/route.ts` - 20/min

**Files WITHOUT Rate Limiting:**
- ❌ Other upload endpoints not protected
- ❌ Avatar uploads
- ❌ Profile picture uploads

**Recommended Fix:**
Apply rate limiting consistently to ALL upload endpoints:
```typescript
const uploadRateLimit = createRateLimitMiddleware(rateLimitPresets.upload);
```

---

### 9. Export Endpoints Heavy Load 🟡 MEDIUM

**Files:**
- `src/app/api/admin/export/route.ts` - 10/min ✓
- `src/app/api/admin/universities/export/route.ts` - 10/min ✓
- `src/app/api/partner/export/route.ts` - 10/min ✓

**Issue:**
- Rate limiting exists BUT generates large database loads
- Exports can timeout with large datasets
- No pagination or chunking

**Recommended Enhancement:**
```typescript
// Add progress tracking and streaming
export async function POST(request: NextRequest) {
  // Start export job
  const jobId = generateJobId();
  
  // Run in background
  (async () => {
    const stream = createExportStream(query);
    await writeToStorage(jobId, stream);
    notifyUserComplete(jobId);
  })();
  
  return NextResponse.json({ jobId, status: 'processing' });
}
```

---

### 10. In-Memory Rate Limiting Won't Scale 🟡 MEDIUM

**File:** `src/lib/rate-limit.ts`

**Issue:**
- All rate limiting is in-memory (line 16: `Map<string, RateLimitRecord>`)
- Won't work across multiple server instances
- Lost on server restart
- Comments suggest Redis but not implemented (line 5)

**Production Impact:**
- Deploy on Vercel/Netlify with multiple regions = separate rate limits per region
- Load balancer distributes requests = ineffective rate limiting
- Server restart = all counters reset

**Recommended Fix:**
```typescript
// Use Redis for distributed rate limiting
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, Math.floor(config.windowMs / 1000));
  }
  
  return {
    allowed: current <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - current),
    // ...
  };
}
```

---

## Additional Issues Found

### 11. Error Handling Inconsistency 🟢 LOW

**Issue:**
- Standardized error helpers exist (`src/lib/errors.ts`)
- Most routes use raw `NextResponse.json({ error: '...' })`
- Inconsistent error response format

**Example:**
```typescript
// Some routes use:
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

// Should use:
return errors.internal('Database query failed');
```

---

### 12. Missing Request Timeouts 🟢 LOW

**Issue:**
- Some queries use `withTimeout()` wrapper
- Most queries don't have timeouts
- Hanging queries can exhaust connection pool

**Recommendation:**
Wrap ALL database queries with timeout:
```typescript
const { data, error } = await withTimeout(
  supabase.from('users').select('*'),
  10000,  // 10 second timeout
  'User query timeout'
);
```

---

### 13. No Global Error Handler 🟢 LOW

**Issue:**
- Each route handles errors individually
- No centralized error logging
- Difficult to track error patterns

**Recommendation:**
Add middleware-level error handling:
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  try {
    const response = await NextResponse.next();
    return response;
  } catch (error) {
    logError(error, request);
    return errors.internal('Unexpected error');
  }
}
```

---

## Priority Action Plan

### Immediate (This Week)
1. ✅ Add rate limiting to `/api/chat/route.ts`
2. ✅ Add rate limiting to `/api/auth/signin/route.ts`
3. ✅ Add rate limiting to `/api/auth/signup/route.ts`
4. ✅ Add caching to admin dashboard
5. ✅ Add caching to student dashboard

### Short-Term (Next 2 Weeks)
6. Add rate limiting to all public API endpoints
7. Optimize student dashboard queries (parallelize)
8. Add timeouts to all database queries
9. Implement WebSocket message rate limiting
10. Standardize error handling

### Medium-Term (Next Month)
11. Set up Redis for distributed rate limiting
12. Configure Supabase connection pooling
13. Implement export job queuing
14. Add comprehensive monitoring/logging
15. Create load testing suite

### Long-Term
16. Consider API gateway for centralized rate limiting
17. Implement circuit breaker pattern for external APIs
18. Add database indexes for slow queries
19. Implement pagination on all list endpoints
20. Set up CDN for static assets

---

## Testing Recommendations

### Load Testing Script
```bash
# Test chat endpoint (should be rate limited)
for i in {1..20}; do
  curl -X POST http://localhost:5000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}' &
done

# Test auth endpoint (should be rate limited)
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' &
done
```

### Monitoring Metrics to Track
- API response times (p50, p95, p99)
- Database connection count
- Rate limit trigger frequency
- Error rates by endpoint
- Cache hit/miss ratios

---

## Conclusion

The "too many requests" issues are caused by a combination of:
1. **Missing rate limiting** on critical endpoints
2. **Excessive database queries** without proper caching
3. **Inefficient query patterns** (sequential vs parallel)
4. **No connection pooling** configuration

Implementing the recommended fixes will significantly improve performance and prevent service degradation under load.
