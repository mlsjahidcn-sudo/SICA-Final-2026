---
name: Admin Module Separation Architecture
overview: "Redesign admin portal with 4 separate modules: Individual Students, Partner Students, Individual Applications, Partner Applications. Each module has dedicated management interface with shared admin authority and clear data separation."
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Professional
    - Clean
    - Enterprise
    - Data-focused
    - Dashboard
  fontSystem:
    fontFamily: Inter
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#2563EB"
      - "#1D4ED8"
    background:
      - "#F9FAFB"
      - "#FFFFFF"
    text:
      - "#111827"
      - "#4B5563"
    functional:
      - "#10B981"
      - "#EF4444"
      - "#F59E0B"
todos:
  - id: analyze-existing-patterns
    content: Use [subagent:code-explorer] to analyze current student/application API patterns and UI components
    status: pending
  - id: create-database-schema
    content: Add student_source enum and partner_id column to applications table via migration
    status: pending
    dependencies:
      - analyze-existing-patterns
  - id: create-type-definitions
    content: Create shared type definitions for student sources and transfer schemas
    status: pending
    dependencies:
      - create-database-schema
  - id: implement-individual-students-api
    content: Create /api/admin/individual-students endpoint with source filtering
    status: pending
    dependencies:
      - create-type-definitions
  - id: implement-partner-students-api
    content: Create /api/admin/partner-students endpoint with transfer functionality
    status: pending
    dependencies:
      - create-type-definitions
  - id: implement-individual-applications-api
    content: Create /api/admin/individual-applications endpoint
    status: pending
    dependencies:
      - create-type-definitions
  - id: implement-partner-applications-api
    content: Create /api/admin/partner-applications endpoint
    status: pending
    dependencies:
      - create-type-definitions
  - id: create-individual-students-page
    content: Build individual students list page with filters
    status: pending
    dependencies:
      - implement-individual-students-api
  - id: create-partner-students-page
    content: Build partner students list page with orphan section
    status: pending
    dependencies:
      - implement-partner-students-api
  - id: create-individual-applications-page
    content: Build individual applications list page
    status: pending
    dependencies:
      - implement-individual-applications-api
  - id: create-partner-applications-page
    content: Build partner applications list page
    status: pending
    dependencies:
      - implement-partner-applications-api
  - id: update-admin-sidebar
    content: Update admin sidebar with 4 new menu items
    status: pending
    dependencies:
      - create-individual-students-page
      - create-partner-students-page
  - id: add-transfer-dialog
    content: Create student transfer dialog component
    status: pending
    dependencies:
      - create-partner-students-page
---

## Product Overview

Redesign the admin interface to provide clear separation between individual and partner students/applications with four distinct management modules.

## Core Features

- **Individual Students Module**: Manage self-registered students (no partner referral)
- **Partner Students Module**: Manage partner-referred students and orphan students
- **Individual Applications Module**: Applications from individual students
- **Partner Applications Module**: Applications from partner-referred students
- **Admin Authority**: Full CRUD operations with transfer and reassignment capabilities
- **Data Integrity**: Soft deletes, audit logging, and proper categorization

## Tech Stack Selection

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS 4
- **Package Manager**: pnpm 9.0.0+

## Implementation Approach

### Strategy: Module Separation Pattern

Create 4 separate modules within the existing admin interface using URL routing for clear separation while sharing common infrastructure.

**Key Technical Decisions**:

1. **Leverage existing database schema**: Use `referred_by_partner_id` for categorization (already exists)
2. **Add student_source enum**: For clearer semantic categorization
3. **Create separate route folders**: `/admin/v2/individual-students`, `/admin/v2/partner-students`, etc.
4. **Maintain existing API**: Extend current endpoints with better filtering rather than creating duplicate APIs

### Database Schema Changes

```sql
-- Add student_source enum for semantic clarity
CREATE TYPE student_source AS ENUM ('individual', 'partner_referred', 'orphan');

-- Add source column to users (for students with accounts)
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_source student_source 
  DEFAULT CASE WHEN referred_by_partner_id IS NULL THEN 'individual'::student_source ELSE 'partner_referred'::student_source END;

-- Add source to orphan students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS source student_source DEFAULT 'orphan';

-- Add partner_id to applications for direct filtering
ALTER TABLE applications ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_student_source ON users(student_source) WHERE role = 'student';
CREATE INDEX IF NOT EXISTS idx_applications_partner_id ON applications(partner_id);
```

### API Structure (Extended Existing)

```
/api/admin/
├── students/
│   └── route.ts (EXTEND: source filter defaults to 'all', new endpoints for each source)
├── applications/
│   └── route.ts (EXTEND: source filter based on student partner_id)
├── individual-students/           [NEW]
│   └── route.ts (GET with source=individual filter, POST for creating individual students)
├── partner-students/              [NEW]
│   ├── route.ts (GET with source=partner_referred|orphan, POST for partner student creation)
│   └── [id]/transfer/route.ts (POST: transfer student between partners)
├── individual-applications/       [NEW]
│   └── route.ts (GET applications from individual students)
└── partner-applications/          [NEW]
    └── route.ts (GET applications from partner students)
```

### Directory Structure

```
src/app/admin/(admin-v2)/v2/
├── individual-students/           [NEW]
│   ├── page.tsx                  (Student list with source=individual filter)
│   └── [id]/
│       └── page.tsx              (Student detail view)
├── partner-students/              [NEW]
│   ├── page.tsx                  (Student list with source=partner filter)
│   ├── [id]/
│   │   └── page.tsx              (Student detail view)
│   └── orphan/
│       └── page.tsx              (Orphan students management)
├── individual-applications/       [NEW]
│   ├── page.tsx                  (Applications from individual students)
│   └── [id]/
│       └── page.tsx              (Application detail)
├── partner-applications/          [NEW]
│   ├── page.tsx                  (Applications from partner students)
│   └── [id]/
│       └── page.tsx              (Application detail)
├── students/                      [KEEP: unified view for admins who want all]
├── applications/                  [KEEP: unified view for admins who want all]
└── layout.tsx                     (MODIFY: add 4 new menu items to sidebar)
```

### Key Code Structures

```typescript
// src/lib/constants/student-sources.ts
export const STUDENT_SOURCES = {
  INDIVIDUAL: 'individual',
  PARTNER_REFERRED: 'partner_referred',
  ORPHAN: 'orphan',
} as const;

export type StudentSource = typeof STUDENT_SOURCES[keyof typeof STUDENT_SOURCES];

// src/lib/types/student.ts
export interface Student {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  source: StudentSource;
  referred_by_partner_id: string | null;
  partner_name?: string;
  applications_count: number;
  created_at: string;
}

// src/lib/validations/student-transfer.ts
export const transferStudentSchema = z.object({
  student_id: z.string().uuid(),
  new_partner_id: z.string().uuid(),
  reason: z.string().min(10).max(500),
  notify_student: z.boolean().default(true),
});
```

## Implementation Notes

- **Leverage existing source filter**: The API already supports `source` parameter
- **No breaking changes**: Keep existing `/students` and `/applications` routes
- **Performance**: Add database indexes on `student_source`, `partner_id`
- **Soft deletes**: Use existing `is_active` and `deleted_at` columns
- **Sidebar update**: Add 4 new menu items while keeping existing unified views

## Design Style

Modern enterprise admin dashboard with clear module separation. The UI follows shadcn/ui conventions with clean typography, consistent spacing, and clear visual hierarchy.

## Navigation Structure

The admin sidebar will have 4 new dedicated menu items:

- **Individual Students** (icon: User)
- **Partner Students** (icon: Users)
- **Individual Applications** (icon: FileText)
- **Partner Applications** (icon: FolderOpen)

Keep existing unified views for backward compatibility.

## Key UI Components

- Student list with source-specific filters
- Partner badge display for partner students
- Transfer dialog for moving students between partners
- Application status tracking with partner attribution
- Statistics cards showing counts per source

## SubAgent

- **code-explorer**
- Purpose: Analyze existing student/application management patterns and API structures
- Expected outcome: Understand current implementation to ensure consistent extension