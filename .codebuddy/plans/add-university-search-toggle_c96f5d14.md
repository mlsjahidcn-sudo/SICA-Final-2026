---
name: add-university-search-toggle
overview: 在添加申请的 Step 1 选择步骤中，添加 Segmented Toggle 切换按钮（Program | University），允许用户按程序名称或大学名称分别搜索。需要修改3个文件：programs API支持university搜索、ApplicationWizard传递搜索类型、SelectionStep添加切换UI。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Segmented Control
    - Capsule Button Group
    - Smooth Transition Animation
    - Primary Color Accent
    - Consistent with Degree Cards
  fontSystem:
    fontFamily: Inter
    heading:
      size: 14px
      weight: 600
    subheading:
      size: 13px
      weight: 500
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#2563EB"
      - "#3B82F6"
      - "#60A5FA"
    background:
      - "#FFFFFF"
      - "#F8FAFC"
    text:
      - "#1E293B"
      - "#64748B"
    functional:
      - "#10B981"
      - "#F59E0B"
      - "#EF4444"
todos:
  - id: modify-programs-api
    content: 在 /api/programs/route.ts 中新增 university_search 参数，支持按大学名称关联过滤
    status: completed
  - id: update-wizard-fetcher
    content: 修改 ApplicationWizard 的 fetchPrograms 函数，增加 searchMode 参数并传递给 API
    status: completed
  - id: add-segmented-toggle-ui
    content: 在 selection-step.tsx 中添加 Segmented Toggle UI、动态 placeholder 和 onSearchModeChange 回调
    status: completed
    dependencies:
      - modify-programs-api
      - update-wizard-fetcher
  - id: download-building-icon
    content: 使用 [skill:lucide-icons] 下载 Building2 图标用于 University toggle 按钮
    status: completed
  - id: verify-build
    content: 运行 tsc --noEmit 编译检查确认无类型错误
    status: completed
    dependencies:
      - add-segmented-toggle-ui
---

## 产品概述

在添加申请（Application Wizard）的程序选择步骤中，新增按大学名称搜索的功能。用户通过 Segmented Toggle（分段切换按钮）在"按程序搜索"和"按大学搜索"两种模式间切换。

## 核心功能

- 在程序搜索框上方添加 Segmented Toggle 按钮（Program | University），视觉风格与已有的 degree selection 按钮保持一致
- Program 模式：搜索程序名称和描述（现有行为不变）
- University 模式：仅按大学名称（name_en / name_cn）过滤结果
- 切换模式时自动触发搜索，placeholder 文本随模式变化
- 选中某个大学后，显示该大学下的所有匹配学位的项目列表

## 技术栈

- Next.js App Router + React + TypeScript
- Tailwind CSS + shadcn/ui 组件
- Supabase 作为数据库（PostgreSQL）

## 实现方案

### 架构修改

采用**三层修改**策略，自底向上：

1. **API层** (`/api/programs/route.ts`) — 新增 `university_search` 可选参数

- 当提供 `university_search` 时，使用 Supabase 关联查询 `universities.name_en.ilike` 或 `universities.name_cn.ilike`
- 保持向后兼容，不传该参数时行为完全不变

2. **Wizard容器层** (`application-wizard/index.tsx`) — 扩展 `fetchPrograms`

- 新增 `searchMode: 'program' | 'university'` 参数
- 根据 mode 决定传给 API 的参数：`search` 还是 `university_search`

3. **UI层** (`selection-step.tsx`) — 添加 Segmented Toggle

- 新增 `searchMode` state 和 `onSearchModeChange` 回调 prop
- Toggle 放在搜索框正上方，使用两个 button 实现（与 degree cards 风格一致）
- 动态 placeholder："Search programs..." vs "Search universities..."
- 切换模式时清空搜索并重新请求

### 数据流

```
用户点击 Toggle → SelectionStep 更新 searchMode → 调用 onSearchPrograms(search, mode)
→ ApplicationWizard.fetchPrograms(search, mode) 
→ API: /api/programs?search=xxx (program模式) 或 ?university_search=xxx (university模式)
→ 返回过滤后的 programs 列表（含 universities 关联数据）
```

### 性能考虑

- 复用现有 debounce 逻辑（350ms），避免频繁 API 调用
- 切换模式时立即触发空搜索以加载全部数据
- 无需额外状态管理，所有状态局部化

## 目录结构

```
src/
├── app/api/programs/route.ts                          # [MODIFY] 新增 university_search 参数处理
├── app/(partner-v2)/partner-v2/students/components/application-wizard/
│   ├── index.tsx                                       # [MODIFY] fetchPrograms 增加 searchMode 参数
│   ├── selection-step.tsx                              # [MODIFY] 添加 Segmented Toggle UI
│   └── types.ts                                        # [MODIFY] 如需新增类型
```

## 设计风格

采用与页面内 Degree Selection 卡片一致的 Segmented Toggle 设计风格。Toggle 使用圆角胶囊形按钮组，选中态使用 primary 色填充背景+白色文字，未选中态为浅灰边框+深色文字。整体视觉语言与现有的 degree grid、search bar 保持协调统一。

## 页面块设计

### 块1: Segmented Search Mode Toggle（新增）

- **位置**: 搜索框正上方，标题 "Choose Programs" 下方
- **布局**: 水平排列的两个等宽按钮，圆角胶囊形状
- **交互**: 点击切换模式，切换时有平滑过渡动画（border-color + background-color + scale 微缩放）
- **Program 按钮**: 默认选中，图标使用 GraduationCap
- **University 按钮**: 未选中时灰色边框，选中时 primary 填充，图标使用 Building2（需下载）
- **尺寸**: 高度 36px，与搜索框对齐

### 块2: 搜索框（修改）

- **位置**: Toggle 正下方
- **变化**: placeholder 根据当前模式动态变化
- Program 模式: "Search by program name..."
- University 模式: "Search by university name..."

### 块3: 程序列表（不变）

- 保持现有的 checkbox + logo + program name + university name + badge 结构

### 块4: 选择计数 footer（不变）

## Agent Extensions

### Skill

- **lucide-icons**
- Purpose: 下载 `Building2` 图标用于 University 搜索模式的 toggle 按钮
- Expected outcome: 获得 SVG/React 格式的 Building2 图标文件