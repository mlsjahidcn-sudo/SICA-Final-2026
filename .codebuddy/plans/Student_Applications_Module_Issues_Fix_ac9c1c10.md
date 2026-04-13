---
name: Student Applications Module Issues Fix
overview: Fix data field inconsistencies and missing fields in student portal Applications module
todos:
  - id: fix-applications-list-page
    content: 修复列表页字段映射问题
    status: completed
  - id: fix-applications-detail-page
    content: 修复详情页字段映射问题
    status: completed
  - id: fix-applications-api-response
    content: 修复列表 API 响应格式
    status: completed
  - id: fix-autosave-select-query
    content: 修复 autosave API SELECT 查询
    status: completed
  - id: fix-checklist-degree-field
    content: 修复 checklist API degree 字段兼容
    status: completed
  - id: fix-document-checklist-auth
    content: 修复 document-checklist 组件认证
    status: completed
---

## 用户需求

检查学生门户的 Applications 模块，发现问题并修复。

## 发现的问题

### 问题 1：Programs 表字段名称不一致

- 列表页期望：`tuition_per_year`, `tuition_currency`
- API 返回：`tuition_fee_per_year`, `currency`
- 详情页期望：`duration_months`, `application_deadline_fall`, `application_deadline_spring`
- API 返回：`duration_years`, `application_end_date`

### 问题 2：API 响应缺少顶层字段

- `/api/student/applications` GET 返回 `profile_snapshot`，但页面期望 `intake` 在顶层
- 需要从 `profile_snapshot` 提取 `intake`, `personal_statement`, `study_plan` 供前端使用

### 问题 3：autosave API SELECT 查询无效

- `autosave/route.ts` 第 127-131 行尝试直接从 applications 表 SELECT `intake`, `personal_statement`, `study_plan`
- 这些字段存储在 `profile_snapshot` JSONB 列中，不是直接列

### 问题 4：checklist API 学位字段不一致

- 使用 `programs.degree_type` 但其他地方使用 `programs.degree_level`

### 问题 5：document checklist 组件缺少认证

- `document-checklist.tsx` 第 58 行调用 API 时没有 Authorization header

## 技术方案

### 修复策略

#### 1. 统一前端字段名称映射

在前端页面中添加字段映射，兼容 API 返回的实际字段名：

- `tuition_per_year` → `tuition_fee_per_year`
- `tuition_currency` → `currency`
- `duration_months` → `duration_years * 12`
- `application_deadline_fall/spring` → `application_end_date`

#### 2. API 响应标准化

在 `/api/student/applications/route.ts` GET 响应中提取 `profile_snapshot` 字段到顶层，与详情页 API 保持一致。

#### 3. 修复 autosave SELECT 查询

移除无效的 SELECT 列，改为只返回 `id`, `status`, `updated_at`, `profile_snapshot`。

#### 4. 统一 degree 字段访问

在 checklist API 中同时检查 `degree_type` 和 `degree_level`，兼容两种字段名。

#### 5. 添加认证 header

在 `document-checklist.tsx` 的 fetch 调用中添加 Authorization header。

### 涉及文件

- `src/app/(student-v2)/student-v2/applications/page.tsx` - 修复字段映射
- `src/app/(student-v2)/student-v2/applications/[id]/page.tsx` - 修复字段映射
- `src/app/api/student/applications/route.ts` - 提取 profile_snapshot 到顶层
- `src/app/api/student/applications/[id]/autosave/route.ts` - 修复 SELECT 查询
- `src/app/api/student/applications/[id]/documents/checklist/route.ts` - 兼容 degree 字段
- `src/components/student-v2/document-checklist.tsx` - 添加认证 header