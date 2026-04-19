---
name: simplify-partner-application-wizard
overview: 将4步申请向导简化为2步：Step 1 合并学位+项目选择（去掉预览面板、自定义项目模式、复杂防抖等），Step 2 简化为仅保留入学时间+备注等核心字段（去掉优先级、个人陈述、学习计划、字符计数器）。总代码量从 ~79KB 削减到约 30-40KB。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Minimalism
    - Clean
    - Flat Design
    - Clear Progression
    - Whitespace-driven
  fontSystem:
    fontFamily: Inter, system-ui, sans-serif
    heading:
      size: 20px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#2563EB"
      - "#3B82F6"
      - "#60A5FA"
    background:
      - "#FFFFFF"
      - "#F8FAFC"
      - "#F1F5F9"
    text:
      - "#0F172A"
      - "#475569"
      - "#94A3B8"
    functional:
      - "#10B981"
      - "#EF4444"
      - "#F59E0B"
todos:
  - id: simplify-types
    content: "精简 types.ts: 移除不需要的类型(CustomProgramInput/PriorityOption/UniversityInfo等), WIZARD_STEPS改为2步, 简化PartnerApplicationFormData"
    status: completed
  - id: create-selection-step
    content: "新建 selection-step.tsx: 合并学位选择卡片+项目搜索多选列表为单一Step 1组件(无预览面板/无自定义模式/无复杂防抖)"
    status: completed
    dependencies:
      - simplify-types
  - id: create-details-submit-step
    content: "新建 details-submit-step.tsx: Intake选择+Notes输入+内联汇总确认卡+提交按钮的Step 2组件"
    status: completed
    dependencies:
      - simplify-types
  - id: refactor-index
    content: "改造主容器 index.tsx: 从4步改为2步模式, 简化state管理, 简化handleSubmit(去掉custom program循环), 更新步骤导航逻辑"
    status: completed
    dependencies:
      - create-selection-step
      - create-details-submit-step
  - id: cleanup-old-files
    content: "删除旧文件: degree-step.tsx, program-step.tsx, intake-step.tsx, review-step.tsx, university-info-panel.tsx, 清理无用导入"
    status: completed
    dependencies:
      - refactor-index
  - id: verify-build
    content: "运行构建验证: 确保 npm run dev 编译无错误, 检查入口页面 applications/new/page.tsx 兼容性"
    status: completed
    dependencies:
      - cleanup-old-files
---

## Product Overview

将合作伙伴申请向导从4步简化为2步，大幅降低复杂度，移除非核心功能，保留最精简的申请流程。

## Core Features

- **Step 1 (合并原Step 1+2)**: 选择学位 + 搜索/选择项目。学位选择卡片与项目搜索列表在同一页面内垂直排列；项目搜索简化为单模式（仅数据库搜索），去掉自定义输入模式、侧边预览面板、防抖悬浮预览、sticky loading等复杂交互
- **Step 2 (合并原Step 3+4)**: 填写基本信息（入学时间 + 备注）+ 内联汇总确认 + 提交按钮。只保留 intake 和 notes 两个字段，移除优先级系统、个人陈述、学习计划、字符计数器、Skip 机制；将原独立 Review 步骤压缩为 Step 2 底部的内联确认区域
- 移除文件: `university-info-panel.tsx` 整个删除
- 精简类型定义: 移除 `CustomProgramInput`、`PriorityOption`、`UniversityInfo` 等不再需要的类型和常量

## 需要移除的功能清单

| 移除项 | 原因 |
| --- | --- |
| University Info Panel 侧边预览面板 | 占10KB，增加大量交互复杂度 |
| 自定义项目(Custom Program)双模式 | 双模式切换逻辑~5KB |
| Debounced hover preview | useRef timer管理~3KB |
| Sticky loading anti-flicker | 双timer管理~2KB |
| Priority 4级优先级 | 非核心字段 |
| Personal Statement 5000字 | 非必需 |
| Study Plan 5000字 | 非必需 |
| 字符计数器+接近限制警告 | 伴随字段移除 |
| Step 3 Skip机制 | 简化后不需要 |
| 独立 Review 步骤 | 合并到Step 2底部 |


## Tech Stack

- **现有框架**: Next.js 16 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **状态管理**: 保持现有 React useState/useCallback/useRef 模式
- **API调用**: 保持现有 `/api/applications` 和 `/api/programs` 接口不变
- **组件库**: 继续使用 shadcn/ui 的 Card, Button, Badge, Input, Textarea, Select 等

## Implementation Approach

采用**渐进式重构策略**: 不破坏现有API层和数据模型，只重构前端展示层和表单收集逻辑。

### 核心技术决策

1. **合并而非重写**: 将 degree-step 和 program-step 合并为新的 `selection-step.tsx`，复用原有UI模式和样式
2. **保持提交逻辑兼容**: `handleSubmit` 中仍需支持批量创建DB项目和单个创建的分离逻辑（但去掉custom program循环）
3. **类型向后兼容**: `PartnerApplicationFormData` 中可选字段保留但不在UI中暴露，确保不破坏下游API消费方
4. **步骤配置动态化**: `WIZARD_STEPS` 常量从4步改为2步

### 关键修改点

- **index.tsx**: `currentStep` 范围从 0-3 改为 0-1；移除 `selectedProgramForPreview` state；简化 `handleSubmit` 去掉 custom program 循环；调整 `canProceedToStep` 逻辑
- **新建 selection-step.tsx**: 合并学位选择(上) + 项目搜索多选(下) 为单一垂直布局组件
- **简化 intake-step.tsx → 改名 details-submit-step.tsx**: 只渲染 intake 选择 + notes textarea + 内联摘要卡片 + submit 按钮；接收 `onSubmit` 回调
- **删除 review-step.tsx**: 其功能被吸收到 details-submit-step 底部区域
- **删除 university-info-panel.tsx**: 完全不需要
- **types.ts**: 精简移除 CustomProgramInput, PriorityOption, UniversityInfo; PartnerApplicationFormData 移除 priority/personalStatement/studyPlan 字段; WIZARD_STEPS 改为2步配置

## Architecture Design

```
简化后的数据流:
ApplicationWizard (index.tsx)
├── State: formData { selectedDegree, selectedProgramIds, intake, notes }
├── Step 0: SelectionStep (新建)
│   ├── DegreeCards (6个选项卡, 复用degree-step UI模式)
│   └── ProgramSearchList (搜索框 + 多选checkbox列表, 简化版program-step)
├── Step 1: DetailsSubmitStep (改造自intake-step)
│   ├── IntakeSelector (预设学期选项)
│   ├── NotesTextarea (可选备注)
│   ├── SummaryCard (内联: 已选学位/项目数量/intake)
│   └── SubmitButton
└── handleSubmit() → POST /api/applications (仅批量创建DB程序)
```

## Directory Structure

```
src/app/(partner-v2)/partner-v2/students/components/application-wizard/
├── types.ts                    # [MODIFY] 精简类型定义, WIZARD_STEPS改为2步
├── index.tsx                   # [MODIFY] 主容器改为2步模式, 简化state和handleSubmit
├── selection-step.tsx          # [NEW] 合并学位选择+项目搜索的Step 1组件
├── details-submit-step.tsx     # [NEW] 入学时间+备注+内联汇总+提交的Step 2组件
├── degree-step.tsx             # [DELETE] 功能已合并入selection-step
├── program-step.tsx            # [DELETE] 功能已合并入selection-step
├── intake-step.tsx             # [DELETE] 功能已合并入details-submit-step
├── review-step.tsx             # [DELETE] 功能已合并入details-submit-step
└── university-info-panel.tsx   # [DELETE] 不再需要
```

## 设计风格

采用简洁现代的 Minimalist 设计风格，配合 Clean & Flat 的视觉语言。2步向导使用清晰的进度指示器，每一步内容区域留白充足，操作路径明确。

## 页面设计规划

### Page 1: Application Wizard - Step 1 选择学位与项目

**Block 1: 顶部导航栏**

- 返回按钮(左)、标题"New Application"(居中)、步骤进度指示器(右, 显示"Step 1 of 2")
- 进度条：两段式，第一段高亮激活

**Block 2: 学位选择区**

- 标题 "Select Degree"
- 6个学位卡片网格布局(移动端2列,桌面端3列)，每个卡片含图标渐变背景+名称+简短描述
- 选中态：边框高亮 + 勾选图标 + 微缩放动画
- 下方提示文字显示当前选中学位

**Block 3: 项目搜索与选择区**

- 标题 "Select Programs"
- 搜索输入框(带搜索图标, placeholder "Search programs...")
- 项目列表：每个项目一行，左侧checkbox + 大学logo + 项目名称 + 大学名 + 学位Badge
- 已选计数栏(底部固定)：显示 "N selected" + Clear All 按钮
- 简洁的加载骨架屏(无需防抖延迟)

### Page 2: Application Wizard - Step 2 详情与提交

**Block 1: 顶部导航栏**

- Back按钮(左)、标题"Review & Submit"(居中)、步骤进度(右, 显示"Step 2 of 2")
- 进度条：两段式全部高亮

**Block 2: 申请详情表单**

- Intake 学期选择：4-5个快速选择按钮(Fall/Spring + 年份)，带"Upcoming"标签
- Notes 备注输入框：普通textarea，无字符计数器

**Block 3: 选择汇总确认卡**

- 浅色背景卡片
- 已选学位标签(Badge)
- 已选项目数量(Badge)
- 已选Intake值
- 数据验证提示(如有缺失字段)

**Block 4: 提交操作区**

- Back返回按钮(次要样式)
- Submit Application按钮(主要样式, 右侧)

## Agent Extensions

- **code-explorer**
- Purpose: 在实现前深入探索各wizard组件的具体代码细节，确保精确理解每个文件的导出接口、props类型、内部状态依赖关系
- Expected outcome: 确认所有组件间的 props 接口契约和状态流转细节，避免实现时的接口不匹配