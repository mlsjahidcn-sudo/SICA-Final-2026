---
name: Success Cases Display System
overview: 创建成功案例展示系统，包括公开页面展示录取成功案例（录取通知书和JW202），以及管理后台CRUD功能
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Minimalism
    - Professional
    - Document-focused
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 28px
      weight: 600
    subheading:
      size: 18px
      weight: 500
    body:
      size: 16px
      weight: 400
  colorSystem:
    primary:
      - "#062E9A"
      - "#073AB5"
    background:
      - "#F9FAFB"
      - "#FFFFFF"
    text:
      - "#111827"
      - "#4B5563"
    functional:
      - "#10B981"
      - "#F59E0B"
      - "#EF4444"
todos:
  - id: create-database-table
    content: Create success_cases table with proper schema using [subagent:code-explorer] to reference testimonials pattern
    status: completed
  - id: create-storage-bucket
    content: Configure Supabase Storage bucket for success-cases documents
    status: completed
    dependencies:
      - create-database-table
  - id: create-public-api
    content: Create public API routes for success cases (GET list and detail)
    status: completed
    dependencies:
      - create-database-table
  - id: create-admin-api
    content: Create admin API routes with full CRUD operations
    status: completed
    dependencies:
      - create-database-table
  - id: create-a4-preview-component
    content: Create A4 document preview component with proper aspect ratio
    status: completed
  - id: create-public-pages
    content: Create public success cases list and detail pages
    status: completed
    dependencies:
      - create-public-api
      - create-a4-preview-component
  - id: create-admin-list
    content: Create admin success cases list page with filters and actions
    status: completed
    dependencies:
      - create-admin-api
  - id: create-admin-form
    content: Create admin new/edit form with file upload functionality
    status: completed
    dependencies:
      - create-admin-api
      - create-a4-preview-component
  - id: add-navigation
    content: Add success cases link to admin sidebar and public navigation
    status: completed
    dependencies:
      - create-admin-list
---

## 产品概述

创建一个录取成功案例展示系统，用于公开展示学生成功录取的案例，包括录取通知书和JW202表的图片展示。

## 核心功能

- **公开页面**：展示已发布的学生成功录取案例，包含学生信息、学校信息、录取通知书和JW202表图片
- **A4文档展示**：录取通知书和JW202表按A4比例（210mm×297mm，宽高比1:1.414）显示，但缩小至适当尺寸（非原始A4大小）
- **管理员CRUD**：管理员可创建、查看、编辑、删除成功案例
- **文档上传**：支持上传PDF和图片格式的录取通知书和JW202表
- **状态管理**：支持草稿、已发布、已归档状态
- **精选案例**：可标记精选案例在首页突出显示

## 技术栈

- **Frontend**: React 19 + TypeScript + Next.js 16
- **UI Components**: shadcn/ui (Table, Card, Dialog, Image)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage (新建 `success-cases` bucket)
- **Auth**: `verifyAdmin()` from `@/lib/auth-utils`

## 实现方案

### 1. 数据库表设计

创建 `success_cases` 表，参考 `testimonials` 表结构：

- 基本信息：学生姓名、国家、目标大学、专业
- 文档：录取通知书URL、JW202表URL
- 状态：status (draft/published/archived), is_featured, display_order
- 时间：created_at, updated_at, published_at

### 2. 存储桶配置

新建 Supabase Storage bucket `success-cases` 用于存储文档图片

### 3. API设计

- **公开API**：`GET /api/success-cases` - 获取已发布案例列表
- **公开API**：`GET /api/success-cases/[id]` - 获取案例详情
- **管理API**：`/api/admin/success-cases` - 完整CRUD操作

### 4. 页面设计

- **公开页面**：`src/app/(public)/success-cases/page.tsx` - 案例列表
- **公开详情**：`src/app/(public)/success-cases/[id]/page.tsx` - 案例详情
- **管理页面**：`src/app/admin/(admin-v2)/v2/success-cases/page.tsx` - 管理列表
- **管理新建**：`src/app/admin/(admin-v2)/v2/success-cases/new/page.tsx`
- **管理编辑**：`src/app/admin/(admin-v2)/v2/success-cases/[id]/edit/page.tsx`

### 5. A4文档显示组件

创建专用的A4文档预览组件，使用 Tailwind 的 `aspect-[1/1.414]` 保持A4比例：

- 固定宽度（如400px或自适应）
- 保持A4宽高比
- 支持点击放大/灯箱查看

## 目录结构

```
src/
├── app/
│   ├── (public)/
│   │   └── success-cases/
│   │       ├── page.tsx           # [NEW] 公开案例列表页
│   │       └── [id]/
│   │           └── page.tsx       # [NEW] 案例详情页
│   ├── admin/(admin-v2)/v2/
│   │   └── success-cases/
│   │       ├── page.tsx           # [NEW] 管理列表页
│   │       ├── new/
│   │       │   └── page.tsx       # [NEW] 新建案例页
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx   # [NEW] 编辑案例页
│   └── api/
│       ├── success-cases/
│       │   └── route.ts           # [NEW] 公开API (GET)
│       └── admin/
│           └── success-cases/
│               ├── route.ts       # [NEW] 管理API (GET, POST)
│               └── [id]/
│                   └── route.ts   # [NEW] 管理API (GET, PUT, DELETE)
├── components/
│   ├── admin-v2/
│   │   └── success-cases-list.tsx # [NEW] 管理列表组件
│   └── ui/
│       └── a4-document-preview.tsx # [NEW] A4文档预览组件
└── lib/
    └── success-cases-storage.ts    # [NEW] 存储工具函数
```

## 设计风格

采用现代简约风格，突出展示A4文档的专业感和可信度。

## 页面设计

### 公开页面 - 案例列表

- **头部**：标题"成功案例"，副标题说明
- **筛选区**：按国家、学校筛选
- **案例卡片网格**：响应式布局（sm:2列, md:3列, lg:4列）
- **卡片内容**：学生信息、学校logo、专业、文档缩略图
- **分页**：每页12个案例

### 公开页面 - 案例详情

- **左侧**：学生信息卡片（姓名、国家、录取学校、专业、录取时间）
- **右侧**：文档预览区
- 录取通知书：A4比例缩小显示，支持点击放大
- JW202表：A4比例缩小显示，支持点击放大
- **底部**：相关案例推荐

### 管理页面 - 案例列表

参考 `blog-list.tsx` 结构：

- **统计卡片**：总数、已发布、草稿、精选
- **表格列**：学生姓名、学校、专业、状态、创建时间、操作
- **操作**：查看、编辑、删除、发布/取消发布、设为精选

### 管理页面 - 新建/编辑表单

- **基本信息**：学生姓名（中英文）、国家、国家代码
- **录取信息**：大学名称（中英文）、专业名称（中英文）、录取时间
- **文档上传**：
- 录取通知书上传（PDF/图片，最大10MB）
- JW202表上传（PDF/图片，最大10MB）
- 实时预览缩略图
- **发布设置**：状态选择、精选标记、排序权重

## Agent Extensions

### Skill

- **supabase-postgres-best-practices**
- Purpose: Design optimized database schema for success_cases table with proper indexes
- Expected outcome: Efficient table structure with RLS policies and indexes

### SubAgent

- **code-explorer**
- Purpose: Search existing similar implementations (testimonials, blog) to follow established patterns
- Expected outcome: Consistent code structure matching project conventions