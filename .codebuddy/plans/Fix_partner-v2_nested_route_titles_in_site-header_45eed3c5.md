---
name: Fix partner-v2 nested route titles in site-header
overview: Reorder regex patterns in site-header.tsx so that nested routes under /partner-v2/students/[id]/ (applications, documents, edit, etc.) are matched before the generic /students/[id] pattern, so the correct breadcrumb title shows.
todos:
  - id: fix-partner-v2-route-patterns
    content: Fix partner-v2 nested route patterns in site-header.tsx
    status: completed
  - id: fix-student-v2-route-patterns
    content: Fix student-v2 nested route patterns in site-header.tsx
    status: completed
    dependencies:
      - fix-partner-v2-route-patterns
  - id: fix-admin-v2-route-patterns
    content: Fix admin/v2 nested route patterns in site-header.tsx
    status: completed
    dependencies:
      - fix-student-v2-route-patterns
---

## 问题描述

在 Partner 模块中，当打开学生下的申请详情页面时 (`/partner-v2/students/[id]/applications/[appId]`)，页面标题显示为 "Student Details"（学生详情），而不是正确的 "Application Details"（申请详情）。

## 根本原因

`site-header.tsx` 中的 `getPageTitle()` 函数使用正则匹配来确定页面标题。当前匹配顺序错误：`/\/partner-v2\/students\/[^/]+/` 模式会优先匹配到 `/students/[id]/applications/[appId]` 路径，导致显示"学生详情"。

## 解决方案

在 `getPageTitle()` 函数中，将更具体的嵌套路由模式（如 `/students/[id]/applications/[appId]`）放在通用的 `/students/[id]` 模式之前，确保路径被正确识别。

## 技术方案

### 修改文件

- `/Users/jahidabdullah/Downloads/SICA-Final-2026-coze/src/components/site-header.tsx`

### 实现方式

在 `getPageTitle()` 函数的动态路由匹配部分，重新排序正则表达式，确保更具体的嵌套路由模式优先匹配：

1. **partner-v2 模块**：在 `/\/partner-v2\/students\/[^/]+/` 模式之前添加：

- `/students/[id]/applications/[appId]` → "Application Details"
- `/students/[id]/applications` → "Applications"
- `/students/[id]/documents` → "Student Documents"
- `/students/[id]/edit` → "Edit Student"
- `/students/[id]/apply` → "New Application"

2. **student-v2 模块**：同样的嵌套路由修复

3. **admin/v2 模块**：同样的嵌套路由修复

### 匹配顺序

正则匹配从上到下执行，第一个匹配成功即返回。因此需要将更具体的路径模式放在前面，通用模式放在后面。