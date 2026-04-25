---
name: partner-application-module
overview: 在 Partner Portal 中构建完整的申请创建模块，包含多步选择流程（学位→专业→学期）、大学信息展示、自定义输入选项以及文档同步功能。复用现有 API 并新增 Partner 专用的前端组件和页面。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Education Technology
    - Professional Dashboard
    - Multi-step Wizard
    - Card-based Layout
    - Clean Information Hierarchy
    - Gradient Accents
  fontSystem:
    fontFamily: Inter
    heading:
      size: 28px
      weight: 700
    subheading:
      size: 18px
      weight: 600
    body:
      size: 15px
      weight: 400
  colorSystem:
    primary:
      - "#2563EB"
      - "#3B82F6"
      - "#1E40AF"
    background:
      - "#F8FAFC"
      - "#FFFFFF"
      - "#F1F5F9"
    text:
      - "#1E293B"
      - "#64748B"
      - "#94A3B8"
    functional:
      - "#10B981"
      - "#F59E0B"
      - "#EF4444"
      - "#8B5CF6"
todos:
  - id: create-wizard-types
    content: Use [skill:ui-ux-pro-max] design wizard UX flow; create application wizard type definitions in components/application-wizard/types.ts with PartnerApplicationFormData, ProgramOption, UniversityInfo, WizardStep interfaces
    status: completed
  - id: implement-degree-step
    content: "Implement degree selection step component (components/application-wizard/degree-step.tsx): card grid layout for Bachelor/Master/PhD/Diploma options with icons, selection state, and smooth transitions"
    status: completed
  - id: implement-program-step
    content: "Implement program selection step (components/application-wizard/program-step.tsx): searchable program list with Command component filtering by selected degree, multi-select checkboxes, custom program input fallback form with university name/program name/degree fields"
    status: completed
  - id: implement-university-panel
    content: "Create university info panel component (components/application-wizard/university-info-panel.tsx): sticky side panel displaying selected program's university logo, name, location, tuition, scholarship info, language requirements, deadlines extracted from program.universities relation data"
    status: completed
  - id: implement-intake-step
    content: "Implement intake and details step (components/application-wizard/intake-step.tsx): intake period input with common options (Fall 2026/Spring 2027), priority selector buttons, optional personal statement and study plan text areas with character counters"
    status: completed
  - id: implement-review-step
    content: "Implement review and submit step (components/application-wizard/review-step.tsx): summary of all selected programs with key details, validation checks, batch submission to POST /api/applications, success/error handling with toast notifications"
    status: completed
  - id: implement-wizard-container
    content: "Build main wizard container (components/application-wizard/index.tsx + apply/page.tsx): step controller logic (currentStep state, navigation handlers), progress indicator header, responsive layout combining all step components, integration with existing GET /api/programs and POST /api/applications APIs"
    status: completed
  - id: update-student-detail-page
    content: "Modify students/[id]/page.tsx: enable View Applications button linking to applications list, add New Application button opening /apply page, update Quick Actions sidebar with application entry points"
    status: completed
  - id: create-applications-list
    content: "Create applications list page ([id]/applications/page.tsx): fetch student applications via GET /api/applications?student_id=, display status-filterable table/cards with program name, university, degree, intake, status badges, action buttons per application row"
    status: completed
  - id: create-applications-detail
    content: "Create application detail page ([id]/applications/[appId]/page.tsx): full application view with university/program info card, status timeline, document section (reusing StudentDocumentsSection with application_id filter), read-only statement/plan display, status action buttons"
    status: completed
  - id: download-icons
    content: "Use [skill:lucide-icons] download required icons: GraduationCap, School, BookOpen, FileText, CheckCircle2, ChevronRight, ChevronLeft, Plus, Search, Calendar, Flag, Send, ListChecks, Building2, MapPin, Award, Users for wizard steps and actions"
    status: completed
---

## Product Overview

在合作伙伴门户中开发一个完整的学生申请模块，使合作伙伴能够为学生创建多个大学申请。该模块采用多步骤向导流程（Degree -> Program -> Intake），支持从数据库选择程序或手动输入自定义程序/大学信息，并确保学生文档在申请之间同步显示。

## Core Features

### 1. 多步骤申请向导 (Application Wizard)

- **Step 1 - 选择学位级别**: 从预定义学位列表中选择 (Bachelor's, Master's, PhD, Associate Degree 等)，支持卡片式布局展示
- **Step 2 - 选择项目程序**: 基于所选学位过滤显示可用程序列表，支持搜索功能；选中后展示大学详细信息（名称、城市、排名、Logo、学费、语言要求等）；提供"自定义程序"选项，当数据库无匹配时允许手动输入大学和项目详情
- **Step 3 - 选择入学批次 & 完善信息**: 选择 intake 时间、优先级，可选填写个人陈述和学习计划；展示已选项目的完整信息摘要
- **Step 4 - 确认提交**: 显示所有已选申请的汇总信息，支持批量创建多个申请

### 2. 大学信息展示面板

- 选中程序时实时展示：大学 Logo、名称(中英文)、所在城市/省份、学费信息、奖学金可用性、语言要求、最低 GPA、入学截止日期
- 支持展开查看课程描述、职业前景等详细内容

### 3. 自定义程序输入

- 当数据库中找不到合适程序时，提供表单让用户手动输入：
- 大学名称（中英文）
- 项目/专业名称
- 学位类型
- 备注说明
- 自定义请求存储在 `requested_university_program_note` 和 `notes` 字段中

### 4. 文档同步

- 学生级文档（通过 `documents` 表的 `student_id`）自动关联到所有申请
- 申请详情页可查看学生已上传的全部文档
- 申请创建时可选择将特定文档关联到某个申请（通过 `application_id`）

### 5. 学生详情页集成

- 启用 "View Applications" 按钮（链接到申请列表）
- 添加 "+ New Application" 按钮触发申请向导
- 在侧边栏 Overview 中展示申请统计（可点击跳转）

### 6. 申请列表与详情

- 申请列表页：展示某学生的所有申请状态（Draft/Pending/Approved/Rejected）
- 申请详情页：展示单个申请的完整信息、关联文档、操作按钮

## Tech Stack

- **Frontend**: Next.js App Router + React + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui (已有 Card, Button, Badge, Dialog, Select, Command, Popover, Form, Tabs, Separator, Alert, Textarea, Input)
- **Icons**: lucide-react (项目中已在用) + @tabler/icons-react (Admin 组件中使用)
- **Form State**: React useState + 自定义 Hook (不引入 react-hook-form，保持与现有伙伴门户组件风格一致)
- **API**: 已有 `POST/GET /api/applications` 和 `GET /api/programs`，直接复用
- **Database**: Supabase (applications, programs, universities, documents 表)

## Tech Architecture

### 架构模式

采用 **Wizard Pattern** (多步骤表单向导) + **现有 API 复用**。前端不新建 API 路由，完全复用已有的:

- `POST /api/applications` — 创建申请（支持批量 program_ids）
- `GET /api/programs?degree_level=&search=` — 过滤程序
- `GET /api/partner/documents?user_id=` — 获取学生文档

### 数据流

```
Student Detail Page → Click "Apply"
  → Open Application Wizard Modal (or Page)
    → Step 1: Select Degree Level (local state)
    → Step 2: Select Program(s) from filtered list OR Custom Input
      → GET /api/programs?degree_level=Bachelor&search=...
      → Display University Info Panel from program.universities relation
    → Step 3: Intake, Priority, Optional Statements
    → Step 4: Review & Confirm
      → POST /api/applications { user_id, selected_program_ids[], intake, ... }
    → Success → Redirect to Student Detail (refresh app counts)
```

### 文档同步策略

- 学生上传的文档存储在 `documents` 表，通过 `student_id` 关联
- 这些文档对所有申请可见（因为属于学生而非单个申请）
- 如需申请专属文档，上传时传入 `application_id`

### Module Division

- **Wizard Components** (`components/application-wizard/`) — 可复用的向导步骤组件
- **Types & Utils** (`lib/`) — 类型定义和工具函数
- **Pages** (`[id]/apply/page.tsx`, `[id]/applications/page.tsx`, `[id]/applications/[appId]/page.tsx`)
- **Student Detail Integration** — 修改现有页面添加入口

## Implementation Details

### 核心目录结构

```
src/app/(partner-v2)/partner-v2/students/
├── [id]/
│   ├── page.tsx                              # [MODIFY] 启用 Apply/Applications 按钮
│   ├── apply/
│   │   └── page.tsx                          # [NEW] 申请向导页面（主入口）
│   ├── applications/
│   │   ├── page.tsx                          # [NEW] 学生的申请列表页
│   │   └── [appId]/
│   │       └── page.tsx                      # [NEW] 申请详情页
│   └── components/
│       ├── student-documents-section.tsx     # [MODIFY] 支持 application_id 参数
│       └── application-wizard/               # [NEW] 向导组件目录
│           ├── index.tsx                     # 向导主容器（步骤控制）
│           ├── degree-step.tsx              # Step 1: 学位选择
│           ├── program-step.tsx             # Step 2: 项目选择（搜索+自定义）
│           ├── university-info-panel.tsx    # 大学信息展示面板
│           ├── intake-step.tsx              # Step 3: 入批+陈述
│           ├── review-step.tsx              # Step 4: 确认汇总
│           └── types.ts                     # 向导专用类型定义
│       └── ...
├── lib/
│   ├── types.ts                             # [MODIFY] 添加 Application 相关类型
│   └── student-utils.ts                    # [MODIFY] 添加申请状态工具函数
```

### 关键技术决策

1. **Page vs Modal**: 使用独立页面 (`/students/[id]/apply`) 而非 Modal，因为向导有4个步骤且需要大量空间展示大学信息和文档
2. **多选程序支持**: Step 2 允许选择多个程序（复选框），Step 4 批量提交所有选择
3. **Program API 缓存**: 程序列表使用浏览器内存缓存（React state），避免重复请求
4. **自定义程序降级**: 当搜索无结果或用户主动选择 "Custom Input"，切换到手动输入表单模式
5. **错误处理**: 所有 API 调用使用 try-catch + toast 错误提示，保持与现有组件一致

## Design Style

采用现代教育科技平台风格，结合专业感与友好度。整体设计以清晰的信息层次为导向，使用卡片式布局分隔各步骤内容，配合渐变色彩强调关键操作。

### 设计理念

- **专业可信**: 作为留学申请管理系统，视觉风格需传达专业性和可靠性
- **清晰导向**: 多步骤向导需有明确的进度指示和当前步骤高亮
- **信息密度适中**: 展示大学/程序信息时不拥挤，合理利用留白和分组
- **响应式适配**: 主要面向桌面端（partner portal），但需支持平板浏览

### 页面规划

#### Page 1: 申请向导页 (/partner-v2/students/[id]/apply)

- **Block 1 - 顶部导航栏**: 返回按钮 + 学生姓名 + 步骤进度指示器 (1-2-3-4)
- **Block 2 - 主内容区域**: 当前步骤的内容卡片（根据 step 切换）
- **Block 3 - 底部操作栏**: 上一步/下一步/提交 按钮（固定底部或随内容滚动）

#### Page 2: 申请列表页 (/partner-v2/students/[id]/applications)

- **Block 1 - 页面标题区**: 学生名 + 返回按钮 + 新建申请按钮
- **Block 2 - 统计卡片区**: Draft/Pending/Approved/Rejected 四个统计卡片
- **Block 3 - 申请列表表格**: 程序名 | 大学 | 学位 | 入学批次 | 状态Badge | 操作
- **Block 4 - 快捷筛选器**: 状态筛选下拉框

#### Page 3: 申请详情页 (/partner-v2/students/[id]/applications/[appId])

- **Block 1 - 顶部**: 返回 + 申请状态大Badge + 编辑/撤回按钮
- **Block 2 - 大学/程序信息卡片**: Logo + 详情 + 地图位置
- **Block 3 - 申请时间线**: created → submitted → reviewed → decision
- **Block 4 - 文档区域**: 复用 StudentDocumentsSection 组件
- **Block 5 - 个人陈述/学习计划**: 只读展示

### 单页 Block 设计 (Apply Wizard - 主页)

#### Header Block

固定顶部导航条：左侧返回箭头+学生姓名头像，右侧当前步骤指示（4个圆点连线，已完成/当前/待完成三态）。背景白色带底部阴影。

#### Wizard Content Block

根据当前步骤渲染不同内容：

- Step 1: 3列网格的学位卡片（Bachelor/Master/PhD/Diploma等），每个卡片含图标+名称+简短描述，选中态蓝色边框+勾选图标
- Step 2: 左侧2/3宽度为程序搜索+列表+自定义输入，右侧1/3为选中程序的大学信息面板（sticky定位）。搜索框带防抖，列表项含checkbox多选
- Step 3: 两列网格，左侧Intake输入+Priority按钮组，右侧Textarea（个人陈述+学习计划）
- Step 4: 汇总卡片列表，每个已选程序一张小卡片，底部大Submit按钮

#### Footer Actions Block

固定底部的操作栏：左侧"上一步"按钮（Step 1时隐藏），右侧"下一步"/"提交申请"主按钮。

## Agent Extensions

### Skill: modern-web-app

- **Purpose**: 确保新组件遵循项目中已有的 React + TypeScript + shadcn/ui 最佳实践
- **Expected outcome**: 创建的向导组件与现有伙伴门户代码风格完全一致

### Skill: lucide-icons

- **Purpose**: 为向导步骤和操作按钮下载合适的图标（GraduationCap, School, FileText, CheckCircle, ArrowRight, Plus, Search 等）
- **Expected outcome**: 所有 UI 图标统一使用 SVG 格式，不依赖 emoji 或外部 CDN

### Skill: ui-ux-pro-max

- **Purpose**: 为多步骤向导设计最优的用户体验流程和信息架构
- **Expected outcome**: 向导步骤之间的转换流畅，表单验证反馈及时，移动端适配良好