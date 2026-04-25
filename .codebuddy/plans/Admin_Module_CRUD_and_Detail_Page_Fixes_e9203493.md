---
name: Admin Module CRUD and Detail Page Fixes
overview: Fix broken detail page links and add missing CRUD functionality (Add Student, Add Application buttons) to the 4 new admin modules. Student-to-partner assignment is already implemented.
todos:
  - id: fix-individual-students-links
    content: 修复 individual-students 页面的链接路径和添加Add Student按钮
    status: completed
  - id: fix-partner-students-links
    content: 修复 partner-students 页面的链接路径和添加Add Student按钮
    status: completed
  - id: fix-individual-applications-links
    content: 修复 individual-applications 页面的链接路径和添加Add Application按钮
    status: completed
  - id: fix-partner-applications-links
    content: 修复 partner-applications 页面的链接路径和添加Add Application按钮
    status: completed
  - id: verify-all-crud
    content: 验证所有CRUD操作正常工作
    status: completed
    dependencies:
      - fix-individual-students-links
      - fix-partner-students-links
      - fix-individual-applications-links
      - fix-partner-applications-links
---

## Product Overview

修复新添加的4个管理模块的问题，确保管理员可以正常使用完整的学生和申请管理功能。

## Core Features

- 修复详情页链接：将4个新模块列表页中的链接从旧路径修复到正确的v2路径
- 添加学生功能：在学生模块页面添加"Add Student"按钮，复用现有创建页面
- 添加申请功能：在申请模块页面添加"Add Application"按钮，复用现有创建页面
- 学生分配合作伙伴：功能已存在（通过StudentTransferDialog），确保正常工作
- 确保CRUD操作完整可用：创建、查看、编辑、删除

## Tech Stack

- Framework: Next.js 16 (App Router)
- UI Components: shadcn/ui
- Database: Supabase (PostgreSQL)
- Authentication: Custom auth context

## Implementation Approach

**Solution Strategy**: 最小化修改，复用现有页面。核心问题是链接路径错误，而非页面缺失。

现有详情页和创建页已完整实现：

- `/admin/v2/students/[id]` - 学生详情页（正常工作）
- `/admin/v2/students/new` - 创建学生页（正常工作）
- `/admin/v2/applications/[id]` - 申请详情页（正常工作）
- `/admin/v2/applications/new` - 创建申请页（正常工作）

**问题根源**：4个新模块列表页中的链接指向旧路径 `/admin/students/[id]` 和 `/admin/applications/[id]`

**修复策略**：

1. 修复链接路径（4个文件）
2. 添加"Add"按钮（4个文件）
3. 确保学生转移功能正常

## Directory Structure

```
project-root/
├── src/app/admin/(admin-v2)/v2/
│   ├── individual-students/page.tsx    # [MODIFY] 修复链接路径，添加Add按钮
│   ├── partner-students/page.tsx       # [MODIFY] 修复链接路径，添加Add按钮
│   ├── individual-applications/page.tsx # [MODIFY] 修复链接路径，添加Add按钮
│   └── partner-applications/page.tsx   # [MODIFY] 修复链接路径，添加Add按钮
```

## Implementation Notes

- **Link Path Fix**: 将 `/admin/students/[id]` 改为 `/admin/v2/students/[id]`
- **Link Path Fix**: 将 `/admin/applications/[id]` 改为 `/admin/v2/applications/[id]`
- **Add Button**: 在页面header区域添加Link按钮指向 `/admin/v2/students/new` 或 `/admin/v2/applications/new`
- **Transfer功能**: 已在partner-students页面实现，无需修改