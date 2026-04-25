---
name: fix-partner-student-saving
overview: "Fix all saving issues in the partner-v2 student module, including: validation error display bug (string split into chars), study_mode/funding_source enum mismatch between form and Zod schema, missing field_of_study_legacy handling in PUT route, excessive debug logging, and use of authFetch for automatic token refresh."
todos:
  - id: fix-zod-schema
    content: Add field_of_study_legacy and gpa_legacy passthrough fields to Zod createStudentSchema in student.ts
    status: completed
  - id: fix-error-handling
    content: "Fix student-form.tsx: normalize API errors to string format, switch fetch to authFetch, remove all debug logs"
    status: completed
    dependencies:
      - fix-zod-schema
  - id: fix-empty-form-data
    content: Add missing scholarship_application and financial_guarantee fields to createEmptyFormData in student-utils.ts
    status: completed
  - id: remove-api-debug-logs
    content: Remove debug console.log statements from POST route in api/partner/students/route.ts
    status: completed
---

## Product Overview

Fix all saving issues in the Partner Student Module so that partners can successfully create and update students without errors.

## Core Features

- Fix validation error display bug where error messages are split into individual characters
- Fix Zod schema field name mismatch (`field_of_study_legacy`/`gpa_legacy` vs `field_of_study`/`gpa`) causing data loss on save
- Replace raw `fetch` with `authFetch` for automatic token refresh on 401
- Remove excessive debug logging from production code
- Add missing form data initialization fields
- Ensure consistent enum values between form types and Zod schema

## Tech Stack

- Framework: Next.js (existing project)
- Language: TypeScript
- Validation: Zod
- Auth: Supabase with custom token management (`auth-token.ts`)

## Implementation Approach

### Root Cause Analysis

The student saving flow has multiple compounding bugs:

1. **Character-splitting error display**: When the API returns Zod `fieldErrors` (format: `{ field: ["error msg"] }`), the frontend stores these directly into `validationErrors`. The error banner at line 272 correctly handles `Array.isArray(message) ? message[0] : message`. However, the `result.error` string from API responses like 409 can sometimes get set as a validation error value, and since JavaScript strings are iterable, they appear as individual characters when iterated. The fix is to normalize all error values to `string[]` format when setting validation errors from the API.

2. **Zod schema strips `field_of_study_legacy` and `gpa_legacy`**: The form sends these fields but Zod only knows `field_of_study` and `gpa`. Zod's `safeParse` strips unknown keys, so after validation `data.field_of_study_legacy` is `undefined`. The POST route tries to access it and gets nothing. Fix: Add `field_of_study_legacy` and `gpa_legacy` as passthrough fields in the Zod schema.

3. **No auto token refresh**: Raw `fetch` doesn't retry on 401. Switch to `authFetch` which handles token refresh automatically.

4. **Excessive debug logs**: Remove all `console.log('[DEBUG]...')` statements.

5. **Missing fields in `createEmptyFormData()`**: `scholarship_application` and `financial_guarantee` are not initialized.

6. **Enum inconsistency**: Form types use underscores (`full_time`, `self_funded`) while Zod accepts both. Normalize to underscore format consistently.

## Implementation Notes

- When normalizing API validation errors, convert Zod `fieldErrors` format (`{ field: ["msg"] }`) to a flat format matching the form's `ValidationErrors` type (`{ field: "msg" }`) by taking the first element of each array
- The `authFetch` wrapper already exists in `@/lib/auth-token.ts` and handles 401 retry with token refresh - just switch from raw `fetch` + manual `Authorization` header to `authFetch`
- After adding `field_of_study_legacy` and `gpa_legacy` to the Zod schema, the POST and PUT routes will be able to access them from `data`
- Remove the manual `Authorization` header when switching to `authFetch` since it sets the header automatically

## Architecture Design

No architectural changes - fixing existing code in place.

## Directory Structure

```
src/
├── app/(partner-v2)/partner-v2/students/
│   ├── components/
│   │   └── student-form.tsx               # [MODIFY] Fix error normalization, switch to authFetch, remove debug logs
│   └── lib/
│       └── student-utils.ts               # [MODIFY] Add missing fields to createEmptyFormData
├── app/api/partner/students/
│   └── route.ts                           # [MODIFY] Remove debug console.logs
└── lib/
    └── validations/
        └── student.ts                     # [MODIFY] Add field_of_study_legacy, gpa_legacy to schema
```