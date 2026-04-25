---
name: Fix Mobile Responsiveness for Student Forms
overview: Fix mobile responsiveness issues in student and partner forms, particularly tabs and step progress indicators that are cramped or hidden on mobile devices.
todos:
  - id: fix-student-profile-tabs
    content: Fix TabsList responsive layout in student profile page using [skill:tdesign-responsive] patterns
    status: completed
  - id: fix-partner-new-student-tabs
    content: Fix TabsList responsive layout in partner add new student page
    status: completed
  - id: fix-partner-edit-student-tabs
    content: Fix TabsList responsive layout in partner edit student page
    status: completed
  - id: fix-student-application-progress
    content: Fix step progress responsive layout in student new application page
    status: completed
  - id: verify-responsiveness
    content: Verify all changes work correctly on mobile viewports
    status: completed
    dependencies:
      - fix-student-profile-tabs
      - fix-partner-new-student-tabs
      - fix-partner-edit-student-tabs
      - fix-student-application-progress
---

## User Requirements

用户要求检查和修复学生表单页面的移动端响应式问题，特别是标签页和步骤进度指示器在移动设备上显示效果不佳。

## Product Overview

修复学生门户和合作伙伴门户中表单页面的移动端响应式布局问题，确保标签页和步骤进度指示器在各种屏幕尺寸下都能正常显示和操作。

## Core Features

- 将6列标签页布局改为响应式布局（移动端3列，桌面端6列）
- 改进步骤进度指示器在移动端的可读性
- 确保所有表单页面的移动端用户体验

## Tech Stack

- Framework: Next.js 16 (App Router) with React 19
- UI: shadcn/ui components (Tabs, TabsList, TabsTrigger)
- Styling: Tailwind CSS 4 with responsive utilities

## Implementation Approach

使用Tailwind CSS的响应式断点来修复移动端布局问题：

### Tabs解决方案

将 `grid-cols-6` 改为 `grid-cols-3 sm:grid-cols-6`：

- 移动端：2行3列，每个标签页有足够的触摸区域
- 桌面端：保持原有的1行6列布局

### Step Progress解决方案

在移动端显示更紧凑但仍可读的标签：

- 保持图标始终可见
- 使用更小的字体显示简短标签
- 添加提示信息以便用户理解

## Implementation Notes

- 确保触摸目标至少44x44px
- 保持足够的间距防止误触
- 测试各种移动屏幕尺寸（320px-768px）

## Directory Structure

```
src/app/
├── (student-v2)/student-v2/
│   ├── profile/page.tsx                    # [MODIFY] 修复 TabsList 响应式布局
│   └── applications/new/page.tsx           # [MODIFY] 修复步骤进度响应式布局
└── (partner-v2)/partner-v2/
    ├── students/new/page.tsx               # [MODIFY] 修复 TabsList 响应式布局
    └── students/[id]/edit/page.tsx         # [MODIFY] 修复 TabsList 响应式布局
```

## Key Code Structures

### Tabs Responsive Pattern

```
// Before (not mobile-friendly)
<TabsList className="grid w-full grid-cols-6">

// After (responsive)
<TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
```

### Step Progress Pattern

```
// Before (hides labels on mobile)
<span className="text-xs hidden sm:inline">

// After (shows labels on all screens with responsive sizing)
<span className="text-xs block sm:text-xs mt-1">
```

## Agent Extensions

### Skill

- **tdesign-responsive**
- Purpose: Provides responsive design patterns and best practices for mobile-first layouts
- Expected outcome: Ensure consistent responsive behavior across all form pages