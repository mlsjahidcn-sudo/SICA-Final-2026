---
name: enhance-apply-wizard-ui
overview: Tighten vertical spacing in the Application Wizard (apply page) to reduce excessive gaps between UI elements.
todos:
  - id: tighten-selection-step
    content: 优化 selection-step.tsx 的垂直间距
    status: completed
  - id: tighten-details-step
    content: 优化 details-submit-step.tsx 的垂直间距
    status: completed
  - id: tighten-wizard-container
    content: 优化 index.tsx 主内容区 padding
    status: completed
---

## 用户需求

优化申请向导页面 (`/partner-v2/students/[id]/apply`) 的 UI，减少过多的垂直间距，使界面更紧凑美观。

## 核心问题

- 各区块之间垂直间距过大
- 头部图标尺寸过大且占用空间多
- 主内容区域 padding 过大
- 卡片内边距过大

## 预期效果

界面更紧凑，减少空白区域，同时保持良好的可读性和层次结构。

## 技术方案

通过调整 Tailwind CSS 间距类来减少垂直间距和内边距。

## 修改文件

1. **selection-step.tsx** - 步骤1组件

- 主容器: `space-y-6 md:space-y-8` → `space-y-4 md:space-y-5`
- 头部图标: `w-14 h-14` → `w-10 h-10`，移除 `mb-3`
- 图标背景: 缩小尺寸保持比例

2. **details-submit-step.tsx** - 步骤2组件

- 主容器: `space-y-6 md:space-y-8` → `space-y-4 md:space-y-5`
- 头部图标: `w-14 h-14` → `w-10 h-10`，移除 `mb-3`
- 卡片内边距: `p-4 md:p-6` → `p-3 md:p-4`
- Summary card: `p-4 md:p-6 space-y-4 md:space-y-5` → `p-3 md:p-4 space-y-3`
- Form section: `p-4 md:p-6 space-y-5 md:space-y-6` → `p-3 md:p-4 space-y-4`

3. **index.tsx** - 向导容器

- 主内容区 padding: `py-8` → `py-5`

# Agent Extensions

无