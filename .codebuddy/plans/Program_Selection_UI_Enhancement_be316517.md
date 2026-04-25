---
name: Program Selection UI Enhancement
overview: 修复项目选择界面不显示大学logo的问题，并全面提升UI设计，使其更现代、美观和专业
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Modern
    - Clean
    - Professional
    - Minimal
  fontSystem:
    fontFamily: system-ui
    heading:
      size: 18px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#18181b"
      - "#27272a"
    background:
      - "#ffffff"
      - "#fafafa"
      - "#f4f4f5"
    text:
      - "#18181b"
      - "#71717a"
    functional:
      - "#22c55e"
      - "#ef4444"
      - "#3b82f6"
todos:
  - id: fix-types
    content: 更新Program类型定义，添加logo_url字段到universities对象
    status: completed
  - id: fix-api
    content: 修改/api/admin/programs API，在select中添加logo_url查询
    status: completed
    dependencies:
      - fix-types
  - id: improve-ui
    content: 重构program-selection-step组件，显示大学logo并改进整体UI设计
    status: completed
    dependencies:
      - fix-api
---

## 用户需求

用户提出两个主要问题：

1. **功能缺陷**：项目选择步骤不显示大学logo
2. **UI改进需求**：希望整体UI更加干净、高级、美观

## 核心改进点

### 功能修复

- 在项目选择下拉列表中显示大学真实logo（而非通用图标）
- 选中项目后显示大学logo

### UI增强

- 改进项目卡片的视觉层次和布局
- 添加更多项目信息展示（学位类型、学科、语言等）
- 优化hover效果和过渡动画
- 改进选中状态的视觉反馈
- 提升整体设计美感，参考项目中已有的高质量实现

## 技术方案

### 问题根因分析

**数据层问题**：

- `Program`类型定义中`universities`对象缺少`logo_url`字段
- `/api/admin/programs` API查询时未包含`logo_url`字段

**UI层问题**：

- 当前仅使用`IconSchool`通用图标，未展示真实logo
- 卡片布局简单，缺少视觉层次
- 缺少项目关键信息（学位类型、学科、语言等）
- 缺少hover效果和动画过渡

### 实现方案

**1. 类型定义修复**

- 在`types.ts`中为`Program.universities`添加`logo_url`字段

**2. API查询增强**

- 在`/api/admin/programs/route.ts`的select语句中添加`logo_url`字段

**3. UI组件重构**
参考`student-v2/applications/new/page.tsx`的实现：

- 显示大学logo（有logo显示图片，无logo显示占位图标）
- 改进下拉列表项布局（logo + 项目名 + 大学信息 + 学位类型）
- 优化选中项目卡片设计
- 添加hover效果和过渡动画
- 增强视觉层次感

### 性能考虑

- logo图片使用`object-cover`确保比例一致
- 使用CSS过渡而非JavaScript动画保证流畅性

## 设计风格

采用现代、简洁的专业表单设计风格，与shadcn/ui设计系统保持一致。

### 核心设计原则

- **简洁专业**：去除冗余装饰，突出核心信息
- **视觉层次**：通过字号、颜色、间距建立清晰的信息层级
- **一致性**：与项目现有高质量实现保持视觉统一

### 改进方向

1. **Logo显示**：圆形/圆角矩形容器，统一尺寸（32x32px或40x40px）
2. **信息布局**：左侧logo + 右侧信息（项目名、大学、学位类型）
3. **交互反馈**：hover时轻微上浮、阴影加深
4. **选中状态**：主题色边框、背景色变化、勾选图标