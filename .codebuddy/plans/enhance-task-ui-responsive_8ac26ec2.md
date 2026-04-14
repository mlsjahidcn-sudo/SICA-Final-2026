---
name: enhance-task-ui-responsive
overview: Enhance the Task list and board views with professional UI, optimized layouts, and full responsive design for mobile and desktop devices.
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Enterprise
    - Clean
    - Modern
    - Professional
  fontSystem:
    fontFamily: Inter
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#3b82f6"
      - "#2563eb"
      - "#1d4ed8"
    background:
      - "#ffffff"
      - "#f8fafc"
      - "#f1f5f9"
    text:
      - "#0f172a"
      - "#475569"
      - "#94a3b8"
    functional:
      - "#ef4444"
      - "#f97316"
      - "#22c55e"
      - "#8b5cf6"
todos:
  - id: create-task-stats-header
    content: Create TaskStatsHeader component with 5 stat cards
    status: completed
  - id: create-task-card-component
    content: Create reusable TaskCard component with status indicator, quick actions, progress bar
    status: completed
    dependencies:
      - create-task-stats-header
  - id: create-task-list-view
    content: Create TaskListView component with optimized list layout
    status: completed
    dependencies:
      - create-task-card-component
  - id: create-task-board-view
    content: Create TaskBoardView component with horizontal scroll for mobile
    status: completed
    dependencies:
      - create-task-card-component
  - id: optimize-task-filters
    content: Optimize TaskFilters component with collapsible mobile design
    status: completed
  - id: integrate-new-components
    content: Integrate all new components into main tasks page
    status: completed
    dependencies:
      - create-task-list-view
      - create-task-board-view
      - optimize-task-filters
---

## 产品概述

增强任务管理页面的列表视图和看板视图，打造专业、现代、响应式的用户界面

## 核心功能

- **列表视图增强**：视觉层次、截止日期指示器、快速操作菜单、进度显示
- **看板视图优化**：移动端水平滚动、可折叠列、拖拽支持、卡片预览优化
- **响应式设计**：移动端和桌面端完美适配
- **新增功能**：任务统计头部、空状态设计、快速状态切换

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **语言**: TypeScript 5
- **UI组件**: shadcn/ui (Radix UI)
- **样式**: Tailwind CSS 4
- **拖拽**: @dnd-kit (已安装)
- **图标**: Lucide React

## 实现方案

### 1. 任务卡片组件重构

创建可复用的 `TaskCard` 组件，支持列表和看板两种模式：

- 视觉状态指示器（左侧彩色边框）
- 截止日期警告（红色=逾期，黄色=即将到期）
- 快速操作下拉菜单
- 进度条显示子任务完成率
- 标签徽章显示

### 2. 看板视图响应式优化

- 桌面端：5列网格布局
- 平板端：3列 + 水平滚动
- 移动端：单列 + 可折叠 + 水平滚动

### 3. 过滤器组件优化

- 移动端：可折叠/展开式过滤器
- 桌面端：内联过滤器
- 搜索框始终可见

### 4. 统计头部组件

添加任务概览统计：总数、待办、进行中、已完成、逾期

## 文件结构

```
src/
├── components/tasks/
│   ├── task-card.tsx           # [NEW] 可复用任务卡片组件
│   ├── task-stats-header.tsx   # [NEW] 统计头部组件
│   ├── task-list-view.tsx      # [NEW] 列表视图组件
│   ├── task-board-view.tsx     # [NEW] 看板视图组件
│   └── task-filters.tsx        # [MODIFY] 响应式优化
├── app/admin/(admin-v2)/v2/tasks/
│   └── page.tsx                # [MODIFY] 使用新组件
```

## 关键设计

- 使用 CSS Grid 和 Flexbox 实现响应式布局
- 使用 Tailwind 断点：`sm:`, `md:`, `lg:`, `xl:`
- 移动端优先设计原则
- 触摸友好的交互元素（最小 44px 点击区域）

## 设计风格

采用现代企业级设计风格，专业简洁，强调视觉层次和信息密度平衡

## 页面布局

### 统计头部区域

- 5个统计卡片横向排列（桌面）/ 2行网格（移动端）
- 每个卡片显示：图标、数量、标签、趋势指示

### 过滤器区域

- 桌面端：内联展开，4列网格
- 移动端：默认折叠，点击展开
- 搜索框始终可见

### 列表视图

- 任务卡片垂直排列
- 每张卡片包含：状态指示条、标题、描述、元信息、快速操作
- 悬停显示完整操作按钮

### 看板视图

- 桌面端：5列网格
- 移动端：水平滚动卡片
- 每列：标题栏 + 计数 + 任务列表

### 任务卡片设计

- 左侧状态颜色条（4px宽）
- 顶部：标题 + 快速操作菜单
- 中部：描述（截断2行）
- 底部：徽章组（状态、优先级、截止日期）+ 进度条

## Agent Extensions

### Skill

- **ui-ux-pro-max**
- Purpose: Generate professional UI design patterns and responsive layout guidelines
- Expected outcome: Design recommendations for task cards and responsive layouts