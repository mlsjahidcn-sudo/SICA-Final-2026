---
name: Application Multi-Status Enhancement
overview: 为 Application 添加多状态支持：In Progress, Submitted to University, Passed Initial Review, Pre Admitted, Admitted, JW202 Released，只有 Admin 可更改状态，Partner 和 Student 仅可查看
todos:
  - id: update-status-badge-component
    content: 更新 application-status-badge.tsx 状态配置，添加新状态
    status: completed
  - id: update-partner-applications-page
    content: 更新 Partner Applications 页面，移除状态更改功能（仅查看）
    status: completed
    dependencies:
      - update-status-badge-component
  - id: update-admin-partner-applications-list
    content: 更新 Admin Partner Applications 列表页面，添加新状态过滤
    status: completed
    dependencies:
      - update-status-badge-component
  - id: update-admin-partner-applications-detail
    content: 更新 Admin Partner Applications 详情页，添加状态更改下拉选择器
    status: completed
    dependencies:
      - update-admin-partner-applications-list
  - id: update-admin-individual-applications
    content: 同步更新 Admin Individual Applications 页面状态配置
    status: completed
    dependencies:
      - update-status-badge-component
  - id: update-student-applications-page
    content: 确保 Student Applications 页面状态显示正确（仅查看）
    status: completed
    dependencies:
      - update-status-badge-component
---

## 产品概述

在 Admin Panel 中为 Applications 添加更详细的多状态流程管理，只允许 Admin 更改状态，Partner 和 Student 只能查看状态。

## 核心功能

### 新增 Application 状态

将现有的简单状态扩展为完整的申请流程状态：

| 状态 Key | 显示名称 | 描述 | 颜色 |
| --- | --- | --- | --- |
| `in_progress` | In Progress | 申请正在准备中 | 蓝色/灰色 |
| `submitted_to_university` | Submitted to University | 已提交到大学 | 橙色 |
| `passed_initial_review` | Passed Initial Review | 通过初审 | 青色 |
| `pre_admitted` | Pre Admitted | 预录取 | 紫色 |
| `admitted` | Admitted | 正式录取 | 绿色 |
| `jw202_released` | JW202 Released | JW202已发放 | 深绿色 |


### 权限控制

- **Admin**: 可以查看所有申请，并更改申请状态
- **Partner**: 只能查看自己学生的申请状态，**不能**更改状态
- **Student**: 只能查看自己的申请状态，**不能**更改状态

### UI 变更

1. **Status Badge 组件** - 更新显示新状态及其对应颜色
2. **Admin Applications 列表页** - 添加状态选择下拉框，过滤和显示新状态
3. **Admin Application 详情页** - 添加状态更改按钮/下拉选择器
4. **Partner Applications 页面** - 移除状态更改功能，仅显示状态
5. **Student Applications 页面** - 仅显示状态，无编辑功能

## 技术方案

### 修改文件

1. **`/src/components/partner-v2/application-status-badge.tsx`** - 更新 STATUS_CONFIG，添加新状态
2. **`/src/app/(partner-v2)/partner-v2/applications/page.tsx`** - 更新状态配置，移除 STATUS_OPTIONS（Partner 不能改状态）
3. **`/src/app/admin/(admin-v2)/v2/partner-applications/page.tsx`** - 更新状态配置，保留状态更改功能
4. **`/src/app/admin/(admin-v2)/v2/partner-applications/[id]/page.tsx`** - 更新 STATUS_FLOW，添加状态选择器
5. **`/src/app/admin/(admin-v2)/v2/individual-applications/page.tsx`** - 同步更新状态配置
6. **`/src/app/(student-v2)/student-v2/applications/page.tsx`** - 确保只读显示状态

### 状态配置结构

```typescript
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: ReactNode }> = {
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600', icon: <Clock /> },
  submitted_to_university: { label: 'Submitted to University', color: 'bg-orange-500/10 text-orange-600', icon: <Send /> },
  passed_initial_review: { label: 'Passed Initial Review', color: 'bg-cyan-500/10 text-cyan-600', icon: <CheckCircle /> },
  pre_admitted: { label: 'Pre Admitted', color: 'bg-purple-500/10 text-purple-600', icon: <Award /> },
  admitted: { label: 'Admitted', color: 'bg-green-500/10 text-green-600', icon: <GraduationCap /> },
  jw202_released: { label: 'JW202 Released', color: 'bg-emerald-500/10 text-emerald-600', icon: <FileCheck /> },
};
```

### API 保持不变

现有 API 已支持任意 status 值，无需修改后端。