---
name: Internal Application Data Management Module
overview: Create a new admin module for managing internal application data (temporary replacement for Excel sheet management), with copy-to-another-university feature.
todos:
  - id: create-database-migration
    content: Create database migration for internal_applications table with all required fields
    status: completed
  - id: create-api-routes
    content: Create API routes for CRUD operations (list, create, get, update, delete)
    status: completed
    dependencies:
      - create-database-migration
  - id: create-list-page
    content: Create list page with search, filter, and status tabs
    status: completed
    dependencies:
      - create-api-routes
  - id: create-form-pages
    content: Create new and edit form pages with all fields
    status: completed
    dependencies:
      - create-api-routes
  - id: create-detail-page
    content: Create detail view page with copy button
    status: completed
    dependencies:
      - create-api-routes
  - id: implement-copy-feature
    content: Implement copy to another university functionality
    status: completed
    dependencies:
      - create-detail-page
---

## Product Overview

Internal application data management module for temporary Excel replacement. Standalone system for tracking student applications without linking to existing Students, Universities, or Programs tables.

## Core Features

- Add/edit/delete internal application records with fields: Student Name, Passport, Nationality, Degree, Major, Choice of University (text), Overview, Missing Docs (multi-select), Remarks For University, Status (single select), User ID, Email, Portal Link, Note, Date, Follow up, Comments, Partner
- List view with filtering and search
- Copy application to another university (creates new record with same student data but different university)
- Admin-only access with full CRUD operations

## Tech Stack

- Framework: Next.js 16 (App Router)
- Database: Supabase (PostgreSQL)
- UI Components: shadcn/ui
- Styling: Tailwind CSS 4

## Implementation Approach

Create a standalone `internal_applications` table with all required fields. Build admin CRUD pages following existing patterns from universities/programs management. Implement copy functionality as a server action that duplicates record with new university.

## Architecture Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin UI Layer                           │
│  /admin/v2/internal-apps                                    │
│  ├── page.tsx (list with search/filter)                     │
│  ├── new/page.tsx (create form)                             │
│  ├── [id]/page.tsx (detail view)                            │
│  ├── [id]/edit/page.tsx (edit form)                         │
│  └── [id]/copy/page.tsx (copy to new university)            │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                                │
│  /api/admin/internal-apps                                   │
│  ├── route.ts (GET list, POST create)                       │
│  └── [id]/route.ts (GET, PUT, DELETE)                       │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                           │
│  internal_applications table (standalone, no foreign keys)  │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── app/admin/(admin-v2)/v2/internal-apps/
│   ├── page.tsx                    # [NEW] List view with search/filter
│   ├── new/page.tsx                # [NEW] Create form
│   ├── [id]/
│   │   ├── page.tsx                # [NEW] Detail view
│   │   ├── edit/page.tsx           # [NEW] Edit form
│   │   └── copy/page.tsx           # [NEW] Copy to another university
├── app/api/admin/internal-apps/
│   ├── route.ts                    # [NEW] GET list, POST create
│   └── [id]/route.ts               # [NEW] GET, PUT, DELETE single record
├── storage/database/shared/
│   └── schema.ts                   # [MODIFY] Add internal_applications table
└── migrations/
    └── 022_internal_applications.sql # [NEW] Database migration
```

## Database Schema

```sql
CREATE TABLE internal_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student Information
  student_name TEXT NOT NULL,
  passport TEXT,
  nationality TEXT,
  degree TEXT,
  major TEXT,
  
  -- University & Application
  university_choice TEXT,  -- Text field, admin enters manually
  overview TEXT,           -- Long text
  missing_docs JSONB DEFAULT '[]',  -- Multi-select array
  remarks_for_university TEXT,      -- Long text
  status TEXT DEFAULT 'pending',    -- Single select
  
  -- Contact & Reference
  user_id TEXT,            -- Text field (not FK)
  email TEXT,
  portal_link TEXT,
  partner TEXT,            -- Text field
  
  -- Tracking
  note TEXT,
  application_date DATE,
  follow_up_date DATE,
  comments TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,  -- Admin who created
  
  -- Status options: pending, processing, submitted, accepted, rejected, withdrawn
);
```

## Agent Extensions

### Skill

- **supabase-postgres-best-practices**
- Purpose: Ensure database schema follows Postgres best practices for the internal_applications table
- Expected outcome: Optimized table design with proper indexes and constraints