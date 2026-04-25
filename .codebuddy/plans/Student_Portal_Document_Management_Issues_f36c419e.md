---
name: Student Portal Document Management Issues
overview: Fix all issues related to document management in the student portal, including document type mismatches, inconsistent authorization, missing functionality, and UI/UX improvements.
todos:
  - id: create-shared-document-types
    content: Create shared document-types.ts configuration file
    status: completed
  - id: update-documents-api
    content: Update /api/documents/route.ts with shared types and error handling
    status: completed
    dependencies:
      - create-shared-document-types
  - id: update-checklist-api
    content: Update checklist API to use shared document types
    status: completed
    dependencies:
      - create-shared-document-types
  - id: fix-application-get-query
    content: Fix application GET query to use file_key instead of file_url
    status: completed
  - id: add-auth-headers-documents-page
    content: Add Authorization headers to documents page fetch calls
    status: completed
  - id: add-auth-headers-app-documents-page
    content: Add Authorization headers to application documents page
    status: completed
  - id: fix-delete-button-logic
    content: Fix delete button visibility to include rejected status
    status: completed
  - id: add-document-patch-endpoint
    content: Add PATCH endpoint for document updates
    status: completed
  - id: update-file-upload-component
    content: Update file-upload component to use shared types
    status: completed
    dependencies:
      - create-shared-document-types
  - id: improve-error-messages
    content: Improve error messages with actionable guidance
    status: completed
---

## Product Overview

修复学生门户文档管理系统的多个问题，确保文档上传、编辑、删除功能正常工作。

## Core Features

- 统一文档类型系统，解决 API 间类型不匹配问题
- 修复认证 header 不一致导致的授权失败
- 完善文档删除和替换逻辑
- 添加文档编辑/更新功能
- 改进错误处理和用户反馈
- 修复数据库查询字段不匹配问题

## Tech Stack

- Frontend: React 19 + TypeScript + Next.js 16
- UI: shadcn/ui + Tailwind CSS 4
- Database: Supabase (PostgreSQL)
- Storage: Supabase Storage

## Implementation Approach

### Issue 1: Document Type Mismatch (CRITICAL)

**Problem**: Three different document type systems:

- `/api/documents/route.ts`: `passport`, `diploma`, `transcript`, `language_certificate`, etc.
- `/api/student/applications/[id]/documents/checklist/route.ts`: `passport_copy`, `high_school_diploma`, `bachelor_diploma`, etc.
- `/components/ui/file-upload.tsx`: Mixed types

**Solution**: Create a shared document types configuration file and update all APIs to use it consistently.

### Issue 2: Missing file_url Column

**Problem**: Application GET API selects `file_url` but documents API uses `file_key`
**Solution**: Update queries to use correct columns and generate URLs dynamically from `file_key`

### Issue 3: Inconsistent Authorization Headers

**Problem**: Documents page uses `credentials: 'include'` without Authorization header
**Solution**: Standardize all fetch calls to use Authorization header pattern

### Issue 4: Delete Button Logic

**Problem**: Document library only shows delete for pending status; should also allow for rejected
**Solution**: Update visibility logic to show delete for `pending` and `rejected` statuses

### Issue 5: Missing Re-upload Flow

**Problem**: No direct way to replace rejected documents
**Solution**: Add replace functionality that handles document update with same type

### Issue 6: No Document Edit/Update

**Problem**: No PATCH endpoint for document metadata updates
**Solution**: Add PATCH endpoint to /api/documents/[id]/route.ts

### Issue 7: Error Handling

**Problem**: Generic error messages don't help users
**Solution**: Add specific error messages with actionable guidance

## Directory Structure

```
src/
├── lib/
│   └── document-types.ts          # [NEW] Shared document types configuration
├── app/
│   ├── api/
│   │   ├── documents/
│   │   │   ├── route.ts           # [MODIFY] Use shared types, improve error handling
│   │   │   └── [id]/
│   │   │       ├── url/route.ts   # [MODIFY] Add better error handling
│   │   │       └── route.ts       # [NEW] PATCH endpoint for document updates
│   │   └── student/applications/[id]/
│   │       ├── route.ts           # [MODIFY] Fix file_url query
│   │       └── documents/checklist/route.ts  # [MODIFY] Use shared types
│   └── (student-v2)/student-v2/
│       ├── documents/
│       │   └── page.tsx           # [MODIFY] Add auth headers, fix delete logic
│       └── applications/[id]/
│           ├── documents/page.tsx # [MODIFY] Add auth headers, improve replace flow
│           └── page.tsx           # [MODIFY] Fix file_url field
└── components/
    ├── ui/file-upload.tsx         # [MODIFY] Use shared types
    └── student-v2/document-checklist.tsx  # [MODIFY] Already has auth, verify
```

## Key Code Structures

```typescript
// lib/document-types.ts
export const DOCUMENT_TYPES = {
  passport_copy: { en: 'Passport Copy', zh: '护照复印件', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
  high_school_diploma: { en: 'High School Diploma', zh: '高中毕业证', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
  bachelor_diploma: { en: 'Bachelor Diploma', zh: '学士学位证', mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
  // ... unified types
} as const;

export const REQUIRED_DOCUMENTS_BY_DEGREE: Record<string, string[]> = {
  Bachelor: ['passport_copy', 'high_school_diploma', ...],
  Master: ['passport_copy', 'bachelor_diploma', ...],
  PhD: ['passport_copy', 'master_diploma', 'bachelor_diploma', ...],
};
```

## Agent Extensions

### SubAgent

- **code-explorer**: Search for all usages of document type strings across the codebase to ensure complete migration
- Purpose: Find all instances of old document types that need updating
- Expected outcome: Complete list of files requiring modification

### Skill

- **supabase-postgres-best-practices**: Verify database queries and column usage
- Purpose: Ensure queries use correct columns (file_key vs file_url)
- Expected outcome: Validated database schema usage