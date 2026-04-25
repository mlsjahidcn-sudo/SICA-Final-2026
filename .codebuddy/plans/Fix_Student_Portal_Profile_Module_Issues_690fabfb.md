---
name: Fix Student Portal Profile Module Issues
overview: 修复学生门户Profile模块的10个问题，包括文档类型重复定义、类型定义缺失、档案完成度计算不完整、文档删除逻辑等。
todos:
  - id: fix-work-experience-type
    content: Add end_date field to WorkExperienceEntry interface in student-api.ts
    status: completed
  - id: fix-completion-calculation
    content: Add work_experience to profile completion calculation fields
    status: completed
  - id: remove-duplicate-doc-labels
    content: Remove local DOC_TYPE_LABELS and import from document-types.ts
    status: completed
  - id: fix-document-options
    content: Use getDocumentTypeOptions() for document type dropdown
    status: completed
  - id: fix-delete-button-logic
    content: Allow delete for pending AND rejected document status
    status: completed
  - id: update-document-checklist
    content: Update document checklist to use shared DOCUMENT_TYPES config
    status: completed
  - id: improve-auth-handling
    content: Improve unauthorized user handling with proper error messages
    status: completed
  - id: verify-lint-errors
    content: Run lint checks and fix any errors
    status: completed
---

## 产品概述

修复学生门户Profile模块的所有问题，确保个人资料管理功能完整、数据一致、用户体验良好。

## 核心功能

- 修复重复的文档类型标签定义，使用共享配置
- 修复类型定义不完整问题（WorkExperienceEntry缺少end_date）
- 完善档案完成度计算，包含work_experience字段
- 修复文档删除按钮逻辑，支持rejected状态
- 改进未授权用户处理逻辑
- 统一文档类型选项配置
- 改进错误处理和用户反馈

## 技术栈

- Frontend: React 19 + TypeScript + Next.js 16
- UI: shadcn/ui + Tailwind CSS
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth

## 实现方法

### 问题1: 重复的文档类型标签定义

**问题**: `ProfileDocumentsTab`组件定义了自己的`DOC_TYPE_LABELS`字典，而没有使用`document-types.ts`中的共享配置
**解决方案**: 删除本地定义，导入并使用共享的`getDocumentTypeLabel`函数

### 问题2: WorkExperienceEntry类型缺少end_date字段

**问题**: `WorkExperienceEntry`接口没有`end_date`字段，但表单使用了它
**解决方案**: 在student-api.ts中添加`end_date?: string`字段

### 问题3: 档案完成度计算缺少work_experience字段

**问题**: `work_experience`数组字段不在`STUDENT_ARRAY_COMPLETION_FIELDS`中
**解决方案**: 将`work_experience`添加到完成度计算字段列表

### 问题4: 删除按钮逻辑限制过严

**问题**: 删除按钮仅在'pending'状态显示，应该也允许'rejected'状态
**解决方案**: 修改条件为`['pending', 'rejected'].includes(doc.status)`

### 问题5: 未授权用户显示模拟数据

**问题**: 未授权时页面显示模拟数据而不是适当处理
**解决方案**: 改进错误处理，避免误导用户

### 问题6: 文档选项和清单未使用共享配置

**问题**: 文档下拉菜单和常用清单硬编码，与共享配置不一致
**解决方案**: 使用`getDocumentTypeOptions()`和`DOCUMENT_TYPES`

## 目录结构

```
src/
├── lib/
│   ├── student-api.ts                    # [MODIFY] 添加end_date字段
│   ├── profile-completion.ts             # [MODIFY] 添加work_experience字段
│   └── document-types.ts                 # [EXISTING] 已有共享配置
├── app/
│   ├── (student-v2)/student-v2/
│   │   ├── profile/
│   │   │   └── page.tsx                  # [MODIFY] 使用共享配置，修复删除逻辑
│   │   └── settings/
│   │       └── page.tsx                  # [MODIFY] 改进错误处理
│   └── api/student/
│       ├── profile/route.ts              # [REVIEW] 检查错误处理
│       └── settings/route.ts             # [REVIEW] 检查错误处理
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL + Auth)

## Implementation Approach

### Issue 1: Duplicate Document Type Labels

**Problem**: `ProfileDocumentsTab` has its own `DOC_TYPE_LABELS` instead of using shared config
**Solution**: Import and use `getDocumentTypeLabel` from `@/lib/document-types`

### Issue 2: Missing end_date in WorkExperienceEntry

**Problem**: Interface doesn't match form usage
**Solution**: Add `end_date?: string` to the interface

### Issue 3: Profile Completion Missing work_experience

**Problem**: work_experience not counted in completion calculation
**Solution**: Add to `STUDENT_ARRAY_COMPLETION_FIELDS` array

### Issue 4: Delete Button Logic Too Restrictive

**Problem**: Only shows for 'pending', should allow 'rejected'
**Solution**: Change condition to include rejected documents

### Issue 5: Document Options Not Using Shared Config

**Problem**: Hardcoded options inconsistent with shared config
**Solution**: Use `getDocumentTypeOptions()` function

## Key Code Changes

### 1. student-api.ts - Add end_date field

```typescript
export interface WorkExperienceEntry {
  company: string;
  position: string;
  start_date: string;
  end_date?: string;  // ADD THIS
  description?: string;
}
```

### 2. profile-completion.ts - Add work_experience

```typescript
const STUDENT_ARRAY_COMPLETION_FIELDS = [
  'education_history',
  'family_members',
  'extracurricular_activities',
  'awards',
  'publications',
  'research_experience',
  'work_experience',  // ADD THIS
] as const;
```

### 3. profile/page.tsx - Remove local DOC_TYPE_LABELS

- Delete lines 1483-1496 (local DOC_TYPE_LABELS)
- Import `getDocumentTypeLabel, getDocumentTypeOptions` from document-types
- Update document type dropdown to use `getDocumentTypeOptions()`
- Update status check for delete button to include 'rejected'
- Update document checklist to use shared types