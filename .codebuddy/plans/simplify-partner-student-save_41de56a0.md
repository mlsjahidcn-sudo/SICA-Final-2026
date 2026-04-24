---
name: simplify-partner-student-save
overview: Remove Zod validation from POST and PUT API routes, pass form data directly to Supabase. Simplify the student form to only check email + full_name as required fields on the frontend, and remove the complex 11-field validation.
todos:
  - id: simplify-post-route
    content: Remove Zod from POST route, map body fields directly to Supabase insert
    status: completed
  - id: simplify-put-route
    content: Remove Zod from PUT route, map body fields directly to Supabase update
    status: completed
  - id: simplify-form-validation
    content: Reduce frontend required fields to email + full_name only
    status: completed
    dependencies:
      - simplify-post-route
      - simplify-put-route
---

## Product Overview

Simplify the partner student creation/edit form and API routes so students can be saved without Zod validation errors or overly strict required fields.

## Core Features

- Remove Zod schema validation from POST and PUT API routes — accept raw body and pass fields directly to Supabase
- Keep only the email duplicate check (409) as a database constraint
- Reduce frontend required fields to only email + full_name
- Map form fields to database columns directly in the API routes without schema stripping

## Tech Stack

- Framework: Next.js (existing project)
- Language: TypeScript
- Validation: Remove Zod from student API routes
- Database: Supabase

## Implementation Approach

Strip out Zod validation from both `POST /api/partner/students` and `PUT /api/partner/students/[id]`. Accept the raw request body, map the known fields directly to Supabase insert/update payloads, and let the database handle constraints. On the frontend, only require `email` and `full_name` — everything else is optional.

## Implementation Notes

- The Zod schema file (`student.ts`) will NOT be deleted — it may be used elsewhere. We simply stop importing it in the API routes.
- The `field_of_study_legacy` / `gpa_legacy` mapping problem goes away because we read directly from `body` instead of `validationResult.data` (which strips unknown keys).
- Keep `requirePartner` auth check — user said "no security" meaning no Zod validation, but we still need to know which partner is creating the student.
- The `skip_user_creation` flag stays as-is (orphan mode default).

## Architecture Design

No architectural changes. Just simplifying the data flow:

**Before:** Form → authFetch → API → Zod safeParse → stripped data → Supabase
**After:** Form → authFetch → API → direct body mapping → Supabase

## Directory Structure

```
src/
├── app/(partner-v2)/partner-v2/students/
│   └── components/
│       └── student-form.tsx               # [MODIFY] Reduce required fields to email + full_name only
├── app/api/partner/students/
│   └── route.ts                           # [MODIFY] Remove Zod, map body fields directly to Supabase
├── app/api/partner/students/[id]/
│   └── route.ts                           # [MODIFY] Remove Zod, map body fields directly to Supabase
```