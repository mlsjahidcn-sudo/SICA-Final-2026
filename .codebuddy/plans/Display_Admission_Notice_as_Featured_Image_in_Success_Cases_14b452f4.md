---
name: Display Admission Notice as Featured Image in Success Cases
overview: Replace student photo thumbnail with admission notice preview in the success cases list, while keeping student photo for internal records.
todos:
  - id: api-list-url-fix
    content: Convert admission_notice_url storage path to public URL in list GET endpoint
    status: completed
  - id: api-single-url-fix
    content: Convert admission_notice_url storage path to public URL in single case GET endpoint
    status: completed
  - id: list-thumbnail-update
    content: Replace student photo thumbnail with admission notice in list component
    status: completed
    dependencies:
      - api-list-url-fix
---

## User Requirements

Display the admission notice as the featured image (thumbnail) in the success cases list instead of the student photo.

## Product Overview

The success cases management system currently shows a student photo thumbnail in the list view. The user wants to replace this with the admission notice document as the featured image.

## Core Features

- Display admission notice as thumbnail in the success cases list
- Show image preview if admission notice is an image file (JPG/PNG/WebP)
- Show PDF icon/placeholder if admission notice is a PDF file
- Keep student photo upload field in the form for internal records (no removal)
- Convert storage paths to public URLs in API responses

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui + Tabler Icons
- **Database**: Supabase PostgreSQL + Storage
- **Language**: TypeScript

## Implementation Approach

### 1. API Changes - Convert Storage Paths to Public URLs

The current API returns storage paths (e.g., `uuid/photo_timestamp.jpg`) which cannot be used directly by the frontend. Need to convert these to public URLs using Supabase's `getPublicUrl()` method.

**Files to modify:**

- `src/app/api/admin/success-cases/route.ts` - GET endpoint for list
- `src/app/api/admin/success-cases/[id]/route.ts` - GET endpoint for single case

### 2. List Component Changes

Replace the circular student photo thumbnail with an admission notice preview.

**For images**: Display the admission notice image
**For PDFs**: Display a styled PDF icon (40x40px is too small for PDF preview; use icon approach)

**File to modify:**

- `src/components/admin-v2/success-cases-list.tsx`

### 3. Form Component

No changes needed - keep the student photo upload field as-is for internal records.

## Implementation Notes

### API Response Transformation Pattern

```typescript
// In GET endpoints, before returning data:
const transformFileUrls = (item: SuccessCase) => {
  const transformed = { ...item };
  if (item.admission_notice_url) {
    const { data } = supabase.storage
      .from('success-cases')
      .getPublicUrl(item.admission_notice_url);
    transformed.admission_notice_url = data?.publicUrl || null;
  }
  // Similarly for jw202_url if needed
  return transformed;
};
```

### PDF Handling in List Thumbnail

For a 40x40px thumbnail, rendering PDF first page is impractical. Use styled PDF icon approach:

- Show `IconFileTypePdf` icon with red color
- Wrap in rounded container matching the design

## Directory Structure

```
src/
├── app/api/admin/success-cases/
│   ├── route.ts              # [MODIFY] Add public URL conversion for list endpoint
│   └── [id]/route.ts         # [MODIFY] Add public URL conversion for single case endpoint
└── components/admin-v2/
    └── success-cases-list.tsx # [MODIFY] Replace student photo with admission notice thumbnail
```