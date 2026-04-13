---
name: Student Portal Bug Fixes
overview: Fix identified bugs in student portal including API inconsistencies, invalid search queries, incorrect column references, and debug log cleanup.
todos:
  - id: fix-search-query
    content: 修复学生申请 API 搜索查询语法
    status: completed
  - id: fix-put-column-update
    content: 修复学生申请 PUT API 列更新逻辑
    status: completed
  - id: fix-submit-column-name
    content: 修复学生申请提交 API 列名引用
    status: completed
  - id: fix-dashboard-column
    content: 修复学生仪表盘 API 列名不匹配
    status: completed
  - id: remove-debug-logs
    content: 移除学生档案 API 调试日志
    status: completed
  - id: fix-icon-library
    content: 统一编辑申请页面图标库为 Tabler
    status: completed
---

## Product Overview

修复学生门户中已识别的所有 Bug

## Core Features

- 修复学生申请 API 中的无效搜索查询语法
- 修复学生申请 PUT API 中的无效列更新（应存储到 profile_snapshot）
- 修复学生申请提交 API 中的错误列名引用
- 修复学生仪表盘 API 中的列名不匹配问题
- 移除学生档案 API 中的调试日志
- 统一编辑申请页面的图标库为 @tabler/icons-react

## Tech Stack

- Framework: Next.js 16 (App Router)
- Core: React 19
- Language: TypeScript 5
- Database: Supabase (PostgreSQL)

## Bugs to Fix

### 1. Student Applications API - Invalid Search Query Syntax

**File**: `src/app/api/student/applications/route.ts`
**Issue**: Line 76 uses `.or('programs.name.ilike.%${search}%,programs.universities.name_en.ilike.%${search}%')` - PostgREST cannot filter on nested relations like `programs.universities.name_en`.
**Fix**: Remove the nested university name filter from the search query.

### 2. Student Applications PUT API - Invalid Column Updates

**File**: `src/app/api/student/applications/[id]/route.ts`
**Issue**: Lines 159-169 try to update `personal_statement`, `study_plan`, `intake` as direct columns, but these should be stored in `profile_snapshot` JSONB column (consistent with how other APIs handle these fields).
**Fix**: Merge these fields into `profile_snapshot` instead of direct column updates.

### 3. Student Application Submit API - Wrong Column Name

**File**: `src/app/api/student/applications/[id]/submit/route.ts`
**Issue**: Lines 97-106 query `programs.name_en` but the programs table uses `name` column.
**Fix**: Update query to use `name` column instead of `name_en`.

### 4. Student Dashboard API - Column Name Mismatch

**File**: `src/app/api/student/dashboard/route.ts`
**Issue**: Lines 57-58, 104-106 query `name_en` for programs and universities, but these tables use `name` column.
**Fix**: Update to use correct column name `name`.

### 5. Student Profile API - Debug Console Logs

**File**: `src/app/api/student/profile/route.ts`
**Issue**: Lines 116-117 have debug console.log statements that should be removed for production.
**Fix**: Remove the debug logging statements.

### 6. Edit Application Page - Inconsistent Icon Library

**File**: `src/app/(student-v2)/student-v2/applications/[id]/edit/page.tsx`
**Issue**: Uses `lucide-react` icons while all other student portal pages use `@tabler/icons-react`.
**Fix**: Replace Lucide icons with Tabler icons for consistency.

## Directory Structure

```
project-root/
├── src/app/api/student/applications/route.ts  # [MODIFY] 修复搜索查询语法
├── src/app/api/student/applications/[id]/route.ts  # [MODIFY] 修复列更新逻辑
├── src/app/api/student/applications/[id]/submit/route.ts  # [MODIFY] 修复列名引用
├── src/app/api/student/dashboard/route.ts  # [MODIFY] 修复列名不匹配
├── src/app/api/student/profile/route.ts  # [MODIFY] 移除调试日志
└── src/app/(student-v2)/student-v2/applications/[id]/edit/page.tsx  # [MODIFY] 统一图标库
```