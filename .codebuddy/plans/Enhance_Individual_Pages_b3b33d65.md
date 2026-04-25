---
name: Enhance Individual Pages
overview: Enhance individual applications list and student detail pages with improved UI, status handling and feature parity.
todos:
  - id: enhance-individual-apps-list
    content: 增强 individual-applications/page.tsx - 添加优先级列、状态图标、快速操作按钮和刷新功能
    status: completed
  - id: enhance-student-detail
    content: 增强 students/[id]/page.tsx - 更新状态颜色映射、添加优先级星级显示
    status: completed
  - id: verify-typescript
    content: 验证 TypeScript 编译
    status: completed
    dependencies:
      - enhance-individual-apps-list
      - enhance-student-detail
---

## 需求概述

增强管理员面板中的"个人申请表列表"页面和"个人学生详情"页面，使其功能与UI与"合作伙伴申请表列表"页面保持一致。

## 核心功能增强

### 1. 个人申请表列表页面 (`/admin/v2/individual-applications`)

- 添加优先級星级显示列
- 添加状态图标和颜色配置
- 添加快速操作按钮（审批/拒绝）
- 添加刷新按钮
- 更新状态值以匹配新的多状态流程
- 添加学生列头像/图标显示

### 2. 个人学生详情页面 (`/admin/v2/students/[id]`)

- 更新状态颜色映射以支持新的状态值（in_progress, submitted_to_university 等）
- 在申请列表中显示優先級星级
- 优化统计卡片显示
- 改善整体UI一致性

## 技术方案

### 修改文件

1. `src/app/admin/(admin-v2)/v2/individual-applications/page.tsx`
2. `src/app/admin/(admin-v2)/v2/students/[id]/page.tsx`

### 实现策略

- 参考 `partner-applications/page.tsx` 中的 STATUS_CONFIG 模式
- 使用相同的图标和颜色配置
- 添加与伙伴页面一致的操作按钮
- 更新状态值映射以支持新的申请状态流程