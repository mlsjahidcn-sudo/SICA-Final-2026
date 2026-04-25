---
name: Partner Portal Bug Fixes
overview: Fix identified bugs in partner portal including debug console logs, incorrect column references, and icon library inconsistencies.
todos:
  - id: fix-column-name
    content: 修复 Partner Students API 列名错误
    status: completed
  - id: remove-analytics-logs
    content: 移除 Partner Analytics API 调试日志
    status: completed
  - id: remove-new-app-logs
    content: 移除新建申请页面调试日志
    status: completed
  - id: fix-layout-icons
    content: 统一 Layout 页面图标库
    status: completed
  - id: fix-compare-icons
    content: 统一大学比较页面图标库
    status: completed
  - id: fix-tasks-icons
    content: 统一任务页面图标库
    status: completed
---

## Product Overview

修复合作伙伴门户中已识别的所有 Bug

## Core Features

- 修复 Partner Students API 中的错误列名引用
- 移除 Partner Analytics API 中的调试日志
- 移除新建申请页面中的调试日志
- 统一合作伙伴门户的图标库为 @tabler/icons-react

## Tech Stack

- Framework: Next.js 16 (App Router)
- Core: React 19
- Language: TypeScript 5
- Database: Supabase (PostgreSQL)
- Icons: @tabler/icons-react

## Bugs to Fix

### Critical Bugs

**1. Partner Students [id] API - Wrong Column Name**

- File: `src/app/api/partner/students/[id]/route.ts`
- Line 95: `programs.degree` should be `degree_level`
- Fix: Change `degree` to `degree_level` in the SELECT query

**2. Partner Analytics API - Debug Console Logs**

- File: `src/app/api/partner/analytics/route.ts`
- Lines 41, 43, 45, 64: Debug console.log statements
- Fix: Remove all debug console.log statements (keep console.error for error logging)

**3. Applications/New Page - Debug Console Logs**

- File: `src/app/(partner-v2)/partner-v2/applications/new/page.tsx`
- Lines 280, 304, 317, 332, 344: Debug console.log statements
- Fix: Remove all debug console.log statements

### Medium Priority Bugs

**4. Icon Library Inconsistency - Layout**

- File: `src/app/(partner-v2)/partner-v2/layout.tsx`
- Uses `lucide-react` icons (Loader2, Clock, XCircle)
- Fix: Replace with @tabler/icons-react equivalents (IconLoader2, IconClock, IconX)

**5. Icon Library Inconsistency - Universities Compare**

- File: `src/app/(partner-v2)/partner-v2/universities/compare/page.tsx`
- Uses `lucide-react` Loader2 icon
- Fix: Replace with @tabler/icons-react IconLoader2

**6. Icon Library Inconsistency - Tasks Page**

- File: `src/app/(partner-v2)/partner-v2/tasks/page.tsx`
- Uses multiple `lucide-react` icons
- Fix: Replace all with @tabler/icons-react equivalents

## Directory Structure

```
project-root/
├── src/app/api/partner/students/[id]/route.ts  # [MODIFY] 修复列名
├── src/app/api/partner/analytics/route.ts  # [MODIFY] 移除调试日志
├── src/app/(partner-v2)/partner-v2/applications/new/page.tsx  # [MODIFY] 移除调试日志
├── src/app/(partner-v2)/partner-v2/layout.tsx  # [MODIFY] 统一图标库
├── src/app/(partner-v2)/partner-v2/universities/compare/page.tsx  # [MODIFY] 统一图标库
└── src/app/(partner-v2)/partner-v2/tasks/page.tsx  # [MODIFY] 统一图标库
```