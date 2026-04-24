---
name: Admin Module Separation - Simplified
overview: "Redesign admin portal with 4 modules: Individual Students, Partner Students, Individual Applications, Partner Applications. No orphan student system - clean separation between self-registered and partner-referred students only."
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
    status: completed
  - id: create-database-migration
    content: Add partner_id column to applications table and create indexes via migration
    status: completed
    dependencies:
      - analyze-existing-patterns
  - id: create-type-definitions
    content: Create shared type definitions for student sources and transfer schemas
    status: completed
    dependencies:
      - create-database-migration
  - id: implement-individual-students-api
    content: Create /api/admin/individual-students endpoint with source filtering
    status: completed
    dependencies:
      - create-type-definitions
  - id: implement-partner-students-api
    content: Create /api/admin/partner-students endpoint with transfer functionality
    status: completed
    dependencies:
      - create-type-definitions
  - id: implement-individual-applications-api
    content: Create /api/admin/individual-applications endpoint
    status: completed
    dependencies:
      - create-type-definitions
  - id: implement-partner-applications-api
    content: Create /api/admin/partner-applications endpoint
    status: completed
    dependencies:
      - create-type-definitions
  - id: create-individual-students-page
    content: Build individual students list page with filters
    status: completed
    dependencies:
      - implement-individual-students-api
  - id: create-partner-students-page
    content: Build partner students list page with transfer dialog
    status: completed
    dependencies:
      - implement-partner-students-api
  - id: create-individual-applications-page
    content: Build individual applications list page
    status: completed
    dependencies:
      - implement-individual-applications-api
  - id: create-partner-applications-page
    content: Build partner applications list page
    status: completed
    dependencies:
      - implement-partner-applications-api
  - id: update-admin-sidebar
    content: Update admin sidebar with 4 new menu items
    status: completed
    dependencies:
      - create-individual-students-page
      - create-partner-students-page
  - id: add-transfer-dialog
    content: Create student transfer dialog component
    status: completed
    dependencies:
      - create-partner-students-page
---

## Product Overview

Redesign the admin interface to provide clear separation between individual and partner students/applications with four distinct management modules. No orphan student system - only self-registered (individual) and partner-referred students.

## Core Features

- **Individual Students Module**: Manage self-registered students (referred_by_partner_id = NULL)
- **Partner Students Module**: Manage partner-referred students (referred_by_partner_id is set)
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

1. **Leverage existing database schema**: Use `referred_by_partner_id` column (already exists in users table) for categorization
2. **Extend existing API**: Add new endpoints while keeping existing ones for backward compatibility
3. **Create separate route folders**: `/admin/v2/individual-students`, `/admin/v2/partner-students`, etc.
4. **Update sidebar navigation**: Add 4 new menu items to existing sidebar component

### Database Schema Changes

```sql
-- Add partner_id to applications for direct filtering (if not exists)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);

-- Update existing applications to set partner_id based on student's referral
UPDATE applications a
SET partner_id = u.referred_by_partner_id
FROM users u
WHERE a.student_id = u.id
AND u.referred_by_partner_id IS NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_applications_partner_id ON applications(partner_id);
CREATE INDEX IF NOT EXISTS idx_users_referred_by_partner ON users(referred_by_partner_id) WHERE role = 'student';
```

### API Structure

```
/api/admin/
├── individual-students/           [NEW]
│   └── route.ts (GET with referred_by_partner_id IS NULL filter)
├── partner-students/              [NEW]
│   ├── route.ts (GET with referred_by_partner_id NOT NULL filter)
│   └── [id]/transfer/route.ts (POST: transfer student between partners)
├── individual-applications/       [NEW]
│   └── route.ts (GET applications from students without partner referral)
├── partner-applications/          [NEW]
│   └── route.ts (GET applications from partner-referred students)
├── students/                      [KEEP: unified view]
└── applications/                  [KEEP: unified view]
```

### Directory Structure

```
src/app/admin/(admin-v2)/v2/
├── individual-students/           [NEW]
│   ├── page.tsx                  (Student list, no partner referral)
│   └── [id]/
│       └── page.tsx              (Student detail view)
├── partner-students/              [NEW]
│   ├── page.tsx                  (Student list with partner referral)
│   └── [id]/
│       └── page.tsx              (Student detail with transfer option)
├── individual-applications/       [NEW]
│   ├── page.tsx                  (Applications from individual students)
│   └── [id]/
│       └── page.tsx              (Application detail)
├── partner-applications/          [NEW]
│   ├── page.tsx                  (Applications from partner students)
│   └── [id]/
│       └── page.tsx              (Application detail)
├── students/                      [KEEP: unified view]
├── applications/                  [KEEP: unified view]
└── ...
```

### Key Code Structures

```typescript
// src/lib/constants/student-sources.ts
export const STUDENT_SOURCES = {
  INDIVIDUAL: 'individual',        // referred_by_partner_id = NULL
  PARTNER_REFERRED: 'partner_referred', // referred_by_partner_id is set
} as const;

export type StudentSource = typeof STUDENT_SOURCES[keyof typeof STUDENT_SOURCES];

// src/lib/validations/student-transfer.ts
export const transferStudentSchema = z.object({
  student_id: z.string().uuid(),
  new_partner_id: z.string().uuid(),
  reason: z.string().min(10).max(500),
  notify_student: z.boolean().default(true),
});
```

## Implementation Notes

- **Leverage existing source filter**: The API already supports `source` parameter ('all' | 'individual' | 'partner_referred')
- **No breaking changes**: Keep existing `/students` and `/applications` routes
- **Performance**: Add database indexes on `referred_by_partner_id`, `partner_id`
- **Soft deletes**: Use existing `is_active` and `deleted_at` columns
- **Sidebar update**: Modify `dashboard-v2-sidebar.tsx` to add 4 new menu items
- **Remove orphan code**: Clean up existing orphan student handling code from API

## Design Style

Modern enterprise admin dashboard with clear module separation. The UI follows shadcn/ui conventions with clean typography, consistent spacing, and clear visual hierarchy.

## Navigation Structure

The admin sidebar will have 4 new dedicated menu items (added to existing sidebar):

- **Individual Students** (icon: User) - Self-registered students
- **Partner Students** (icon: Users) - Partner-referred students
- **Individual Applications** (icon: FileText) - Applications from individual students
- **Partner Applications** (icon: FolderOpen) - Applications from partner students

Keep existing unified views for backward compatibility.

## SubAgent

- **code-explorer**
- Purpose: Analyze existing student/application management patterns and API structures
- Expected outcome: Understand current implementation to ensure consistent extension