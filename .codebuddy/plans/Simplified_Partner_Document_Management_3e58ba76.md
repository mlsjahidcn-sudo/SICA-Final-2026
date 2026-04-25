---
name: Simplified Partner Document Management
overview: 简化合作伙伴文档管理系统：移除复杂的文档请求功能，实现基本的文档上传、查看、编辑、删除功能，保留验证/拒绝功能。
todos:
  - id: cleanup-pages
    content: 删除文档请求页面和移除页面中的 Document Requests 按钮
    status: completed
  - id: cleanup-apis
    content: 删除文档请求相关 API 路由
    status: completed
  - id: upload-dialog
    content: 创建文档上传对话框组件，支持选择学生、文档类型和文件上传
    status: completed
    dependencies:
      - cleanup-pages
  - id: document-put-api
    content: 创建 PUT API 支持更新文档元数据
    status: completed
  - id: edit-delete-ui
    content: 在文档页面添加编辑和删除功能，集成对话框和确认流程
    status: completed
    dependencies:
      - upload-dialog
---

## 产品概述

简化版合作伙伴文档管理系统，允许 Admin、Partner Admin 和 Partner Member 上传和管理文档，文档关联到学生或申请。

## 核心功能

- **文档上传**: Admin、Partner Admin、Partner Member 可为学生上传文档
- **文档列表**: 查看所有可访问学生的文档，支持筛选和分页
- **文档编辑**: 修改文档类型、过期日期
- **文档删除**: 删除不需要的文档
- **文档验证**: 验证或拒绝文档状态
- **权限控制**: 区分 Admin/Partner Admin/Partner Member 的访问范围

## 移除功能

- ❌ 文档请求功能（document_requests）
- ❌ 向学生发送上传请求
- ❌ 复杂的通知系统

## 技术栈

- Framework: Next.js 16 (App Router) + React 19 + TypeScript 5
- UI Components: shadcn/ui + Tailwind CSS 4
- Database: Supabase (PostgreSQL + Storage)
- State Management: React useState/useCallback

## 实现方案

### 现有基础设施

- **API**: `/api/documents/route.ts` 已实现 GET/POST/DELETE
- **组件**: `FileUpload` 组件已存在
- **文档类型**: `DOCUMENT_TYPES` 配置完整

### 需要新增

1. **PUT API**: `/api/documents/[id]/route.ts` - 更新文档
2. **上传对话框**: 集成到文档页面
3. **编辑对话框**: 修改文档元数据
4. **学生选择器**: 搜索并选择学生

## 目录结构

```
project-root/
├── src/
│   ├── app/
│   │   ├── (partner-v2)/partner-v2/
│   │   │   └── documents/
│   │   │       ├── page.tsx                    # [MODIFY] 简化文档页面，添加上传/编辑/删除
│   │   │       └── requests/                   # [DELETE] 移除文档请求页面
│   │   └── api/
│   │       └── documents/
│   │           └── [id]/
│   │               └── route.ts                # [NEW] PUT 删除/更新文档 API
├── src/components/partner-v2/
│   └── document-upload-dialog.tsx              # [NEW] 文档上传对话框
│   └── document-edit-dialog.tsx                # [NEW] 文档编辑对话框
└── src/app/api/partner/documents/
    ├── requests/                               # [DELETE] 移除文档请求 API
    └── [id]/verify/                            # [KEEP] 保留验证 API
```

## 实现要点

- **文件上传流程**: 前端选择文件 → Supabase Storage → 数据库记录
- **权限验证**: Partner Admin 可访问团队学生，Member 只能访问自己推荐的学生
- **学生选择**: 使用搜索下拉框，按名字/email 搜索
- **错误处理**: 文件大小限制 (10MB)、类型验证、权限检查