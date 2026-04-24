---
name: Fix_Admin_Student_Edit_Empty_Fields
overview: 修复管理员门户学生编辑页面表单字段为空的问题：Admin GET API (`/api/admin/students/[id]`) 的 `students()` 子查询缺少 6 个关键字段（emergency_contact_phone, passport_expiry_date, emergency_contact_relationship, institution_name, field_of_study, graduation_date），导致编辑表单这些字段始终为空。需要同时修复 GET 查询和 PUT 后查询。
todos:
  - id: fix-admin-student-api-get
    content: 修复 Admin Student API GET 查询的 students() 子查询，追加 5 个缺失列：passport_expiry_date, emergency_contact_relationship, institution_name, field_of_study, graduation_date
    status: completed
  - id: fix-admin-student-api-put
    content: 修复 Admin Student API PUT 重查的 students() 子查询，追加同样的 4 个缺失列（passport_expiry_date 已有）
    status: completed
    dependencies:
      - fix-admin-student-api-get
  - id: verify-fix
    content: 验证修复：确认 API 响应包含全部字段，前端表单正确填充已有学生数据
    status: completed
    dependencies:
      - fix-admin-student-api-get
      - fix-admin-student-api-put
---

## 产品概述

修复管理员门户（Admin Portal）中学生编辑功能的核心缺陷：从管理后台编辑学生信息时（包括合作伙伴学生和个人学生），表单字段对已存在数据显示为空。

## 核心功能问题

- **根本原因**：Admin Student GET API (`GET /api/admin/students/[id]`) 的 `students()` 子查询 Select 列表不完整，缺少 5 个数据库字段列
- **影响范围**：

1. 管理员编辑页面：`/admin/v2/students/[id]/edit` — 全页编辑表单中 5 个字段永远显示空值
2. 管理员内联编辑弹窗：`EditStudentDialog` 组件 — 同样受影响的 5 个字段

- **缺失的字段**：`passport_expiry_date`（护照过期日期）、`emergency_contact_relationship`（紧急联系人关系）、`institution_name`（学校名称）、`field_of_study`（专业名称）、`graduation_date`（毕业日期）
- **对比验证**：Partner 端的 `/api/partner/students/[id]` 使用 `.select('*')` 返回全部列，故 Partner 编辑功能正常工作，不受此 Bug 影响

## 受影响用户操作路径

1. 管理员进入 Partner Students 列表 → 点击学生 → Edit Student → 表单中 5 个字段为空
2. 管理员进入 Individual Students 列表 → 点击学生 → Edit Student → 同样问题
3. 在学生详情页面使用内联编辑弹窗 → 同样问题

## 技术栈

- **后端 API**：Next.js 16 App Router (Route Handler: `src/app/api/admin/students/[id]/route.ts`)
- **数据库查询**：Supabase PostgREST 客户端（service role key）
- **前端页面**：React 19 + TypeScript + shadcn/ui 组件库
- **数据模型**：Supabase PostgreSQL 的 `users` 表与 `students` 表通过一对一关系关联（`users.id = students.user_id`）

## 实现方案

### 核心策略

在 Admin Student API 路由文件中，将缺失的 5 个列添加到两处 `students()` 子查询的 Select 列表中：

1. **GET handler（第 31-51 行）** — 数据加载时返回完整字段
2. **PUT handler 第 295-327 行** — 更新后的重查也需包含这些字段以确保一致性

### 关键技术决策

- **方案选择 A（推荐）：显式列出所有需要的列**。保持当前代码风格一致，显式控制返回字段。优点是明确、安全、可审计。
- **备选方案 B：使用 `students(*)` 通配符**。虽然更简单但可能返回不必要的 JSONB 大字段（如 `family_members`, `extracurricular_activities`, `awards`, `publications`, `research_experience`, `scholarship_application`, `financial_guarantee`），增加网络开销。
- **决策结果**：采用方案 A，在现有 Select 列表基础上追加 5 个缺失字段。

### 性能与可靠性分析

- **性能影响**：增加 5 个标量列（varchar/date 类型）的查询，对性能几乎无影响（Postgres 单行读取）
- **安全性**：无新增安全风险，仍使用 service role key 查询
- **向后兼容性**：纯增量修改（仅增加返回字段），不影响已有消费者
- **Blast Radius 控制**：仅修改一个 API 文件的两处 Select 列表，不影响 PUT 更新逻辑、不影响其他 API、不影响前端组件代码

### 执行细节

1. **GET 查询修复位置**：`route.ts` 第 31-51 行的 `students()` 子查询

- 需追加：`passport_expiry_date`, `emergency_contact_relationship`, `institution_name`, `field_of_study`, `graduation_date`
- 注意 `emergency_contact_phone` 已存在于第 42 行，无需重复添加

2. **PUT 重查修复位置**：`route.ts` 第 307-326 行的 `students()` 子查询

- 当前已有 `passport_expiry_date`（第 313 行），但仍缺其余 4 个字段
- 需追加：`emergency_contact_relationship`, `institution_name`, `field_of_study`, `graduation_date`

3. **验证方式**：修复后通过浏览器访问管理员学生编辑页面，确认 5 个字段能正确显示已有数据

## 目录结构

```
src/
└── app/api/admin/students/[id]/
    └── route.ts    # [MODIFY] 唯一需要修改的文件 — 在 GET 和 PUT 两处 students() Select 中追加 5 个缺失列
```

## 关键代码结构

```typescript
// 修改前 GET 查询 students() Select（当前 line 31-51）— 缺少 5 个字段
students (
  id, first_name, last_name, nationality,
  passport_number, date_of_birth, gender,
  current_address, wechat_id,
  emergency_contact_name, emergency_contact_phone,
  highest_education, gpa, hsk_level, hsk_score,
  ielts_score, toefl_score, education_history, work_experience
)

// 修改后 — 追加 5 个缺失字段到合适的位置分组中
students (
  id, first_name, last_name, nationality,
  passport_number, passport_expiry_date,      // 新增
  date_of_birth, gender,
  current_address, wechat_id,
  emergency_contact_name, emergency_contact_phone,
  emergency_contact_relationship,              // 新增
  highest_education,
  institution_name,                           // 新增
  field_of_study,                             // 新增
  graduation_date,                            // 新增
  gpa, hsk_level, hsk_score,
  ielts_score, toefl_score,
  education_history, work_experience
)
```