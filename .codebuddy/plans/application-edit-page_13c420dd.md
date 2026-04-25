---
name: application-edit-page
overview: 将申请编辑功能从模态框迁移到独立编辑页面，提升用户体验和界面空间利用率
todos:
  - id: create-edit-page
    content: 创建独立编辑页面 /applications/[id]/edit/page.tsx
    status: completed
  - id: update-detail-page
    content: 修改详情页，替换模态框为编辑链接
    status: completed
    dependencies:
      - create-edit-page
  - id: update-list-page
    content: 修改列表页，替换模态框为编辑链接
    status: completed
    dependencies:
      - create-edit-page
---

## 用户需求

将申请编辑功能从模态框改为独立页面，提供更好的编辑体验和更大的操作空间。

## 产品概述

创建独立的申请编辑页面，替换当前的 EditApplicationDialog 模态框，保留所有编辑功能（项目选择、个人信息、申请详情、管理员备注）并优化布局。

## 核心功能

- 独立编辑页面，完整表单布局
- 学生信息展示（只读）
- 项目选择（含大学logo显示）
- 申请详情编辑
- 管理员备注
- 保存/取消操作
- 与详情页和列表页的导航集成

## 技术方案

### 实现路径

创建独立编辑页面，复用 EditApplicationDialog 中的表单逻辑和组件，但采用全页面布局。

### 目录结构

```
src/app/admin/(admin-v2)/v2/applications/
├── [id]/
│   ├── page.tsx              # [MODIFY] 详情页 - 替换EditApplicationDialog为链接按钮
│   └── edit/
│       └── page.tsx          # [NEW] 独立编辑页面
├── page.tsx                  # [MODIFY] 列表页 - 更新编辑按钮链接
└── new/
    └── page.tsx              # 现有新建页面（保持不变）

src/components/admin/
└── edit-application-dialog.tsx  # [KEEP] 保留组件，可供其他地方复用
```

### 页面设计

编辑页面将使用与新建页面一致的布局风格：

- 左侧边栏（AppSidebar）
- 顶部导航（SiteHeader）
- 主内容区域：
- 返回按钮 + 页面标题
- 表单卡片分组（Student Info、Program Selection、Application Details、Admin Notes）
- 底部操作按钮（Save、Cancel）

### API 复用

- GET `/api/admin/applications/[id]` - 获取申请详情
- PUT `/api/admin/applications/[id]` - 更新申请内容
- GET `/api/admin/programs` - 获取项目列表（含logo_url）

### 导航更新

1. 详情页 `/applications/[id]`：

- 将 EditApplicationDialog 替换为 Link 按钮
- 链接到 `/applications/[id]/edit`

2. 列表页 `/applications`：

- 将 EditApplicationDialog 替换为 Link 按钮
- 操作菜单中的 Edit 选项改为链接

### 组件复用

从 EditApplicationDialog 提取可复用逻辑：

- Program 选择下拉组件（可提取为独立组件）
- Priority 选择器
- 表单状态管理逻辑