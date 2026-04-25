---
name: Rebuild Individual Students & Applications Admin Views
overview: Fix admin portal Individual Students and Individual Applications pages to correctly display isolated data for self-registered students only (referred_by_partner_id = NULL).
todos:
  - id: fix-individual-students-page
    content: 修复 Individual Students 列表页,确保链接正确
    status: completed
  - id: fix-student-detail-page
    content: 修复 Student 详情页,使用 student_id 过滤申请
    status: completed
    dependencies:
      - fix-individual-students-page
  - id: fix-individual-applications-page
    content: 修复 Individual Applications 列表页,链接到正确详情页
    status: completed
  - id: verify-data-isolation
    content: 验证数据隔离,确保 Individual 和 Partner 数据完全分开
    status: completed
    dependencies:
      - fix-individual-students-page
      - fix-student-detail-page
      - fix-individual-applications-page
  - id: test-type-check
    content: TypeScript 类型检查
    status: completed
    dependencies:
      - verify-data-isolation
---

## 用户需求

重建管理员门户中的 Individual Students 和 Individual Applications 功能,确保与 Partner 数据完全隔离。

## 问题分析

1. **Individual Students 列表页**: 链接到 `/admin/v2/students/${id}`,但没有验证学生是否为 individual
2. **Student 详情页**: 获取所有 individual applications 后在客户端过滤,效率低下
3. **缺少 student_id 过滤参数**: API 支持 `student_id` 但前端未使用
4. **数据隔离不完整**: Individual 和 Partner 数据可能交叉污染

## 核心流程

- Individual student 注册 → 出现在 admin Individual Students → 申请 → 出现在 admin Individual Applications
- Student 可以查看自己的申请(Student Portal 不需要修改)

## 数据模型

- **Individual Student**: `users.referred_by_partner_id = NULL` AND `users.role = 'student'`
- **Individual Application**: 来自 individual student 的申请
- **关系**: users → students (1:1) → applications (via student_id)

## 技术栈

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL)

## 实现方案

### 1. 修复 Individual Students 列表页

- 验证链接到正确的学生详情页
- 确保 API 查询正确过滤 `referred_by_partner_id = NULL`

### 2. 修复 Student 详情页 (`/admin/v2/students/[id]`)

- 使用 `student_id` 查询参数过滤申请,而不是获取全部后客户端过滤
- 正确判断学生类型(individual vs partner)

### 3. 修复 Individual Applications 列表页

- 链接到正确的申请详情页
- 使用更高效的服务器端过滤

### 4. 确保数据隔离

- 所有查询必须验证 `referred_by_partner_id = NULL`
- Partner 申请不能出现在 Individual 列表中

## API 端点

- `GET /api/admin/individual-students?id=` - 获取单个学生
- `GET /api/admin/individual-applications?student_id=` - 获取学生的申请
- `GET /api/admin/individual-applications?id=` - 获取单个申请详情