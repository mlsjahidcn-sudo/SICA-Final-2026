---
name: Admin Portal Separation Architecture
overview: Design and implement a comprehensive admin portal that separates partner students/applications from individual students/applications, with dual registration workflows, full admin authority, and scalable architecture following security and data integrity best practices.
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
  - id: explore-existing-patterns
    content: Use [subagent:code-explorer] to analyze current student and partner management patterns
    status: pending
  - id: create-database-migration
    content: Create database migration for student_source enum and assignment tracking columns
    status: pending
    dependencies:
      - explore-existing-patterns
  - id: create-shared-types
    content: Create shared type definitions and validation schemas for separated portals
    status: pending
    dependencies:
      - create-database-migration
  - id: implement-individual-api
    content: Implement individual students API routes with source filtering
    status: pending
    dependencies:
      - create-shared-types
  - id: implement-partner-api
    content: Implement partner students API routes with transfer and assignment endpoints
    status: pending
    dependencies:
      - create-shared-types
  - id: create-admin-hub-page
    content: Create main admin hub dashboard with portal selection
    status: pending
    dependencies:
      - implement-individual-api
      - implement-partner-api
  - id: build-individual-portal
    content: Build individual students portal UI with student list and detail pages
    status: pending
    dependencies:
      - create-admin-hub-page
  - id: build-partner-portal
    content: Build partner students portal UI with team management and transfer dialogs
    status: pending
    dependencies:
      - create-admin-hub-page
  - id: implement-audit-logging
    content: Implement admin audit logging for all critical actions
    status: pending
    dependencies:
      - build-individual-portal
      - build-partner-portal
  - id: add-transfer-workflow
    content: Add student transfer and application reassignment workflow with notifications
    status: pending
    dependencies:
      - implement-audit-logging
---

## User Requirements

Design a comprehensive admin portal architecture that separates management for partner students/applications from individual students/applications, resolving issues caused by the current unified module.

### Core Features

1. **Dual Admin Portals**

- **Individual Students Portal**: Manage self-registered students and their applications
- **Partner Students Portal**: Manage partner-referred students, orphan students, and partner team management

2. **Dual Registration Workflows**

- **Individual Registration**: Self-registration flow with email verification
- **Partner Student Registration**: Admin creates accounts on behalf of partner students with invitation system

3. **Admin Authority & Assignment Management**

- Full authority to view, create, update, and delete all students and applications
- Transfer students between partners
- Reassign applications to different partners
- Manage partner team memberships

4. **Scalable Architecture Requirements**

- Security: Row-level security, API route protection, input validation
- Role Management: Enhanced role system with granular permissions
- Data Integrity: Foreign key constraints, soft deletes, audit logging
- Performance: Optimized queries, proper indexing, caching strategies

### Visual Effect

The admin interface will feature clear navigation separation with distinct portals accessible from the main admin dashboard, each with dedicated dashboards showing relevant statistics and management tools.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL + Auth)
- **UI Components**: shadcn/ui (based on Radix UI)
- **Styling**: Tailwind CSS 4
- **Package Manager**: pnpm 9.0.0+

## Implementation Approach

### Architecture Strategy

The solution follows a **modular separation pattern** where partner-related and individual-related operations are isolated into distinct modules while sharing common utilities and authentication infrastructure.

**Key Technical Decisions**:

1. **Separate Route Groups**: Use Next.js route groups `(admin-individual)` and `(admin-partner)` to physically separate code while maintaining clean URLs
2. **Shared Auth Infrastructure**: Centralize authentication in `lib/auth-utils.ts` with role-based access control
3. **Database Schema Enhancement**: Add `student_source` enum and `assigned_partner_id` columns for clearer categorization
4. **Soft Delete Pattern**: Extend existing soft delete mechanism to all deletable entities

### Database Schema Changes

```sql
-- Add student_source enum for clear categorization
CREATE TYPE student_source AS ENUM ('individual', 'partner_referred', 'orphan');

-- Add to users table
ALTER TABLE users ADD COLUMN student_source student_source;

-- Add assignment tracking
ALTER TABLE students ADD COLUMN assigned_partner_id UUID REFERENCES users(id);
ALTER TABLE students ADD COLUMN assignment_history JSONB DEFAULT '[]';

-- Add audit logging table
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Structure

```
/api/admin/
├── individual/
│   ├── students/
│   │   ├── route.ts (GET list, POST create)
│   │   └── [id]/route.ts (GET, PUT, DELETE)
│   └── applications/
│       ├── route.ts (GET list)
│       └── [id]/route.ts (GET, PUT)
├── partner/
│   ├── students/
│   │   ├── route.ts (GET list, POST create with invitation)
│   │   ├── [id]/route.ts (GET, PUT, DELETE)
│   │   ├── [id]/transfer/route.ts (POST transfer to partner)
│   │   └── orphan/route.ts (GET orphan students)
│   ├── applications/
│   │   ├── route.ts (GET list)
│   │   └── [id]/route.ts (GET, PUT, reassign)
│   └── teams/
│       ├── route.ts (GET partner teams)
│       └── [partnerId]/route.ts (GET, PUT team management)
└── assignments/
    ├── route.ts (GET, POST assignments)
    └── [id]/route.ts (GET assignment history)
```

### Directory Structure

```
src/app/admin/
├── (admin-individual)/
│   ├── layout.tsx
│   ├── individual/
│   │   ├── page.tsx (dashboard)
│   │   ├── students/
│   │   │   ├── page.tsx (list)
│   │   │   └── [id]/page.tsx (detail)
│   │   └── applications/
│   │       ├── page.tsx (list)
│   │       └── [id]/page.tsx (detail)
│   └── components/
│       ├── individual-sidebar.tsx
│       └── individual-stats-cards.tsx
├── (admin-partner)/
│   ├── layout.tsx
│   ├── partner/
│   │   ├── page.tsx (dashboard)
│   │   ├── students/
│   │   │   ├── page.tsx (list)
│   │   │   ├── [id]/page.tsx (detail)
│   │   │   └── orphan/page.tsx (orphan students)
│   │   ├── applications/
│   │   │   ├── page.tsx (list)
│   │   │   └── [id]/page.tsx (detail)
│   │   └── teams/
│   │       └── [partnerId]/page.tsx (team management)
│   └── components/
│       ├── partner-sidebar.tsx
│       └── partner-stats-cards.tsx
└── shared/
    └── components/
        ├── student-transfer-dialog.tsx
        ├── assignment-history-dialog.tsx
        └── audit-log-table.tsx
```

### Key Code Structures

```typescript
// src/lib/constants/student-sources.ts
export const STUDENT_SOURCES = {
  INDIVIDUAL: 'individual',
  PARTNER_REFERRED: 'partner_referred',
  ORPHAN: 'orphan',
} as const;

// src/lib/types/admin.ts
export interface IndividualStudent {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  source: typeof STUDENT_SOURCES.INDIVIDUAL;
  applications: Application[];
  created_at: string;
}

export interface PartnerStudent {
  id: string;
  user_id: string | null; // null for orphan students
  email: string;
  full_name: string;
  source: typeof STUDENT_SOURCES.PARTNER_REFERRED | typeof STUDENT_SOURCES.ORPHAN;
  referred_by_partner_id: string;
  assigned_partner_id: string;
  claim_status: 'pending' | 'claimed' | 'expired';
  applications: Application[];
  created_at: string;
}

// src/lib/validations/admin-assignment.ts
export const transferStudentSchema = z.object({
  student_id: z.string().uuid(),
  new_partner_id: z.string().uuid(),
  reason: z.string().min(10).max(500),
  notify_student: z.boolean().default(true),
  notify_old_partner: z.boolean().default(true),
});
```

## Implementation Notes

- **Backward Compatibility**: Maintain existing API routes during transition, deprecate after migration
- **Performance**: Use database indexes on `student_source`, `assigned_partner_id`, `referred_by_partner_id`
- **Audit Trail**: All admin actions logged to `admin_audit_log` table for compliance
- **Email Notifications**: Integrate with existing Resend setup for invitation and transfer notifications
- **Cache Strategy**: Cache partner team structures in Redis-like store for quick access checks

## Design Style

Modern enterprise admin dashboard with clear portal separation using a **professional dashboard design** approach. The UI follows shadcn/ui conventions with clean typography, consistent spacing, and clear visual hierarchy.

## Portal Navigation

The main admin dashboard serves as a hub with two prominent portal entry points:

- **Individual Portal**: Clean, minimal interface with focus on student data
- **Partner Portal**: Business-focused interface with partner branding elements

## Key UI Components

### Main Admin Dashboard

- Quick stats overview combining both portals
- Portal selection cards with distinct visual identities
- Recent activity feed from both systems

### Individual Students Portal

- Student list with search and filter capabilities
- Application status tracking
- Individual student detail view with timeline

### Partner Students Portal

- Partner selector dropdown for team context
- Student list with partner attribution
- Orphan students management section
- Transfer and reassignment dialogs
- Team management interface

## SubAgent

- **code-explorer**: Explore existing codebase patterns for student management, partner relationships, and API route structures to ensure consistent implementation