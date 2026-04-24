---
name: Enable Admin Document Upload for Students
overview: Enable administrators to upload documents on behalf of students. Currently, the backend API supports this functionality, but the admin interface lacks document upload UI. Will create missing document management page and update API to track upload source.
todos:
  - id: create-documents-page
    content: Create admin document management page at /admin/v2/applications/[id]/documents/page.tsx
    status: completed
  - id: update-api-uploaded-by
    content: Add uploaded_by field to document upload API
    status: completed
    dependencies:
      - create-documents-page
  - id: verify-document-upload
    content: Test document upload functionality as admin
    status: completed
    dependencies:
      - update-api-uploaded-by
---

## User Requirements

管理员需要能够代表学生上传文档。目前系统缺少管理员文档管理页面，导致"Manage Documents"按钮链接到404页面。

## Product Overview

为管理员添加文档管理功能，允许管理员：

- 查看学生申请的所有文档
- 代表学生上传新文档
- 删除/替换现有文档
- 查看文档状态和审核结果

## Core Features

1. **文档管理页面** - 在 `/admin/v2/applications/[id]/documents` 创建完整的文档管理界面
2. **文档上传功能** - 使用现有的 `DocumentUpload` 组件，支持多种文档类型
3. **文档状态显示** - 显示 pending/verified/rejected 状态
4. **上传者追踪** - 记录 `uploaded_by` 字段区分管理员上传和学生上传

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL + Storage)
- **Icons**: @tabler/icons-react

## Implementation Approach

1. **创建管理员文档管理页面** - 新建 `/admin/v2/applications/[id]/documents/page.tsx`
2. **复用现有组件** - 使用 `DocumentUpload` 组件进行文档上传
3. **更新后端API** - 在 POST 方法中添加 `uploaded_by` 字段记录
4. **权限验证** - 确保只有 admin 角色可以访问此功能

## Implementation Notes

- 后端API (`/api/documents/route.ts`) 已支持 admin 角色上传，但需添加 `uploaded_by` 字段
- 文档存储使用 Supabase Storage bucket: 'documents'
- 文件路径格式: `{application_id}/{document_type}_{timestamp}_{filename}`
- 最大文件大小: 10MB

## Architecture Design

```
Admin Dashboard
└── Applications List (/admin/v2/applications)
    └── Application Detail (/admin/v2/applications/[id])
        └── Documents Management (/admin/v2/applications/[id]/documents) [NEW]
            ├── Document List
            ├── Upload Component (reuse DocumentUpload)
            └── Status & Actions
```

## Directory Structure

```
src/app/admin/(admin-v2)/v2/applications/[id]/
├── page.tsx                    # [MODIFY] 确保文档管理链接正确
└── documents/
    └── page.tsx                # [NEW] 管理员文档管理页面

src/app/api/documents/
└── route.ts                    # [MODIFY] POST方法添加uploaded_by字段
```

## Key Code Structures

```typescript
// 文档管理页面Props
interface DocumentsPageProps {
  params: Promise<{ id: string }> // application_id
}

// 文档接口（已存在）
interface Document {
  id: string
  document_type: string
  file_key: string
  file_name: string
  file_size: number
  content_type: string
  status: 'pending' | 'verified' | 'rejected'
  rejection_reason?: string
  uploaded_at: string
  uploaded_by?: string  // 新增字段
}
```