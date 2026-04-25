---
name: Add University Portal Credentials to Internal Apps
overview: Add portal_username and portal_password fields to the internal_applications table for storing university portal login credentials. Update database schema, API routes, and all UI pages (detail, edit, new).
todos:
  - id: create-migration
    content: Create database migration to add portal_username and portal_password columns
    status: completed
  - id: update-api-routes
    content: Update API routes to handle new portal credential fields
    status: completed
    dependencies:
      - create-migration
  - id: update-detail-page
    content: Update detail page to display portal credentials in Application Details section
    status: completed
    dependencies:
      - update-api-routes
  - id: update-edit-page
    content: Update edit page to allow editing portal credentials
    status: completed
    dependencies:
      - update-api-routes
  - id: update-new-page
    content: Update new page to allow entering portal credentials
    status: completed
    dependencies:
      - update-api-routes
---

## User Requirements

Add University portal login credentials (username and password) to the Internal Applications management feature. These fields should be displayed in the Application Details section for each university application.

## Product Overview

The Internal Applications module is a standalone system for managing internal application data (Excel replacement). It allows admins to track student applications across different universities, including portal access information.

## Core Features

- Add `portal_username` field to store university portal login username
- Add `portal_password` field to store university portal login password
- Display credentials in Application Details section on detail page
- Allow input/editing of credentials on new and edit forms
- Group credentials together with existing `portal_link` field

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS

## Implementation Approach

1. **Database Migration**: Create a new migration file to add `portal_username` and `portal_password` TEXT columns to `internal_applications` table
2. **API Updates**: Modify both API route files to handle the new fields in GET, POST, and PUT operations
3. **UI Updates**: Update the TypeScript interface and all three pages (detail, edit, new) to display and input the new fields

## Implementation Notes

- Place `portal_username` and `portal_password` immediately after `portal_link` in all locations for logical grouping
- Use password-type input for `portal_password` field for security
- Consider adding a copy-to-clipboard button for password field on detail page
- The API uses `SELECT *` so no changes needed to query structure, only to insert/update handlers

## Directory Structure

```
migrations/
└── 024_add_portal_credentials.sql    # [NEW] Add portal_username and portal_password columns

src/app/api/admin/internal-apps/
├── route.ts                           # [MODIFY] Add portal_username, portal_password to POST
└── [id]/route.ts                      # [MODIFY] Add portal_username, portal_password to PUT

src/app/admin/(admin-v2)/v2/internal-apps/
├── [id]/
│   ├── page.tsx                       # [MODIFY] Add fields to interface, display in Application Details card
│   └── edit/page.tsx                  # [MODIFY] Add fields to formData state, add input fields
└── new/page.tsx                       # [MODIFY] Add fields to formData state, add input fields
```

## Key Code Structures

```typescript
// Interface update for InternalApplication
interface InternalApplication {
  // ... existing fields
  portal_link: string | null;
  portal_username: string | null;  // NEW
  portal_password: string | null;  // NEW
  // ... remaining fields
}
```

```sql
-- Migration SQL
ALTER TABLE internal_applications 
ADD COLUMN IF NOT EXISTS portal_username TEXT,
ADD COLUMN IF NOT EXISTS portal_password TEXT;

COMMENT ON COLUMN internal_applications.portal_username IS 'University portal login username';
COMMENT ON COLUMN internal_applications.portal_password IS 'University portal login password';
```