---
name: student-doc-upload
overview: "Fix student document upload: consolidate storage to Supabase Storage, create missing bucket, connect profile to documents, fix API routes"
todos:
  - id: create-storage-bucket
    content: Create `documents` Supabase Storage bucket with RLS policies via migration
    status: completed
  - id: fix-main-documents-api
    content: Convert /api/documents route from S3Storage to Supabase Storage
    status: completed
    dependencies:
      - create-storage-bucket
  - id: fix-documents-url-api
    content: Convert /api/documents/[id]/url route from S3Storage to Supabase Storage
    status: completed
    dependencies:
      - create-storage-bucket
  - id: fix-student-docs-api
    content: Fix /api/student/documents routes to store file_key and handle storage deletion properly
    status: completed
    dependencies:
      - create-storage-bucket
  - id: fix-student-api-client
    content: Update student-api.ts uploadDocument to use /api/documents endpoint
    status: completed
    dependencies:
      - fix-main-documents-api
  - id: connect-profile-documents
    content: Replace static Profile Documents tab with dynamic real-data component + upload capability
    status: completed
    dependencies:
      - fix-main-documents-api
  - id: remove-mock-fallbacks
    content: Remove mock data fallbacks from Document Library page and add proper auth tokens
    status: completed
    dependencies:
      - fix-main-documents-api
---

## Product Overview

Fix and connect the student document upload system in the SICA education platform. Currently, document upload is partially implemented but broken due to conflicting storage backends and missing infrastructure. The goal is to make document upload fully functional end-to-end and connect it to the student profile and application pages.

## Core Features

- Create the missing `documents` Supabase Storage bucket to enable file uploads
- Consolidate all document upload APIs to use Supabase Storage (replacing broken S3Storage with empty credentials)
- Connect the student Profile Documents tab to show actual uploaded documents from applications, with upload capability
- Remove mock data fallbacks that hide real API errors from document pages
- Fix student-api.ts to use the correct upload endpoint
- Ensure document upload works from: Document Library page, Application Documents page, and Profile Documents tab

## Tech Stack

- Framework: Next.js 16 (App Router) with React 19 and TypeScript 5
- UI: shadcn/ui + Tailwind CSS 4
- Database: Supabase (PostgreSQL) + Supabase Storage
- Package Manager: pnpm

## Implementation Approach

**Strategy**: Consolidate the dual storage backend (broken S3Storage + missing Supabase Storage bucket) into a single working Supabase Storage approach. Since S3Storage credentials are empty (`accessKey: ''`, `secretKey: ''`), uploads via `/api/documents` will fail. The fix is to create the `documents` Supabase Storage bucket and convert all S3-dependent code to use Supabase Storage instead. This aligns with the project's primary use of Supabase as its database and avoids external S3 dependency.

**How it works**: 1) Create the `documents` bucket in Supabase Storage with proper RLS policies. 2) Rewrite the main `/api/documents` route to use `supabase.storage.from('documents')` instead of S3Storage. 3) Update the presigned URL route similarly. 4) Fix the student-specific route's DELETE handler. 5) Update student-api.ts to point to the working route. 6) Replace the static Profile Documents tab with a dynamic component that fetches and displays real uploaded documents. 7) Remove all mock data fallbacks.

**Key Technical Decisions**:

- **Supabase Storage over S3**: S3Storage has empty credentials and will fail. Supabase Storage is already the project's infrastructure, has built-in RLS for security, and is already partially used by `/api/student/documents`. Consolidating to one backend eliminates inconsistency.
- **Store both `file_key` and `file_url`**: When uploading, store the storage path as `file_key` and the public URL as `file_url` in `application_documents`. This supports both new and legacy document records.
- **Profile Documents tab fetches cross-application docs**: The profile page will fetch all documents across the student's applications via `/api/documents`, showing them grouped by application with status indicators and upload links.

## Implementation Notes

- The `application_documents` table already has both `file_key` and `file_url` columns, so no schema migration is needed for the database
- The Supabase Storage bucket creation requires a migration SQL that creates the bucket and sets up RLS policies for authenticated access
- Existing documents uploaded via S3 (if any exist) will have `file_key` pointing to S3 paths. The GET handler should handle both cases (file_key pointing to Supabase Storage vs legacy S3) gracefully by trying Supabase Storage first, then falling back to `file_url`
- The `onConflict: 'application_id,document_type'` in `/api/student/documents/route.ts` line 153 may fail if there's no unique constraint on that pair. The main `/api/documents` route uses `onConflict: 'id'` which is safer
- All fetch calls in the v2 document pages use `credentials: 'include'` but some are missing the Authorization header. Need to add auth token consistently

## Architecture Design

```mermaid
graph TD
    A[Student UI] --> B[Document Library Page]
    A --> C[Profile Documents Tab]
    A --> D[Application Documents Page]
    
    B --> E[/api/documents]
    C --> E
    D --> E
    
    E --> F[Supabase Storage Bucket: documents]
    E --> G[application_documents Table]
    
    H[student-api.ts] --> E
    
    I[Admin/Partner] --> J[/api/admin/documents/id]
    J --> G
```

## Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── documents/
│   │   │   ├── route.ts                    # [MODIFY] Convert S3Storage → Supabase Storage for GET/POST/DELETE
│   │   │   └── [id]/url/route.ts           # [MODIFY] Convert S3Storage → Supabase Storage for presigned URL generation
│   │   └── student/
│   │       └── documents/
│   │           ├── route.ts                 # [MODIFY] Improve POST to store file_key, content_type, uploaded_by; improve GET to include file_key
│   │           └── [id]/route.ts            # [MODIFY] Fix DELETE to handle file_key deletion from Supabase Storage
│   ├── (student-v2)/student-v2/
│   │   ├── profile/
│   │   │   └── page.tsx                    # [MODIFY] Replace static Documents tab with dynamic component showing real uploaded documents + upload capability
│   │   └── documents/
│   │       └── page.tsx                    # [MODIFY] Remove mock data fallback, add auth token to fetch calls, proper empty/error states
│   └── components/
│       ├── document-upload.tsx              # [KEEP] Already works with /api/documents, no changes needed
│       └── ui/
│           └── file-upload.tsx              # [KEEP] Generic upload component, delegates to parent, no changes needed
├── lib/
│   └── student-api.ts                       # [MODIFY] Change uploadDocument to use /api/documents instead of /api/student/documents
└── migrations/
    └── 012_create_documents_storage_bucket.sql  # [NEW] Create documents Supabase Storage bucket with public read + authenticated upload RLS policies
```

## Agent Extensions

### SubAgent

- **code-explorer**: Used to verify existing patterns and find specific code references during implementation to ensure consistency with current codebase conventions

### Skill

- **supabase-postgres-best-practices**: Used to ensure the storage bucket RLS policies follow Supabase best practices for security and performance