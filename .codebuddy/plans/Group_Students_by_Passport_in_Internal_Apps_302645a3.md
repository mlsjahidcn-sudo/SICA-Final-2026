---
name: Group_Students_by_Passport_in_Internal_Apps
overview: Modify internal applications table to group applications by passport number with expandable rows showing all universities applied to, with summary badges and statistics per student.
todos:
  - id: modify-api-endpoint
    content: Add grouped query parameter to internal-apps API endpoint
    status: completed
  - id: create-grouped-component
    content: Create GroupedStudentRow expandable component with Collapsible
    status: completed
  - id: update-page-view-toggle
    content: Add view toggle and integrate grouped component in page
    status: completed
    dependencies:
      - create-grouped-component
  - id: create-student-detail-page
    content: Create student detail page with passport dynamic route
    status: completed
    dependencies:
      - modify-api-endpoint
  - id: test-grouped-functionality
    content: Test grouped view, toggle, and all actions work correctly
    status: completed
    dependencies:
      - update-page-view-toggle
      - create-student-detail-page
---

## 产品概述

将 Internal Applications 管理页面改造为按学生分组视图，通过护照号码识别同一学生的多个大学申请，支持折叠展开查看详情。

## 核心功能

- **学生分组视图**: 通过护照号码将同一学生的多个申请分在一组
- **折叠展开交互**: 点击展开查看该学生的所有大学申请详情
- **摘要信息显示**: 学生姓名、申请数量、大学列表徽章、状态汇总统计
- **视图模式切换**: 在分组视图和扁平列表视图之间切换
- **学生详情页面**: 专用页面查看单个学生的所有申请详情

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **语言**: TypeScript 5
- **UI 组件**: shadcn/ui (Collapsible, ToggleGroup, Badge)
- **样式**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)

## 实现方案

### API 层改造

在现有 GET `/api/admin/internal-apps` 端点添加 `grouped=true` 查询参数：

- 当 `grouped=true` 时，按护照号码分组返回聚合数据
- 返回结构: `{ student_name, passport, nationality, applications: [], stats: { total, pending, processing, accepted } }`
- 处理边界情况：无护照的申请作为单独分组

### 前端组件架构

1. **GroupedStudentRow 组件**: 使用 shadcn/ui Collapsible 实现可展开的学生分组行
2. **视图切换**: 使用 ToggleGroup 在分组/扁平视图间切换
3. **学生详情页**: 动态路由 `/admin/v2/internal-apps/student/[passport]` 显示单个学生所有申请

### 数据流

```
API Request (grouped=true) 
  → Supabase Query (SELECT with passport grouping)
  → Grouped Response (students with applications array)
  → Frontend State (groupedApplications)
  → GroupedStudentRow (expandable rows)
```

## 目录结构

```
src/
├── app/
│   ├── admin/(admin-v2)/v2/internal-apps/
│   │   ├── page.tsx                    # [MODIFY] 添加分组视图逻辑和切换
│   │   └── student/
│   │       └── [passport]/
│   │           └── page.tsx            # [NEW] 学生详情页
│   └── api/admin/internal-apps/
│       └── route.ts                    # [MODIFY] 添加分组查询支持
└── components/admin/
    └── grouped-student-row.tsx         # [NEW] 可展开学生分组行组件
```

## 关键代码结构

### GroupedApplication 接口

```typescript
interface GroupedApplication {
  passport: string | null
  student_name: string
  nationality: string | null
  applications: InternalApplication[]
  stats: {
    total: number
    pending: number
    processing: number
    accepted: number
    rejected: number
  }
  universities: string[]
}
```

## Agent Extensions

### Skill

- **supabase-postgres-best-practices**
- Purpose: Optimize the grouping query for performance with large datasets
- Expected outcome: Efficient SQL query for grouping applications by passport