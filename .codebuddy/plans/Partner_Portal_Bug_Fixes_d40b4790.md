---
name: Partner Portal Bug Fixes
overview: Fix identified bugs in partner portal including data structure mismatches, API inconsistencies, missing team access, validation errors, and debug code cleanup.
todos:
  - id: fix-dashboard-api
    content: 修复仪表盘 API 以包含团队成员推荐的申请
    status: completed
  - id: fix-settings-password
    content: 统一设置页面密码验证提示为 8 字符
    status: completed
  - id: remove-debug-logs
    content: 移除学生页面的调试 console.log 语句
    status: completed
  - id: fix-search-syntax
    content: 验证并修复申请搜索查询语法
    status: completed
  - id: fix-student-interface
    content: 为申请详情页添加 users 属性到 Student 接口
    status: completed
  - id: clarify-student-id
    content: 统一新申请页面的 student_id 使用逻辑
    status: completed
---

## Product Overview

修复合作伙伴门户中已识别的所有 Bug

## Core Features

- 修复仪表盘 API 缺少团队成员申请的问题
- 修复设置页面密码验证提示不一致
- 移除学生页面调试日志
- 修复申请搜索查询语法
- 修复申请详情页面缺少用户信息的问题
- 统一学生 ID 使用逻辑

## Tech Stack

- Framework: Next.js 16 (App Router)
- Core: React 19
- Language: TypeScript 5
- UI 组件: shadcn/ui
- Database: Supabase (PostgreSQL + Auth)

## Bugs to Fix

### 1. Dashboard API - Missing Team Member Applications

**File**: `src/app/api/partner/dashboard/route.ts`
**Issue**: 仪表盘 API 只获取 `partner_id` 匹配的申请，但没有包含团队成员推荐的学生申请。需要像申请列表 API 一样处理团队访问权限。

### 2. Settings Page - Password Validation Mismatch

**File**: `src/app/(partner-v2)/partner-v2/settings/page.tsx`
**Issue**: 第 174 行验证 `password.length < 6`，但第 480 行提示文字说"Must be at least 8 characters long"，消息不一致。

### 3. Students Page - Debug Console.log Statements

**File**: `src/app/(partner-v2)/partner-v2/students/page.tsx`
**Issue**: 第 121 和 126 行有调试 console.log 语句，应移除。

### 4. Applications API - Search Query Syntax

**File**: `src/app/api/applications/route.ts`
**Issue**: 第 156-164 行的 `.or()` 搜索过滤器语法可能需要调整以确保正确工作。

### 5. Application Detail - Missing `users` in Student Interface

**File**: `src/app/(partner-v2)/partner-v2/applications/[id]/page.tsx`
**Issue**: Student 接口（第 70-93 行）不包含 `users` 属性，但 API 返回 `students.users`。

### 6. New Application Page - Student ID Confusion

**File**: `src/app/(partner-v2)/partner-v2/applications/new/page.tsx`
**Issue**: Student 接口同时有 `id` (user id) 和 `student_id` (students table id)，容易混淆。

## Directory Structure

```
project-root/
├── src/app/api/partner/dashboard/route.ts  # [MODIFY] 修复团队申请访问
├── src/app/(partner-v2)/partner-v2/settings/page.tsx  # [MODIFY] 统一密码验证提示
├── src/app/(partner-v2)/partner-v2/students/page.tsx  # [MODIFY] 移除调试日志
├── src/app/api/applications/route.ts  # [MODIFY] 验证搜索语法
├── src/app/(partner-v2)/partner-v2/applications/[id]/page.tsx  # [MODIFY] 添加 users 接口
└── src/app/(partner-v2)/partner-v2/applications/new/page.tsx  # [MODIFY] 统一 student_id 使用
```