---
name: Auto-approve Documents and Add Download for Partners
overview: Auto-approve all uploaded documents (remove pending status) and ensure partner team can download documents.
todos:
  - id: change-doc-status
    content: Change document upload status from 'pending' to 'verified' in API
    status: completed
  - id: add-download-btn
    content: Add download button to partner application details Documents tab
    status: completed
---

## Product Overview

Simplify the document workflow by auto-approving all uploaded documents and ensure partner team can download documents from the application details page.

## Core Features

- Auto-approve all uploaded documents (remove pending status, set to verified immediately)
- Add download button to the Documents tab in partner application details page
- Partner team can download any uploaded document

## Tech Stack

- Next.js 16 App Router with TypeScript
- Supabase for database and storage
- React frontend with shadcn/ui components

## Implementation Approach

1. **Change default document status**: Modify the document upload API to set `status: 'verified'` instead of `status: 'pending'` when uploading documents
2. **Add download functionality**: Add download button to the application details page Documents tab, similar to the existing implementation in the documents management page

## Directory Structure

```
project-root/
├── src/app/api/documents/route.ts  # [MODIFY] Change status from 'pending' to 'verified' on upload (line 486)
├── src/app/(partner-v2)/partner-v2/applications/[id]/page.tsx  # [MODIFY] Add download button to Documents tab
```

## Implementation Details

### File 1: `src/app/api/documents/route.ts`

- **Line 486**: Change `status: 'pending'` to `status: 'verified'`
- This ensures all uploaded documents are automatically approved

### File 2: `src/app/(partner-v2)/partner-v2/applications/[id]/page.tsx`

- **Documents Tab** (around line 679-712): Add download button for each document
- Need to fetch document `file_key` to generate download URL
- Add `handleDownload` function similar to the documents page
- Add download button next to the status badge