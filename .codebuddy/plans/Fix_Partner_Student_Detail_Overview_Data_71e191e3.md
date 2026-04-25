---
name: Fix Partner Student Detail Overview Data
overview: 修复 partner-v2 学生详情页 Overview 标签页中信息卡片和 CompletionBadge 不显示/不更新数据的问题。问题根因是 API 响应结构与前端期望不匹配。
todos:
  - id: fix-partner-student-detail-api
    content: 修改 `/api/partner/students/[id]/route.ts` GET 处理器，返回正确的嵌套 `profile` 结构
    status: completed
---

## 问题描述

在合作伙伴门户 v2 的学生详情页面 (`/partner-v2/students/[id]`) 中，Overview 标签页的摘要卡片（Contact Information、Personal Information、Passport、Emergency Contact、Study Preferences、Account Information）和 CompletionBadge 组件**无法正确显示更新后的数据**。

## 根本原因

1. **API 返回结构不一致**：`GET /api/partner/students/[id]` 接口将数据平铺返回 (`{ ...user, ...student }`)，**没有**嵌套的 `profile` 键
2. **类型定义期望嵌套结构**：`types.ts` 中的 `Student` 接口定义了 `profile?: StudentProfile`，`CompletionBadge` 和 Overview 卡片均通过 `student.profile || {}` 访问数据
3. **CompletionBadge 始终显示 0%**：由于 `student.profile` 为 `undefined`，导致 `calculateProfileCompletion(undefined)` 始终返回 0
4. **对比列表接口**：合作伙伴学生列表 API (`/api/partner/students/route.ts`) 正确返回了 `profile: studentRecord || undefined`（嵌套结构），详情接口未保持一致

## 修复方案

修改详情 API 的 GET 处理器，在返回数据中添加正确的 `profile` 嵌套结构，与 `types.ts` 中的 `Student` 接口对齐，并确保 CompletionBadge 和 Overview 卡片能正确读取数据。

## 预期效果

- CompletionBadge 显示正确的完成百分比
- Overview 标签页的所有卡片正确显示学生的最新信息
- API 数据结构与类型定义保持一致

## 技术方案

### 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript 5
- **数据库**: Supabase (PostgreSQL)

### 实现策略

修改 `/api/partner/students/[id]/route.ts` 的 GET 处理器，将平铺返回改为嵌套结构：

```typescript
// 修改前（问题代码）
return NextResponse.json({
  student: {
    ...user,
    ...student,
    id: user.id,
    email: user.email,
    phone: user.phone ?? student?.phone ?? null,
    student_id: student?.id || null,
    // ... 缺少 profile 嵌套
  },
});

// 修改后（正确结构）
return NextResponse.json({
  student: {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone ?? student?.phone ?? null,
    avatar_url: user.avatar_url,
    nationality: student?.nationality,
    created_at: user.created_at,
    student_id: student?.id || null,
    last_sign_in_at: authUser?.user?.last_sign_in_at || null,
    profile: student || undefined,  // 关键：嵌套的 profile 字段
    applications: applications || [],
    stats,
    documents: documents || [],
    documentStats,
  },
});
```

### 修改文件清单

| 文件路径 | 操作 | 说明 |
| --- | --- | --- |
| `src/app/api/partner/students/[id]/route.ts` | 修改 | GET 处理器返回正确的嵌套 profile 结构 |