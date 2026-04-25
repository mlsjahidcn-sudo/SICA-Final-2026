---
name: admin-partner-module-audit-fix
overview: 全面审查 Admin 合作伙伴学生/申请模块的 4 个页面、5 个 API 端点和 3 个组件，发现并修复 9 个问题：缺少编辑页、详情页数据获取效率低下、分页与过滤逻辑冲突、类型不一致等。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Enterprise Admin
    - Dashboard UI
    - Clean Layout
    - Card-based Forms
    - Consistent with Existing
  fontSystem:
    fontFamily: Inter
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#2563EB"
      - "#3B82F6"
      - "#60A5FA"
    background:
      - "#FFFFFF"
      - "#F8FAFC"
      - "#F1F5F9"
    text:
      - "#0F172A"
      - "#475569"
      - "#94A3B8"
    functional:
      - "#10B981"
      - "#EF4444"
      - "#F59E0B"
todos:
  - id: fix-api-routes
    content: "修复 API 层: partner-students GET 添加 id 参数+过滤前置; partner-applications GET 添加 id 参数; transfer API 统一返回格式"
    status: completed
  - id: create-edit-page
    content: "[MODIFY+NEW] 创建学生编辑页 partner-students/[id]/edit/page.tsx 并修复详情页 Edit 链接指向"
    status: completed
    dependencies:
      - fix-api-routes
  - id: fix-detail-pages
    content: 修改学生详情页和申请详情页使用 id 参数精准查询替代 limit=100 全量拉取
    status: completed
    dependencies:
      - fix-api-routes
  - id: fix-list-page-filtering
    content: "修复学生列表页 status/nationality 过滤逻辑: 服务端过滤+正确的分页计数+统计数字更新"
    status: completed
    dependencies:
      - fix-api-routes
  - id: fix-types-consistency
    content: "修正 admin-modules.ts 类型定义: referred_by_partner_id 可选化+ApplicationWithPartner 字段对齐"
    status: completed
  - id: verify-all
    content: 最终 lint 检查+回归验证所有 11 个文件零错误
    status: completed
    dependencies:
      - fix-api-routes
      - create-edit-page
      - fix-detail-pages
      - fix-list-page-filtering
      - fix-types-consistency
---

## Product Overview

全面审查并修复 Admin Portal 中 Partner Students 和 Partner Applications 模块的所有问题，包括列表页、详情页、API 端点和可复用组件，确保模块功能完整、数据准确、性能合理。

## Core Issues Found (9 issues, 3 critical/3 medium/3 low)

### Critical Issues

1. **缺少学生编辑页面 (404)**: 学生详情页的 "Edit" 按钮链接到 `/admin/v2/partner-students/[id]/edit`，但该路径不存在（`[id]` 目录下无 `edit/page.tsx`）
2. **详情页数据获取效率极低**: 学生详情和申请详情都通过 `?limit=100/200` 获取全部数据再内存 `find()` 单条记录，应添加专用单条查询参数或 API
3. **国籍过滤在分页之后执行**: GET partner-students API 先 slice 分页再做 nationality 过滤，导致分页数字不准、每页结果数不一致、统计不匹配

### Medium Issues

4. **Status 过滤仅在客户端执行且影响分页**: 前端客户端过滤 status 后 totalPages 未更新，导致显示多余空白页
5. **PartnerStudent 类型 `referred_by_partner_id` 为必填 string** 但逻辑上可能为 null
6. **Transfer API 返回格式不一致**: 返回 `{ message }` 而非 `{ success: true, message }`

### Low Issues

7. **过滤后统计数字不更新**: CardDescription 的 "X of Y total" 中 Y 来自未过滤的服务端 stats
8. **ApplicationWithPartner 类型字段名不一致**: API 返回 `referred_by_partner:` 无可选标记 vs 类型定义 `?:`
9. **申请列表 search 仅内存过滤**: Supabase 不支持嵌套 OR 查询所以内存搜索，大数据量时有性能隐患（当前可接受）

## Tech Stack

- Next.js 16 App Router (React + TypeScript)
- Supabase (PostgreSQL) as database and auth
- shadcn/ui component library
- Tailwind CSS for styling
- sonner for toast notifications

## Implementation Approach

采用分层修复策略：先修复阻断性问题（404 链接、API 逻辑错误），再优化性能和一致性。

### 关键技术决策：

1. **详情页优化**: 在现有 list API 中添加 `id` 查询参数支持单条记录精确查询，避免全量拉取。这是最小改动方案——不需要新建 API route，只需在现有 GET 中加一个 `if (id)` 分支。
2. **国籍/状态过滤前置到数据库层**: 将 nationality 和 status 过滤移到 Supabase query `.eq()` / `.or()` 调用中，在分页之前执行。
3. **编辑页面**: 基于 partner-v2 已有的 edit 页面模式创建 admin 版本，复用相同的表单验证逻辑但使用 admin API 端点。
4. **类型统一**: 将 `PartnerStudent.referred_by_partner_id` 改为可选，将 Transfer API 返回格式对齐其他端点。

### 性能考量：

- 详情页从 O(N) 全量扫描降为 O(1) 单条查询
- 过滤操作从 O(N) 内存遍历降为数据库级索引查询
- 分页准确性保证：先过滤 → 再分页 → 返回准确的 totalCount

## Architecture Design

```
Admin Partner Module (修复后)

前端页面:
  partner-students/page.tsx          -- 列表(修复过滤+分页)
  partner-students/[id]/page.tsx     -- 详情(修复数据获取)
  partner-students/[id]/page.tsx     -- [NEW] 编辑页
  partner-applications/page.tsx      -- 列表(修复统计)
  partner-applications/[id]/page.tsx -- 详情(修复数据获取)

API Routes:
  GET  partner-students              -- +id参数, 过滤前置
  POST partner-students              -- 不变
  PATCH partner-students/[id]/toggle -- 不变
  POST  partner-students/[id]/transfer -- 统一返回格式
  GET  partner-applications          -- +id参数
  POST partner-applications           -- 不变
  POST  partner-applications/[id]/approve -- 不变
  POST  partner-applications/[id]/reject  -- 不变

Components:
  AdminStudentCreateDialog           -- 不变
  AdminApplicationCreateDialog        -- 不变
  StudentTransferDialog               -- 不变
  [NEW] AdminStudentEditDialog        -- 编辑表单弹窗/页面
```

## Directory Structure

```
src/app/admin/(admin-v2)/v2/partner-students/
  page.tsx                           # [MODIFY] 修复 status 客户端过滤+分页+统计
  [id]/
    page.tsx                         # [MODIFY] 使用 id 参数精准查询
    edit/
      page.tsx                       # [NEW] 学生编辑页面

src/app/api/admin/partner-students/
  route.ts                          # [MODIFY] 添加 id 参数+ nationality/status 过滤前置
  [id]/
    toggle-status/route.ts          # 不变
    transfer/route.ts               # [MODIFY] 统一返回 success 格式

src/app/api/admin/partner-applications/
  route.ts                          # [MODIFY] 添加 id 参数
  [id]/
    approve/route.ts                # 不变
    reject/route.ts                 # 不变

src/lib/types/admin-modules.ts      # [MODIFY] 类型修正
```

## 设计风格

延续现有的 Admin Dashboard 设计语言——使用 shadcn/ui 组件库保持一致性。整体采用现代企业级后台管理风格，深色侧边栏 + 浅色内容区的经典布局。编辑页面采用与详情页一致的卡片布局，表单字段使用两列网格排列，与创建对话框的设计语言保持呼应。

## 页面设计

仅新增一个页面：学生编辑页面 (`partner-students/[id]/edit`)。该页面采用与创建对话框相同的字段布局（姓名、邮箱、电话、国籍、性别等），但作为独立的全屏编辑页面呈现，顶部有保存/取消按钮。页面包含个人基本信息编辑区和合作伙伴重新分配区两部分。

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 在实现过程中快速定位相关联的类型定义、组件引用和 API 调用链
- Expected outcome: 准确找到所有需要同步修改的引用点，避免遗漏

### Skill

- **ui-ux-pro-max**
- Purpose: 为新创建的学生编辑页面提供设计参考和组件样式指南
- Expected output: 确保新编辑页面与现有 admin dashboard 视觉一致