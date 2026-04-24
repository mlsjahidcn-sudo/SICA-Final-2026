---
name: partner-students-module
overview: Build a complete CRUD Students module for the partner portal with multi-section forms (Basic Info, Academic Background, Family Details), document upload management, and scalable data structures supporting future Application integration.
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Professional SaaS Dashboard
    - Clean Information Hierarchy
    - Data-Dense Tables
    - Tabbed Multi-Section Forms
    - International Education Tech
    - Consistent Card-Based Layouts
  fontSystem:
    fontFamily: Inter
    heading:
      size: 24px
      weight: 700
    subheading:
      size: 18px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#2563EB"
      - "#3B82F6"
      - "#60A5FA"
    background:
      - "#F8FAFC"
      - "#FFFFFF"
      - "#F1F5F9"
    text:
      - "#0F172A"
      - "#475569"
      - "#94A3B8"
    functional:
      - "#10B981"
      - "#EF4444"
      - "#F59E0B"
      - "#8B5CF6"
todos:
  - id: create-types-utils
    content: Create student types definition file at `src/app/(partner-v2)/partner-v2/students/lib/types.ts` with PartnerStudentDetail, StudentFormData, and array entry interfaces (EducationHistoryEntry, WorkExperienceEntry, FamilyMemberEntry, etc.). Also create `student-utils.ts` with formatter helpers.
    status: completed
  - id: create-api-routes
    content: "Create API routes: `src/app/api/partner/students/route.ts` (GET list with pagination/search/filters + POST create) and `src/app/api/partner/students/[id]/route.ts` (GET detail + PUT update). Use `requirePartner()` for auth, `getVisibleReferrerIds()` for access control, Zod validation, and proper error handling."
    status: completed
  - id: create-student-form-component
    content: Create shared `StudentForm` component at `src/app/(partner-v2)/partner-v2/students/components/student-form.tsx` - the core 6-tab form (Personal, Passport, Academic, Family, Additional, Preferences) with dynamic array field management, based on the existing admin add-student-dialog pattern but adapted as a page component.
    status: completed
    dependencies:
      - create-types-utils
  - id: create-list-page
    content: Create Students list page at `src/app/(partner-v2)/partner-v2/students/page.tsx` with stats cards (total, active, new this month, with applications), search/filter bar, data table with columns (name, email, nationality, passport, status badge, applications count, actions menu), and pagination.
    status: completed
    dependencies:
      - create-types-utils
  - id: create-new-student-page
    content: Create "New Student" page at `src/app/(partner-v2)/partner-v2/students/new/page.tsx` using the shared StudentForm component in create mode, with page header, back navigation, save/cancel actions, and success/error handling with toast notifications.
    status: completed
    dependencies:
      - create-student-form-component
  - id: create-detail-edit-pages
    content: Create student detail page at `[id]/page.tsx` (overview with info cards + quick actions) and edit page at `[id]/edit/page.tsx` (StudentForm in edit mode with pre-populated data from GET API).
    status: completed
    dependencies:
      - create-types-utils
      - create-student-form-component
---

## Product Overview

为合作伙伴门户（Partner Portal）开发一套完整的学生管理模块（Students Module）。该模块允许合作伙伴（Partner）添加、查看、编辑、管理学生信息，收集中国高校申请所需的全部学生数据，支持文档上传与管理，并为未来的申请模块集成预留数据结构。

## Core Features

- **学生列表页**：展示合作伙伴可访问的学生列表，支持搜索、筛选、分页，显示统计卡片（总数、活跃、本月新增、有申请）
- **学生详情/编辑页**：多标签页表单，6个标签页覆盖所有学生信息域：

1. **Personal** - 基本信息（姓名、邮箱、电话、出生日期、性别、国籍、地址等）、个人详细信息（中文姓名、婚姻状况、宗教）、联系方式（微信）、紧急联系人
2. **Passport & Visa** - 护照号码、有效期、签发国
3. **Academic** - 教育历史（动态数组，支持添加/删除条目）、工作经历（动态数组）、语言成绩（HSK/IELTS/TOEFL）
4. **Family** - 家庭成员信息（动态数组：姓名、关系、职业、电话等）
5. **Additional Info** - 课外活动、奖项、出版物、研究经历（均为动态数组）
6. **Preferences** - 学习模式、资金来源、奖学金申请、财务担保信息

- **新建学生入口**：从列表页通过"Add Student"按钮打开创建表单（复用编辑表单结构）
- **API 层**：完整的 CRUD API 路由（GET 列表、GET 详情、POST 创建、PUT 更新），遵循合作伙伴权限控制逻辑（管理员看全团队，成员只看自己推荐的）
- **类型定义**：完整的学生相关 TypeScript 接口和工具函数

## Data Flow

```
Partner User → Students List Page → GET /api/partner/students
                              → Student Detail/Edit Page → GET /api/partner/students/[id]
                              → Submit Form → PUT /api/partner/students/[id]
                              → Add New Student → POST /api/partner/students
                              → Documents Tab → 复用现有 /api/partner/documents 系统
```

## Key Constraints

- 遵循现有的 `requirePartner()` / `verifyPartnerAuth()` 权限验证模式
- 使用 `getVisibleReferrerIds()` 和 `canPartnerAccessStudent()` 实现数据可见性控制
- 学生创建时设置 `referred_by_partner_id` 为当前用户ID
- 支持孤儿学生模式（skip_user_creation: true，仅创建 students 表记录不创建 auth user）
- 前端使用 `getValidToken()` 从 localStorage 获取 JWT token 进行 API 认证

## Tech Stack

- **Framework**: Next.js 16 App Router (Turbopack)
- **Language**: TypeScript (strict mode)
- **UI Components**: shadcn/ui (Card, Table, Tabs, Form, Dialog, Badge, Select, Input, Button, etc.)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase PostgreSQL via `getSupabaseClient()`
- **Validation**: Zod schemas (`src/lib/validations/student.ts`)
- **Icons**: @tabler/icons-react
- **State Management**: React useState + useEffect (no external lib)
- **Toast Notifications**: sonner
- **Auth Pattern**: JWT token in localStorage + `getValidToken()` helper

## Implementation Approach

采用分层架构设计：

1. **API 层**（Route Handlers）：4 个端点（GET list, GET by ID, POST create, PUT update），全部在 `src/app/api/partner/students/` 下。每个端点使用 `requirePartner()` 或 `verifyPartnerAuth()` 进行身份验证，利用 `getVisibleReferrerIds()` 实现权限隔离。

2. **类型定义层**：在 `src/app/(partner-v2)/partner-v2/students/lib/types.ts` 定义学生相关的 TypeScript 接口（PartnerStudent, StudentFormData, 各类数组项接口），复用已有 `admin-modules.ts` 类型并扩展。

3. **前端页面层**：

- **List Page** (`page.tsx`)：统计卡片 + 搜索筛选 + 数据表格 + 分页
- **New Page** (`new/page.tsx`)：独立页面形式的新建学生表单（非弹窗，更适合复杂表单）
- **Detail Page** (`[id]/page.tsx`)：学生概览展示
- **Edit Page** (`[id]/edit/page.tsx`)：与 New Page 共享表单组件结构

4. **共享组件层** (`components/`)：提取 `StudentForm` 核心表单组件，包含 6 个标签页的完整表单字段，支持新建/编辑两种模式。

5. **参考实现**：基于 `src/components/admin/add-student-dialog.tsx`（885行）的成熟表单模式，将其从 Dialog 形式改造为 Page 组件形式。

## Architecture Design

```
src/app/(partner-v2)/partner-v2/students/
├── page.tsx                          # List page (stats + table + filters)
├── new/page.tsx                      # Create student page
├── [id]/
│   ├── page.tsx                      # Detail/overview page
│   └── edit/page.tsx                 # Edit student form page
├── components/
│   ├── student-form.tsx              # Shared 6-tab form component [CORE]
│   ├── student-list-table.tsx        # Reusable data table
│   ├── student-stats-cards.tsx       # Stats cards row
│   └── student-search-filters.tsx    # Search/filter bar
└── lib/
    ├── types.ts                      # Type definitions
    └── student-utils.ts              # Helper functions (formatters, etc.)

src/app/api/partner/students/
├── route.ts                          # GET list + POST create
└── [id]/
    └── route.ts                      # GET detail + PUT update
```

### Access Control Flow

```
Request → requirePartner() → getVisibleReferrerIds()
         ↓                           ↓
   Auth check               Build visibility filter:
   (JWT verify)             admin: self + all team members' IDs
                             member: only own ID
         ↓                           ↓
   Supabase Query           Filter students where
   (users + students)       referred_by_partner_id IN (visible IDs)
```

## Implementation Notes

- **Performance**: 列表查询使用 Supabase `.in()` 过滤 visible referrer IDs，配合分页（默认每页20条）；详情查询使用单次 JOIN 查询获取 users+students 关联数据
- **Blast radius control**: 仅新增文件，不修改任何现有文件（除 sidebar 已有 Students 导航链接无需变更）
- **Error handling**: API 端统一 try/catch + NextResponse JSON 错误响应；前端 toast 显示操作结果
- **Form state**: 使用单一 formData state 对象 + helper functions 管理 dynamic array fields (addArrayItem/removeArrayItem/updateArrayItem/updateObjectField)
- **Backward compatibility**: 创建学生时支持 skip_user_creation=true（孤儿学生模式），与现有系统一致
- **Document management**: 文档功能复用已有的 `/api/partner/documents` API，详情页中嵌入文档 Tab 引用

## Design Style

采用专业、现代的 SaaS 管理后台风格，以清晰的信息层级和数据密度为核心设计原则。整体视觉语言参考 shadcn dashboard 设计规范，结合教育科技行业的特点——专业、可信、国际化。

## Pages Design

### Page 1: Students List Page (`/partner-v2/students`)

主列表页面，采用三段式布局：

- **顶部区域**：页面标题 "Students" + 描述文字 + "Add Student" 主操作按钮
- **统计卡片区**：4 张统计卡片横排（Total Students / Active / New This Month / With Applications），每张卡片含图标、数值、标签
- **筛选区**：搜索框（按姓名/邮箱搜索）+ 国籍下拉筛选 + 状态筛选，水平排列
- **数据表格区**：全宽表格，列包含（头像+姓名、Email、国籍、护照号、状态Badge、申请数、创建时间、操作菜单），行级操作（View/Edit/Delete 下拉菜单）
- **底部**：分页控件（Previous/Page X of Y/Next）

### Page 2: Create Student Page (`/partner-v2/students/new`)

独立的全屏表单页面，采用居中容器布局：

- **顶部**：返回按钮 + 页面标题 "Add New Student"
- **表单主体**：6 标签页卡片式表单，每个标签页内容包裹在 Card 内部
- **底部固定栏**：Cancel（返回列表）+ Save（保存并返回列表）

### Page 3: Edit Student Page (`/partner-v2/students/[id]/edit`)

与 Create Page 共享同一表单组件，区别在于标题为 "Edit Student" 且预填充已有数据。

### Page 4: Student Detail Overview (`/partner-v2/students/[id]`)

学生信息总览页面，分段展示：

- **个人信息卡片**：基本信息 + 护照信息 + 联系方式
- **学术背景卡片**：最高学历 + 语言成绩
- **家庭成员卡片**：成员列表
- **快捷操作栏**：Edit / View Applications / Manage Documents 按钮

## Skills

### ui-ux-pro-max

- **Purpose**: Generate design system guidelines for the partner students module UI to ensure visual consistency with the existing partner portal design language
- **Expected outcome**: Color palette, typography recommendations, spacing system, and component usage patterns specific to this module's forms and data tables

### modern-web-app

- **Purpose**: Ensure the new students module follows established React + TypeScript + Tailwind CSS + shadcn/ui project conventions
- **Expected outcome**: Verified component patterns, file structure conventions, and best practices for building complex multi-tab forms within the partner portal context

### lucide-icons

- **Purpose**: Download required Lucide icons for the students module UI (user-related icons, document icons, academic icons, action icons)
- **Expected outcome**: SVG icon assets for all student form sections, navigation items, and action buttons