---
name: fix-student-creation-workflow
overview: Analyze and fix admin portal students module to ensure unified student creation workflow across admin, partner, and self-registration with proper data consistency and validation.
todos:
  - id: fix-signup-student-record
    content: 修改 /api/auth/signup 创建 students 表记录，确保自主注册学生数据完整性
    status: completed
  - id: add-claim-account-api
    content: 创建 /api/students/claim 端点，实现孤立学生账户认领功能
    status: completed
  - id: add-admin-send-invite
    content: 创建管理员发送认领邀请功能，让管理员可以邀请孤立学生认领账户
    status: completed
    dependencies:
      - add-claim-account-api
  - id: improve-admin-list-display
    content: 优化管理员学生列表显示，清晰标识学生来源和状态
    status: completed
  - id: add-duplicate-validation
    content: 添加统一的邮箱重复验证逻辑，确保三种流程不会创建重复学生
    status: completed
  - id: test-all-flows
    content: 测试三种学生创建流程，验证统一显示功能
    status: completed
    dependencies:
      - fix-signup-student-record
      - add-claim-account-api
      - improve-admin-list-display
---

## Product Overview

学生管理模块统一优化，确保管理员添加学生、合作伙伴添加学生、学生自主注册三种流程完美协作，并在管理员学生模块中统一展示。

## Core Features

- 统一三种学生创建流程（管理员、合作伙伴、自主注册）
- 确保所有学生记录在 users 和 students 表中保持数据一致性
- 管理员学生列表统一展示所有来源的学生
- 添加账户认领机制，让孤立学生可以激活账户
- 改进数据验证，防止跨流程的重复学生
- 优化管理员列表显示，清晰标识学生来源

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Database**: Supabase (PostgreSQL) - External instance at `maqzxlcsgfpwnfyleoga.supabase.co`
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth

## Implementation Approach

### Current Architecture Analysis

**三种学生创建流程现状**:

1. **管理员添加学生** (`POST /api/admin/students`):

- 支持两种模式：创建用户账户 或 创建孤立记录（skip_user_creation）
- 孤立学生：user_id=null，姓名存储在 admin_notes 字段
- 问题：孤立学生无法登录，需要账户认领机制

2. **合作伙伴添加学生** (`POST /api/partner/students`):

- 始终创建用户账户
- 设置 referred_by_partner_id 追踪推荐来源
- 问题：仅创建基础用户记录，缺少详细学生资料

3. **学生自主注册** (`POST /api/auth/signup`):

- 创建 Supabase Auth 用户和 users 表记录
- 问题：**不创建 students 表记录**，导致数据不一致

**数据库架构**:

- `users` 表：id, email, full_name, role, referred_by_partner_id
- `students` 表：id, user_id (可空), nationality, passport_number, education_history (JSONB), 等详细字段
- 孤立学生：user_id IS NULL，通过 admin_notes 存储姓名

### Recommended Solution

**方案一（推荐）：确保数据一致性 + 孤立学生认领**

修改点：

1. 自主注册时创建 students 表记录（空数据）
2. 合作伙伴添加学生时创建完整 students 记录
3. 添加孤立学生账户认领流程（通过邮箱验证）
4. 改进管理员列表显示，清晰标识学生来源

**优势**：

- 保持现有架构不变，最小化改动
- 数据一致性得到保障
- 孤立学生功能保留（管理员快速录入场景）
- 清晰的数据流转

**方案二（简化版）：移除孤立学生功能**

- 所有学生必须有邮箱和用户账户
- 管理员添加时必须提供邮箱
- 简化代码和数据流

**建议采用方案一**，因为管理员可能需要快速录入学生信息（如线下咨询场景），之后再让学生认领账户。

## Implementation Notes

### 关键实现细节

1. **自主注册创建 student 记录**:

- 在 `/api/auth/signup` 中，创建用户后立即创建空的 students 记录
- user_id 指向新创建的用户
- 其他字段留空，学生后续可完善

2. **合作伙伴创建完整记录**:

- `/api/partner/students` 已创建 students 记录，但应确保字段完整
- 当前代码已实现，只需验证

3. **孤立学生认领流程**:

- 创建 `/api/students/claim` 端点
- 学生输入邮箱 → 验证邮箱 → 创建账户并关联 student 记录
- 更新 students.user_id 为新用户ID

4. **管理员列表显示优化**:

- 孤立学生显示邮箱输入框或"待认领"标签
- 提供一键发送认领邀请功能

5. **重复验证**:

- 统一邮箱检查逻辑
- 所有流程在创建前检查邮箱是否已存在

### Performance Considerations

- 使用 service role key 绕过 RLS 避免无限递归
- 批量查询合作伙伴信息减少 N+1 查询
- 已实现：管理员学生列表使用两个并行查询（用户表 + 孤立学生）

## Directory Structure

### Modified Files

```
project-root/
├── src/app/api/auth/signup/route.ts        # [MODIFY] 添加 students 表记录创建
├── src/app/api/admin/students/route.ts     # [MODIFY] 改进孤立学生显示和验证
├── src/app/api/students/claim/route.ts     # [NEW] 孤立学生账户认领 API
├── src/app/api/admin/students/[id]/claim/route.ts  # [NEW] 管理员发送认领邀请
├── src/components/admin/student-claim-dialog.tsx  # [NEW] 账户认领对话框组件
└── src/app/admin/(admin-v2)/v2/students/page.tsx  # [MODIFY] 改进列表显示
```

## Key Code Structures

### 1. Student Creation Type Definition

```typescript
interface CreateStudentResult {
  user_id: string | null;       // null for orphan students
  student_id: string;
  email: string | null;
  source: 'admin' | 'partner' | 'self_registration';
  requires_claim: boolean;      // true for orphan students
}
```

### 2. Claim Account Request Schema

```typescript
interface ClaimAccountRequest {
  email: string;
  password: string;
  full_name: string;
  student_id: string;  // The orphan student record to claim
}
```

## Agent Extensions

### SubAgent

- **code-explorer**: 已完成代码探索，识别了三种学生创建流程的具体实现和问题点
- Purpose: 深度分析学生管理模块的工作流程和数据结构
- Expected outcome: 确认当前架构和需要修改的具体文件

### Skill

- **supabase-postgres-best-practices**: 用于优化数据库查询和数据一致性设计
- Purpose: 确保 students 和 users 表的关系设计合理，避免性能问题
- Expected outcome: 优化的数据库查询方案