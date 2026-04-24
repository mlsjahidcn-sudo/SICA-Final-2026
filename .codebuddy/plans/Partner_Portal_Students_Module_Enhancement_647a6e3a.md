---
name: Partner Portal Students Module Enhancement
overview: 全面修复和增强合作伙伴门户的学生管理模块,包括修复所有代码问题、改进UI/UX、添加新功能和优化性能
todos:
  - id: fix-critical-lint
    content: 修复学生详情页React unescaped entities错误和其他lint警告
    status: completed
  - id: fix-documents-page
    content: 修复文档管理页useEffect依赖和Image组件问题
    status: completed
  - id: create-type-definitions
    content: 创建统一的学生类型定义文件
    status: completed
  - id: add-completion-calc
    content: 实现资料完成度计算功能
    status: completed
    dependencies:
      - create-type-definitions
  - id: add-export-feature
    content: 使用[xlsx] skill添加学生列表导出功能
    status: completed
  - id: create-activity-log
    content: 添加学生活动日志追踪系统
    status: completed
  - id: optimize-performance
    content: 优化学生列表性能，添加虚拟滚动支持
    status: completed
  - id: enhance-ui-ux
    content: 改进加载状态、空状态设计和响应式布局
    status: completed
---

## 产品概述

合作伙伴门户学生模块的全面检查和增强，修复现有问题并添加新功能，提升用户体验和系统稳定性。

## 核心功能

### 问题修复 (必须完成)

1. **修复Lint错误** - 修复React unescaped entities、useEffect依赖项、未使用变量等问题
2. **修复性能警告** - 将img标签替换为Next.js Image组件，添加useEffect依赖项
3. **统一错误处理** - 规范化所有API调用的错误处理逻辑

### 功能增强

1. **学生活动日志** - 添加活动追踪，记录学生资料的查看、编辑等操作
2. **导出功能** - 支持导出学生列表为CSV/Excel格式
3. **资料完成度** - 在学生列表和详情页显示资料完成百分比
4. **高级筛选** - 添加日期范围、项目、标签等高级筛选选项
5. **批量编辑** - 支持批量更新学生状态、分配团队成员等操作

### UI/UX改进

1. **加载状态优化** - 添加骨架屏替代简单的加载动画
2. **空状态设计** - 改进空状态UI，提供更友好的引导
3. **响应式优化** - 优化移动端布局和交互体验
4. **Toast通知增强** - 统一使用Sonner进行用户反馈

## 技术栈选择

- **框架**: Next.js 16 (App Router) - 已有架构
- **UI库**: shadcn/ui + Tailwind CSS 4 - 保持一致性
- **图标**: Tabler Icons (@tabler/icons-react)
- **通知**: Sonner (toast通知)
- **数据导出**: xlsx skill - 用于CSV/Excel导出
- **虚拟滚动**: react-window - 处理大数据列表

## 实现方案

### 1. 问题修复策略

- **Lint错误**: 使用replace_in_file工具修复所有错误
- **性能优化**: 使用useCallback、useMemo优化组件性能
- **类型定义**: 创建统一的类型定义文件，避免重复

### 2. 活动日志系统

- **数据库**: 使用现有的`partner_team_activity`表
- **API**: 创建`/api/partner/activity`端点
- **组件**: 创建`ActivityLog`组件显示最近活动

### 3. 导出功能

- **实现**: 使用xlsx skill生成Excel文件
- **格式**: 支持CSV和XLSX两种格式
- **字段**: 包含学生基本信息、申请统计等

### 4. 资料完成度

- **算法**: 基于必填字段计算完成百分比
- **显示**: 使用进度条组件可视化展示
- **提示**: 显示缺失字段列表

### 5. 性能优化

- **虚拟滚动**: 使用react-window处理1000+学生列表
- **分页优化**: 支持更大的pageSize，减少请求次数
- **缓存策略**: 使用React Query或SWR进行数据缓存

## 架构设计

### 文件组织

```
src/app/(partner-v2)/partner-v2/students/
├── page.tsx                    # 学生列表页
├── new/page.tsx               # 创建学生
├── [id]/
│   ├── page.tsx               # 学生详情
│   ├── edit/page.tsx          # 编辑学生
│   └── documents/page.tsx     # 文档管理
├── components/                 # 学生模块专用组件
│   ├── student-card.tsx       # 学生卡片
│   ├── completion-badge.tsx    # 完成度徽章
│   ├── activity-timeline.tsx  # 活动时间线
│   └── export-button.tsx      # 导出按钮
└── lib/
    ├── student-utils.ts       # 工具函数
    └── types.ts               # 类型定义

src/app/api/partner/students/
├── route.ts                   # 学生列表API
├── [id]/route.ts             # 学生详情API
├── bulk/route.ts             # 批量操作API
└── export/route.ts           # 导出API (新增)
```

### 数据流

```
用户操作 → API调用 → Supabase查询 → 数据转换 → 前端渲染
         ↓
    活动日志记录
```

## 实现细节

### 关键技术点

1. **类型统一**

```typescript
// src/app/(partner-v2)/partner-v2/students/lib/types.ts
export interface Student {
  id: string;
  email: string | null;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  nationality?: string | null;
  created_at: string;
  application_count: number;
  stats: StudentStats;
  completion_percentage?: number;
}

export interface StudentStats {
  total: number;
  accepted: number;
  pending: number;
  rejected: number;
}
```

2. **资料完成度计算**

```typescript
// lib/student-utils.ts
export function calculateCompletion(student: Student): number {
  const requiredFields = [
    'full_name', 'email', 'nationality', 'date_of_birth',
    'passport_number', 'phone', 'education_history'
  ];
  
  const filledFields = requiredFields.filter(field => {
    const value = student[field];
    return value !== null && value !== undefined && value !== '';
  });
  
  return Math.round((filledFields.length / requiredFields.length) * 100);
}
```

3. **虚拟滚动集成**

```typescript
import { FixedSizeList as List } from 'react-window';

<List
  height={600}
  itemCount={students.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <StudentCard student={students[index]} />
    </div>
  )}
</List>
```

### 性能考虑

- **N+1查询**: 使用Supabase的关联查询一次性获取所有数据
- **大数据渲染**: 虚拟滚动避免DOM节点过多
- **状态管理**: 使用React Context避免prop drilling
- **缓存策略**: 客户端缓存减少API调用

## 目录结构

### 修改文件清单

**必须修复的文件**:

- `src/app/(partner-v2)/partner-v2/students/[id]/page.tsx` - [MODIFY] 修复lint错误、添加活动日志标签
- `src/app/(partner-v2)/partner-v2/students/[id]/documents/page.tsx` - [MODIFY] 修复useEffect依赖、使用Image组件
- `src/app/(partner-v2)/partner-v2/students/page.tsx` - [MODIFY] 移除未使用导入、添加导出功能

**新增文件**:

- `src/app/(partner-v2)/partner-v2/students/lib/types.ts` - [NEW] 统一类型定义
- `src/app/(partner-v2)/partner-v2/students/lib/student-utils.ts` - [NEW] 工具函数(完成度计算等)
- `src/app/(partner-v2)/partner-v2/students/components/completion-badge.tsx` - [NEW] 完成度徽章组件
- `src/app/(partner-v2)/partner-v2/students/components/activity-timeline.tsx` - [NEW] 活动时间线组件
- `src/app/(partner-v2)/partner-v2/students/components/export-button.tsx` - [NEW] 导出按钮组件
- `src/app/api/partner/students/export/route.ts` - [NEW] 导出API端点
- `src/app/api/partner/activity/route.ts` - [NEW] 活动日志API

**API增强**:

- `src/app/api/partner/students/route.ts` - [MODIFY] 添加完成度计算
- `src/app/api/partner/students/[id]/route.ts` - [MODIFY] 返回完成度数据

## Agent Extensions

### Skill

- **xlsx**
- Purpose: 导出学生数据为Excel/CSV格式
- Expected outcome: 生成包含学生列表的xlsx文件，支持下载

### SubAgent

- **code-explorer**
- Purpose: 搜索项目中现有的活动日志实现模式，确保新功能与现有代码风格一致
- Expected outcome: 找到`partner_team_activity`表的使用示例和相关组件