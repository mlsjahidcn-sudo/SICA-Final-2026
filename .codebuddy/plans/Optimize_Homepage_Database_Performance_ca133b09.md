---
name: Optimize Homepage Database Performance
overview: Optimize homepage loading speed by adding caching to Success Cases API, fixing University API featured filter, and creating database indexes for common queries.
todos:
  - id: add-cache-success-cases
    content: Add caching to Success Cases API for featured cases
    status: completed
  - id: fix-featured-universities
    content: Implement featured universities logic using ranking in University API
    status: completed
  - id: optimize-url-generation
    content: Optimize storage URL generation to skip unused fields
    status: completed
  - id: verify-indexes
    content: Verify database indexes are properly created
    status: completed
---

## User Requirements

Optimize homepage database loading performance. The homepage currently makes two API calls:

1. `/api/universities?limit=4&featured=true` - Featured universities
2. `/api/success-cases?featured=true&limit=3` - Featured success cases

## Issues Identified

1. **University API ignores `featured` parameter** - The API has no logic to filter by "featured" status
2. **Success Cases API has no caching** - Every request hits the database
3. **Batch URL generation** - While optimized, still makes 3 separate storage API calls
4. **No `is_featured` column in universities table** - Need alternative approach for featured universities

## Current State

- University API: Has caching (2-min TTL) but cache key doesn't include `featured` param
- Success Cases API: No caching, makes fresh DB + storage queries every time
- Database indexes exist for success_cases table (status, is_featured, display_order)

## Tech Stack

- Framework: Next.js 16 (App Router)
- Database: Supabase (PostgreSQL)
- Caching: In-memory SimpleCache (`src/lib/api-cache.ts`)

## Implementation Approach

### 1. Add Caching to Success Cases API

Reuse existing `apiCache` infrastructure to cache featured success cases for 5 minutes (CACHE_TTL.LONG).

### 2. Fix University "Featured" Logic

Since `universities` table lacks `is_featured` column, use `ranking_national` to select top universities as "featured" (top 4 by ranking).

### 3. Optimize Storage URL Generation

For homepage display, only generate signed URLs for `admission_notice_url` (the only field used in cards), reducing storage API calls.

### 4. Add Database Indexes (if needed)

Verify indexes exist for common query patterns.

## Directory Structure

```
src/
├── app/api/
│   ├── success-cases/
│   │   └── route.ts          # [MODIFY] Add caching, optimize URL generation
│   └── universities/
│       └── route.ts           # [MODIFY] Handle featured parameter using ranking
├── lib/
│   └── api-cache.ts           # Existing cache utility
└── components/
    └── home-page-content.tsx  # [OPTIONAL] Add loading skeleton
```

## Implementation Notes

- Reuse existing `apiCache` and `CACHE_TTL` constants
- Featured universities: Use `order('ranking_national', { ascending: true }).limit(4)` 
- Cache key for success cases: `success-cases:featured:limit:3`
- Consider adding `is_featured` column to universities table for proper feature management