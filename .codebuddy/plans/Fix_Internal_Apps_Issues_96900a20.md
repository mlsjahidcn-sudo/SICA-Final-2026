---
name: Fix Internal Apps Issues
overview: Fix update failure, UI inconsistencies, and date handling issues in the internal-apps module
todos:
  - id: fix-api-date-handling
    content: Fix date field handling in API route - convert empty strings to null
    status: completed
  - id: fix-new-page-container
    content: Update new page container to match standard admin-v2 pattern
    status: completed
  - id: remove-unused-import
    content: Remove unused Separator import from new page
    status: completed
---

## Product Overview

修复 Internal Apps 模块中导致更新失败的问题以及 UI 一致性问题

## Core Features

- 修复日期字段更新失败：空字符串应转为 null 发送给数据库
- 修复 New Page 的容器样式不一致问题
- 移除未使用的 Separator 导入

## Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- UI: shadcn/ui + Tailwind CSS
- Database: Supabase (PostgreSQL)

## Implementation Approach

### Issue 1: Date Field Update Failure

**Root Cause**: PostgreSQL DATE columns cannot accept empty strings. When frontend date inputs are cleared, they send empty strings which cause update failures.

**Solution**: In the PUT handler, convert empty string date values to `null` before sending to Supabase.

**File**: `src/app/api/admin/internal-apps/[id]/route.ts`

**Fix Pattern**:

```typescript
// Before (problematic)
if (application_date !== undefined) updateData.application_date = application_date;

// After (fixed)
if (application_date !== undefined) {
  updateData.application_date = application_date || null;
}
```

### Issue 2: UI Container Inconsistency

**Root Cause**: The new page uses outdated container classes (`p-6 max-w-5xl mx-auto`) while other pages use the standard pattern (`flex flex-col gap-6 p-6`).

**Solution**: Apply the same container pattern used in the edit page to the new page.

**File**: `src/app/admin/(admin-v2)/v2/internal-apps/new/page.tsx`

### Issue 3: Unused Import

**Root Cause**: `Separator` component is imported but never used in the file.

**Solution**: Remove the unused import to clean up code.

## Directory Structure

```
src/app/
├── api/admin/internal-apps/[id]/
│   └── route.ts           # [MODIFY] Fix date field handling in PUT handler
└── admin/(admin-v2)/v2/internal-apps/
    └── new/
        └── page.tsx       # [MODIFY] Fix container layout and remove unused import
```

## Implementation Notes

- The edit, view, and copy pages have already been fixed in previous work
- Only the new page and API route need modification
- PostgreSQL DATE type strictly rejects empty strings - must use NULL for empty dates