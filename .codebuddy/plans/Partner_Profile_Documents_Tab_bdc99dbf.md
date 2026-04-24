---
name: Partner Profile Documents Tab
overview: Add a Documents tab to the partner-v2 profile page, similar to the ProfileDocumentsTab in student-v2. This will allow Partner Admin and Partner Member to upload and manage their own documents (company certificates, business licenses, etc.)
todos:
  - id: modify-partner-profile-page
    content: 修改 Partner Profile 页面，添加 Tabs 结构，包含 Profile 和 Documents 两个标签页
    status: completed
  - id: create-partner-profile-documents-api
    content: 创建 /api/partner/profile/documents API 端点，支持 GET 和 POST 方法
    status: completed
  - id: create-partner-profile-documents-delete-api
    content: 创建 /api/partner/profile/documents/[id] API 端点，支持 DELETE 方法
    status: completed
    dependencies:
      - create-partner-profile-documents-api
  - id: create-partner-documents-tab-component
    content: 创建 PartnerProfileDocumentsTab 组件，复用 student-v2 的 ProfileDocumentsTab 设计
    status: completed
    dependencies:
      - create-partner-profile-documents-api
---

## 用户需求

在合作伙伴门户（partner-v2）的个人资料页面中添加文档管理功能，类似于学生门户（student-v2）的 ProfileDocumentsTab 功能。支持 Partner Admin 和 Partner Member 两种角色。

## 核心功能

1. **文档统计卡片** - 显示总数、已验证、待处理、已拒绝的文档数量
2. **状态筛选** - 按文档状态筛选（全部、已验证、待处理、已拒绝）
3. **文档上传** - 上传新文档，可选择文档类型
4. **文档列表** - 显示所有上传的文档，包含状态标签、文件信息、过期时间追踪
5. **文档操作** - 下载、删除、重新上传被拒绝的文档

## 技术考量

- 学生端使用 `/api/student/documents` API，通过 `student_id` 关联文档
- 合作伙伴端需要新的 API 端点 `/api/partner/profile/documents`
- 文档存储在 Supabase Storage，使用 `uploaded_by` (partner user.id) 作为存储路径来符合 RLS 策略
- 复用现有的 `DocumentTypeSelect` 和 `FileUpload` 组件

## 技术栈

- **Framework**: Next.js 16 (App Router) + React 19
- **UI**: shadcn/ui 组件 + Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage (documents bucket)
- **Icons**: @tabler/icons-react

## 架构设计

### 方案：使用 uploaded_by 字段区分文档归属

现有 documents 表已有 `uploaded_by` 字段存储上传者用户ID。通过 API 层面区分：

- 学生文档：`student_id` 字段关联学生，且由学生自己上传
- 合作伙伴文档：通过 `uploaded_by = partner_user_id` 筛选，且 `student_id` 为空或特定标记

### API 端点设计

1. **GET /api/partner/profile/documents** - 获取合作伙伴自己的文档列表

- 查询条件：`uploaded_by = partnerUser.id` 且 `student_id IS NULL`
- 返回统计数据（total, verified, pending, rejected）

2. **POST /api/partner/profile/documents** - 上传合作伙伴自己的文档

- 存储路径：`${partnerUser.id}/${docType}_${timestamp}_${fileName}`
- 记录 `uploaded_by = partnerUser.id`

3. **DELETE /api/partner/profile/documents/[id]** - 删除文档

### 目录结构

```
src/app/
├── (partner-v2)/partner-v2/
│   └── profile/
│       └── page.tsx                    # [MODIFY] 添加 Tabs 结构 + Documents Tab
│
├── api/
│   └── partner/
│       └── profile/
│           └── documents/
│               ├── route.ts            # [NEW] GET/POST partner own documents
│               └── [id]/
│                   └── route.ts        # [NEW] DELETE partner own document
```

## 实现细节

### 1. 修改 Partner Profile 页面 (`/src/app/(partner-v2)/partner-v2/profile/page.tsx`)

- 添加 `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` 导入
- 添加 Documents 相关的 Icon 导入（IconFile, IconFiles, IconDownload, IconUpload, IconTrash, IconCheck, IconX, IconClock, IconAlertCircle, IconCalendarDue）
- 将现有内容包裹在 `TabsContent value="profile">` 中
- 添加 `TabsContent value="documents">` 引用新组件
- 添加 Documents TabsTrigger

### 2. 创建 PartnerProfileDocumentsTab 组件

基于 `ProfileDocumentsTab` 适配：

- 使用 `/api/partner/profile/documents` API
- 统计卡片：Total, Verified, Pending, Rejected
- 状态筛选下拉框
- 上传对话框（选择文档类型 + FileUpload）
- 文档列表展示（卡片形式，包含状态图标、操作按钮）
- 过期时间追踪

### 3. 创建 API 端点

- `/api/partner/profile/documents/route.ts` - GET/POST
- `/api/partner/profile/documents/[id]/route.ts` - DELETE
- 复用 `/api/student/documents` 的实现逻辑，但使用 `uploaded_by` 筛选