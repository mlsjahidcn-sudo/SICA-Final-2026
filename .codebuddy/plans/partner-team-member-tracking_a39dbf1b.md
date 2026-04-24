---
name: partner-team-member-tracking
overview: Track which partner team member created/updated students and applications. Show Partner Company Name + Team Member Name in admin views.
todos:
  - id: db-migration
    content: 创建数据库迁移脚本 025_add_created_by_tracking.sql，添加 created_by/updated_by 字段到 users 和 applications 表
    status: completed
  - id: partner-students-api
    content: 修改 /api/partner/students POST 添加 created_by，PUT 添加 updated_by
    status: completed
  - id: applications-api
    content: 修改 /api/applications POST 添加 created_by，PUT 添加 updated_by
    status: completed
  - id: admin-partner-students-api
    content: 修改 admin/partner-students API 返回 created_by_partner 和 updated_by_partner 嵌套数据
    status: completed
    dependencies:
      - db-migration
  - id: admin-partner-apps-api
    content: 修改 admin/partner-applications API 返回 created_by_partner 和 updated_by_partner 嵌套数据
    status: completed
    dependencies:
      - db-migration
  - id: types-update
    content: 更新 admin-modules.ts 类型定义，添加 created_by/updated_by 相关字段
    status: completed
  - id: partner-students-page
    content: 修改 Partner Students 列表页显示 Added by 列
    status: completed
    dependencies:
      - admin-partner-students-api
  - id: partner-students-detail
    content: 修改 Partner Students 详情页显示 created_by/updated_by 信息
    status: completed
    dependencies:
      - admin-partner-students-api
  - id: partner-apps-page
    content: 修改 Partner Applications 列表页显示 Added by 列
    status: completed
    dependencies:
      - admin-partner-apps-api
  - id: partner-apps-detail
    content: 修改 Partner Applications 详情页显示 created_by/updated_by 信息
    status: completed
    dependencies:
      - admin-partner-apps-api
---

## Product Overview

在 Admin Portal 的 Partner Students 和 Partner Applications 模块中，当 Partner 团队成员（team member）添加或更新学生/申请时，需要显示：

1. Partner 公司名称（已有）
2. 具体哪个团队成员添加或更新了数据（新需求）

## Core Features

### 数据库层

- 为 `users` 表（学生记录）添加 `created_by` 和 `updated_by` 字段
- 为 `applications` 表添加 `created_by` 和 `updated_by` 字段
- 记录具体的团队成员用户 ID（非组织级别）

### API 层

- **Partner 学生创建** (`/api/partner/students` POST)：添加 `created_by` = 当前用户 ID
- **Partner 学生更新** (`/api/partner/students/[id]` PUT)：添加 `updated_by` = 当前用户 ID
- **Partner 申请创建** (`/api/applications` POST)：添加 `created_by` = 当前用户 ID
- **Partner 申请更新** (`/api/applications/[id]` PUT)：添加 `updated_by` = 当前用户 ID
- **Admin API** (`/api/admin/partner-students`, `/api/admin/partner-applications`)：返回 `created_by_partner` 信息（团队成员名称 + 公司名称）

### 类型定义

- `PartnerStudent` 接口：添加 `created_by` 和 `created_by_partner` 字段
- `ApplicationWithPartner` 接口：添加 `created_by` 和 `created_by_partner` 字段

### Admin UI 层

- Partner Students 列表页：显示"Added by"列（团队成员名称）
- Partner Students 详情页：显示"Added by"和"Last updated by"信息
- Partner Applications 列表页：显示"Added by"列
- Partner Applications 详情页：显示"Added by"和"Last updated by"信息

## Edge Cases

- 旧数据没有 `created_by`：显示 "N/A"
- Admin 直接创建的数据：`created_by_partner` 为 null
- 团队成员名称需同时显示公司名称以区分不同 Partner 的成员

## Tech Stack

- Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui
- Supabase PostgreSQL - 使用 service role key 进行 admin 查询
- Lucide icons

## Implementation Approach

### 策略概述

参照现有 `referred_by_partner` 字段的模式，为 `created_by_partner` 和 `updated_by_partner` 添加相同的嵌套查询和数据结构。

### 数据库字段设计

```sql
-- users 表（学生记录）
ALTER TABLE users ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN updated_by UUID REFERENCES users(id);

-- applications 表
ALTER TABLE applications ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE applications ADD COLUMN updated_by UUID REFERENCES users(id);
```

### 数据溯源逻辑

- 当 Partner 团队成员调用 API 时，`user.id` 即为具体的团队成员 ID
- 查询时通过 `users` 表关联获取团队成员的 `full_name` 和所属公司的 `company_name`
- 保留现有的 `referred_by_partner_id`（组织级别）用于分组统计

### API 返回结构

```typescript
{
  // ... existing fields
  created_by: string | null,           // 原始 UUID
  created_by_partner: {
    id: string,
    full_name: string,
    company_name: string | null,       // 用于区分不同 Partner
  } | null,
  updated_by: string | null,
  updated_by_partner: {
    id: string,
    full_name: string,
    company_name: string | null,
  } | null,
}
```

## Directory Structure

```
migrations/                                # [NEW] 数据库迁移脚本
  025_add_created_by_tracking.sql

src/app/api/partner/students/route.ts      # [MODIFY] 添加 created_by
src/app/api/partner/students/[id]/route.ts # [MODIFY] 添加 updated_by
src/app/api/applications/route.ts          # [MODIFY] 添加 created_by
src/app/api/applications/[id]/route.ts     # [MODIFY] 添加 updated_by
src/app/api/admin/partner-students/route.ts # [MODIFY] 返回 created_by_partner
src/app/api/admin/partner-applications/route.ts # [MODIFY] 返回 created_by_partner
src/lib/types/admin-modules.ts              # [MODIFY] 类型定义更新
src/app/admin/(admin-v2)/v2/partner-students/page.tsx      # [MODIFY] 显示 Added by 列
src/app/admin/(admin-v2)/v2/partner-students/[id]/page.tsx # [MODIFY] 显示详细信息
src/app/admin/(admin-v2)/v2/partner-applications/page.tsx  # [MODIFY] 显示 Added by 列
src/app/admin/(admin-v2)/v2/partner-applications/[id]/page.tsx # [MODIFY] 显示详细信息
```

## Implementation Notes

### Grounded - 复用现有模式

- 参照 `referred_by_partner` 的实现方式（嵌套查询 users + partners 表）
- Admin API 中已有的联合查询模式（`students.users`）

### Performance

- 使用 Supabase 的嵌套 select 一次性获取所有相关数据
- 避免 N+1 查询问题

### Blast Radius

- 仅影响 Partner 相关的数据创建/更新逻辑
- Admin API 的改动仅影响列表和详情展示
- 旧数据迁移：existing records 的 `created_by` 为 NULL，UI 需要优雅处理