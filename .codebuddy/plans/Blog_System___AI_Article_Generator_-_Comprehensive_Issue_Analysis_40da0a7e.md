---
name: Blog System & AI Article Generator - Comprehensive Issue Analysis
overview: Comprehensive check of blog system, AI article generation, editing workflow, and saving functionality to identify all critical issues, bugs, and missing features.
todos:
  - id: add-internal-links-column
    content: Add internal_links JSONB column to blog_posts table via migration
    status: completed
  - id: fix-put-tag-handling
    content: Fix PUT endpoint to properly sync tags in blog_post_tags table
    status: completed
    dependencies:
      - add-internal-links-column
  - id: fix-get-post-tags
    content: Fix GET endpoint to return tags with blog post for editing
    status: completed
    dependencies:
      - add-internal-links-column
  - id: add-api-validation
    content: Add comprehensive validation and error handling to all blog APIs
    status: completed
    dependencies:
      - fix-put-tag-handling
  - id: fix-editor-validation
    content: Add client-side validation and improve error handling in blog editor
    status: completed
  - id: fix-bilingual-handling
    content: Fix Chinese content field handling in editor form
    status: completed
  - id: fix-list-category-access
    content: Fix blog list component category field access
    status: completed
  - id: test-crud-operations
    content: Test all blog CRUD operations end-to-end
    status: completed
    dependencies:
      - fix-put-tag-handling
      - fix-editor-validation
---

## Blog System Analysis & Issues

User requested a comprehensive check of the entire blog system including AI article generation, editing, and saving functionality.

### Issues Identified

1. **Database Schema Missing Column**

- `internal_links` field used in editor and API but NOT in `blog_posts` table schema
- Will cause runtime errors when saving posts with internal links

2. **Tags Not Saving Properly**

- Editor collects tag IDs but doesn't properly save to `blog_post_tags` junction table in PUT endpoint
- Blog list component expects `categories` but API returns `blog_categories`

3. **Type Mismatch**

- Frontend sends `seo_keywords` as comma-separated string
- Database expects `text[]` array
- POST converts but PUT may have issues

4. **Schema Tab Non-Functional**

- Only displays preview JSON
- Doesn't generate or save actual schema markup
- No persistence mechanism

5. **Missing Error Handling**

- AI generation failures provide limited user feedback
- No client-side validation before save operations
- Silent failures possible

6. **Chinese Content Handling**

- AI generates `content_cn` but editor form may not properly handle it
- No validation for bilingual fields

## Technical Solution

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase PostgreSQL
- **AI**: Moonshot API (Kimi K2.5) via OpenAI SDK
- **UI**: React 19 + TypeScript + shadcn/ui + Tailwind CSS

### Implementation Approach

#### 1. Database Migration (SQL)

Add missing `internal_links` column to `blog_posts` table as JSONB to store internal link suggestions.

#### 2. API Layer Fixes

**POST /api/admin/blog/route.ts:**

- Already handles tag insertion (lines 174-180) ✅
- Already converts seo_keywords string to array ✅

**PUT /api/admin/blog/[id]/route.ts:**

- Missing tag handling - needs to sync tags on update
- Add proper error handling and validation
- Ensure type conversion for seo_keywords

**GET /api/admin/blog/[id]/route.ts:**

- Need to return tags with the post for editing

#### 3. Editor Component Fixes

**blog-editor.tsx:**

- Add client-side validation before save
- Improve error handling in AI generation (handle stream parsing errors)
- Fix bilingual content fields
- Make Schema tab functional (generate and store schema)

**blog-list.tsx:**

- Fix category field access (use `blog_categories` not `categories`)

#### 4. Error Handling & Validation

- Add try-catch blocks with meaningful error messages
- Validate required fields before API calls
- Handle streaming errors gracefully
- Add loading states for all async operations

### Key Code Structures

#### internal_links JSONB Structure

```typescript
interface InternalLink {
  post_slug: string;
  anchor_text: string;
  reason: string;
}
```

#### Blog Post Update Payload

```typescript
interface BlogPostUpdate {
  // ... existing fields
  internal_links?: InternalLink[];
  seo_keywords?: string | string[]; // Handle both formats
}
```

## Agent Extensions Used

### Skill: code-explorer

- **Purpose**: Already used to explore blog system architecture and identify all issues
- **Expected outcome**: Comprehensive understanding of blog system structure, APIs, and issues

### Skill: supabase-postgres-best-practices

- **Purpose**: Ensure database migration follows Postgres best practices
- **Expected outcome**: Proper JSONB column addition with correct constraints