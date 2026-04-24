---
name: AdminStudentsAppsRebuild
overview: "Rebuild admin v2 Students and Applications modules: add Tabs for Individual/Partner separation, enhance apps API with student source info, add differentiated workflows per user type"
todos:
  - id: enhance-applications-api-list
    content: Modify /api/admin/applications/route.ts to return student_source and partner_info fields by joining users.referred_by_partner_id and partners table
    status: completed
  - id: enhance-applications-api-detail
    content: Modify /api/admin/applications/[id]/route.ts to return student_source and partner_info in GET response
    status: completed
    dependencies:
      - enhance-applications-api-list
  - id: update-students-page-tabs
    content: Transform src/app/admin/(admin-v2)/v2/students/page.tsx — replace source dropdown Select with Tabs component (All / Individual / Partner), each tab shows filtered data with relevant stat cards
    status: completed
    dependencies:
      - enhance-applications-api-list
  - id: update-applications-page-tabs
    content: Transform src/app/admin/(admin-v2)/v2/applications/page.tsx — add Source Tabs (All / Individual / Partner), add Source column to table showing student origin badge, add Partner info column for partner applications
    status: completed
    dependencies:
      - enhance-applications-api-detail
  - id: update-application-detail-source
    content: Enhance src/app/admin/(admin-v2)/v2/applications/[id]/page.tsx — add student source badge and partner context prominently in the header and Overview tab
    status: completed
    dependencies:
      - enhance-applications-api-detail
  - id: verify-unified-dashboard
    content: Verify admin v2 dashboard page (/admin/v2/page.tsx) reflects the new separation with combined stats
    status: completed
    dependencies:
      - update-students-page-tabs
      - update-applications-page-tabs
---

## Product Overview

重建 Admin v2 的 Students 和 Applications 模块，通过 Tabs 导航实现 Individual 学生与 Partner 学生、Individual 申请与 Partner 申请的清晰分离，同时提供管理员对所有学生档案的完整 CRUD 操作，并针对不同用户类型维护差异化工作流，最终通过统一的管理仪表盘呈现。

## Core Features

- **Individual Students 模块**：管理 self-registered 学生（`referred_by_partner_id = NULL`），包含统计概览、搜索过滤、CRUD 操作
- **Partner Students 模块**：管理 partner-referred 学生（`referred_by_partner_id` 有值），显示所属合作伙伴信息，支持转移操作
- **Individual Applications 模块**：展示来自 individual 学生的申请，标记学生来源
- **Partner Applications 模块**：展示来自 partner 学生的申请，显示合作伙伴归属和来源信息
- **Unified Dashboard**：管理员可一眼看到所有分类的统计数据
- **Full CRUD 能力**：管理员可创建、编辑、删除、查看所有学生档案和申请
- **Application Status Workflow**：针对 individual 和 partner 申请均支持完整的状态流转管理

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5
- **Database**: Supabase PostgreSQL (external: `maqzxlcsgfpwnfyleoga.supabase.co`)
- **UI Components**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Package Manager**: pnpm
- **Auth**: Service role key for admin API queries

## Implementation Approach

### 方案策略：Tabs 分离 + API 增强

基于现有代码进行增量改进，避免大规模重构。核心思路：

1. **Applications API 增强**（不创建新端点）：扩展 `GET /api/admin/applications` 的返回数据，增加 `student_source`（individual/partner_referred）和 `partner_info` 字段，使前端能正确分类显示
2. **Students 页面 Tabs 化**：将现有的 Source 下拉框替换为 Tabs 组件，提供 Individual / Partner / All 三个视图
3. **Applications 页面 Tabs 化**：新增 Source Tabs（Individual / Partner），在申请表格中增加 Source 列和 Partner 来源信息列
4. **Stats 卡片差异化**：各自页面只显示相关统计

### 关键设计决策

1. **不创建新 API 端点**：现有 `/api/admin/students` 和 `/api/admin/applications` 已支持 source 过滤，只需扩展返回字段
2. **不创建新页面路由**：在现有页面内通过 Tabs 实现分离，减少路由复杂度，保持 URL 简洁
3. **API 增强是关键**：Applications API 当前不返回学生来源类型，这是最大瓶颈，必须首先修复
4. **保持向后兼容**：现有的 unified "All" 视图保留，方便管理员查看全部数据

### API 增强详情

`GET /api/admin/applications` 改造：

- JOIN `students.users` 获取 `referred_by_partner_id`
- JOIN `partners` 表获取 partner 的 `company_name` 和 `full_name`
- 在返回数据中增加 `student_source` 字段（从 `referred_by_partner_id` 推导）
- 在返回数据中增加 `partner_info` 对象

`GET /api/admin/applications/[id]` 改造：

- 同上，增加 `student_source` 和 `partner_info`

### 数据流

```
User clicks Tabs (Individual/Partner)
  ↓
Frontend sets sourceFilter = 'individual'/'partner_referred'
  ↓
Frontend calls /api/admin/applications?source=individual&...
  ↓
API: students.users.referred_by_partner_id IS NULL / NOT NULL
  ↓
API returns student_source + partner_info in response
  ↓
Frontend renders filtered list with Source badges
```

## Directory Structure

```
src/app/
├── admin/(admin-v2)/v2/
│   ├── students/
│   │   └── page.tsx                        # [MODIFY] Add Tabs for Individual/Partner separation
│   └── applications/
│       └── page.tsx                        # [MODIFY] Add Tabs + Source column, Partner info
└── api/admin/
    ├── students/
    │   └── route.ts                        # [MODIFY] Already supports source filter
    ├── students/[id]/
    │   └── route.ts                        # [KEEP] Already works
    └── applications/
        ├── route.ts                        # [MODIFY] Add student_source + partner_info to response
        └── [id]/route.ts                   # [MODIFY] Add student_source + partner_info to response

src/components/admin/
    └── (shared student/application components already exist)
```