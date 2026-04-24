---
name: Fix Individual Application 404 Error
overview: Debug and fix why individual student application detail page returns 404 - the API query for fetching by ID is not finding the application record.
todos:
  - id: create-general-api
    content: Create new API endpoint /api/admin/applications/[id] to return basic application info with partner_id
    status: completed
  - id: update-detail-page
    content: Update applications/[id]/page.tsx to first fetch basic info, then call appropriate API based on partner_id
    status: completed
    dependencies:
      - create-general-api
  - id: test-both-types
    content: Test both individual and partner application details work correctly
    status: completed
    dependencies:
      - update-detail-page
---

## 用户需求

修复管理员门户中个人学生申请详情页显示"未找到"的问题。

## 问题描述

- 用户在 Individual Applications 列表中点击某个申请时，详情页显示 "Application not found"
- API 调用返回 404: GET /api/admin/individual-applications?id=xxx
- 问题路径: /admin/v2/applications/[id]

## 核心功能

1. 创建通用申请详情 API 端点
2. 修改详情页，根据 partner_id 判断申请类型并调用正确 API
3. 支持显示个人学生和合作伙伴学生的申请详情

## 技术方案

### 问题根因

详情页 `applications/[id]/page.tsx` 只调用 `individual-applications` API，无法处理所有申请类型。

### 解决方案

1. 创建新的通用 API 端点 `/api/admin/applications/[id]/route.ts`

- 返回申请基础信息（包括 partner_id）
- 不区分个人或合作伙伴申请

2. 修改详情页 `applications/[id]/page.tsx`

- 首先调用通用 API 获取基础信息
- 根据 partner_id 判断申请类型：
    - partner_id = null → 个人学生申请 → 调用 individual-applications API
    - partner_id ≠ null → 合作伙伴申请 → 调用 partner-applications API

### 文件修改

1. 创建: `src/app/api/admin/applications/[id]/route.ts` - 通用申请详情 API
2. 修改: `src/app/admin/(admin-v2)/v2/applications/[id]/page.tsx` - 详情页 fetchApplication 函数