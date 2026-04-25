# 学生门户 UI/UX 一致性审计报告

## 审计日期
2026-04-13

## 审计范围
学生门户 v2 所有页面模块

---

## 发现的问题

### 🔴 高优先级问题

#### 1. 根容器结构不一致

**问题描述**：
不同页面使用了不同的根容器结构，导致布局和间距不统一。

**标准模式** (大部分页面使用):
```tsx
<div className="flex flex-1 flex-col gap-6 p-6">
  {/* Page content */}
</div>
```

**问题页面**:

| 页面 | 当前实现 | 问题 |
|------|---------|------|
| Profile | `flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto` | 添加了宽度限制，导致宽屏显示不一致 |
| Settings | `flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto` | 同上 |
| Programs | `space-y-6` | 缺少 `flex flex-1 flex-col p-6`，布局错误 |
| Templates | `flex flex-1 flex-col space-y-4 p-4 md:p-8` | 使用 `space-y-4` 而非 `gap-6`，padding 不一致 |

**影响**：
- 用户在不同页面间切换时会有视觉跳动
- 宽屏显示器上部分页面宽度受限，部分页面全宽
- 间距不一致影响视觉层次感

---

#### 2. Header 结构不一致

**问题描述**：
页面标题区域的布局和结构不统一。

**标准模式**:
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>
    <p className="text-muted-foreground">Description</p>
  </div>
  <Button>Action Button</Button>
</div>
```

**问题页面**:

| 页面 | 当前实现 | 问题 |
|------|---------|------|
| Programs | 缺少 flex 容器包装 | 标题和描述没有正确对齐，缺少 action button 位置 |
| Templates | 使用 `font-bold` | 标题字重不一致（应为 `font-semibold`） |
| Universities | 使用 `font-bold` | 标题字重不一致 |
| Programs | 使用 `font-bold` | 标题字重不一致 |

**影响**：
- 标题位置不统一
- 部分页面缺少操作按钮区域
- 视觉一致性差

---

#### 3. 标题样式不一致

**问题描述**：
页面主标题使用了不同的样式类。

**标准样式**: `text-2xl font-semibold tracking-tight`

**问题统计**:
- ✅ 使用正确样式的页面: 8个 (Dashboard, Applications, Documents, Meetings, Profile, Notifications, Settings, Favorites)
- ❌ 使用 `font-bold` 的页面: 3个 (Programs, Universities, Templates)

---

### 🟡 中优先级问题

#### 4. 宽度限制不一致

**问题描述**：
部分页面添加了 `max-w-4xl mx-auto`，限制了内容宽度。

**影响页面**:
- Profile
- Settings

**问题**:
- 这些页面在大屏幕上会变窄
- 与其他页面（如 Applications, Documents）的宽度不一致
- 用户需要更多的垂直滚动

**建议**:
- 保持所有页面统一的全宽布局
- 如果确实需要限制宽度，应该在所有表单类页面统一应用

---

#### 5. Padding 不一致

**问题描述**：
页面内边距不统一。

**统计**:
- 大部分页面: `p-6` (24px)
- Templates: `p-4 md:p-8` (16px / 32px)

**影响**:
- 内容距离边缘的距离不一致
- 响应式行为不统一

---

#### 6. Gap 间距不一致

**问题描述**：
页面内容区域之间的间距不统一。

**统计**:
- 大部分页面: `gap-6` (24px)
- Templates: `space-y-4` (16px)

**影响**:
- 内容区块之间的间距不统一
- 视觉节奏感不一致

---

### 🟢 低优先级问题

#### 7. 缺少统一的页面包装器组件

**问题描述**：
每个页面都重复相同的结构代码，没有统一的 PageContainer 或 PageHeader 组件。

**影响**:
- 代码重复
- 维护困难
- 容易出现不一致

**建议**:
创建统一的页面布局组件：
- `PageContainer` - 统一的页面包装器
- `PageHeader` - 统一的页面标题区域

---

## 统计摘要

### 总计检查页面
11个页面模块

### 问题统计
- 🔴 高优先级问题: 3个
- 🟡 中优先级问题: 3个
- 🟢 低优先级问题: 1个

### 受影响页面
- Programs (4个问题)
- Templates (4个问题)
- Profile (1个问题)
- Settings (1个问题)
- Universities (1个问题)

---

## 修复建议

### 方案 1: 创建统一的布局组件（推荐）

创建以下组件：

#### 1. PageContainer 组件
```tsx
// src/components/student-v2/page-container.tsx
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {children}
    </div>
  )
}
```

#### 2. PageHeader 组件
```tsx
// src/components/student-v2/page-header.tsx
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}
```

#### 使用示例
```tsx
// 页面中使用
export default function ApplicationsPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="My Applications" 
        description="Manage and track your university applications"
        action={
          <Button asChild>
            <Link href="/student-v2/applications/new">
              <IconPlus className="h-4 w-4 mr-2" />
              New Application
            </Link>
          </Button>
        }
      />
      {/* Page content */}
    </PageContainer>
  )
}
```

### 方案 2: 直接修复现有页面

逐个修复问题页面，统一使用以下结构：

```tsx
<div className="flex flex-1 flex-col gap-6 p-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>
      <p className="text-muted-foreground">Description</p>
    </div>
    <Button>Action</Button>
  </div>
  
  {/* Content */}
  {/* ... */}
</div>
```

---

## 推荐修复顺序

### 第一步：创建统一组件
1. 创建 `PageContainer` 组件
2. 创建 `PageHeader` 组件

### 第二步：修复高优先级页面
1. Programs 页面（最严重）
2. Templates 页面
3. Universities 页面

### 第三步：评估宽度限制
1. 确认 Profile 和 Settings 是否需要宽度限制
2. 如果需要，考虑所有表单页面统一应用
3. 如果不需要，移除宽度限制

### 第四步：全面应用
1. 将所有页面迁移到新的布局组件
2. 确保所有页面使用统一的结构

---

## 预期效果

修复后的效果：
- ✅ 所有页面使用统一的根容器结构
- ✅ 所有页面标题样式一致
- ✅ 所有页面间距一致
- ✅ 更好的维护性和可扩展性
- ✅ 更好的用户体验和视觉一致性

---

## 附录：检查的页面列表

1. ✅ Dashboard (`page.tsx`)
2. ✅ Applications (`applications/page.tsx`)
3. ✅ Documents (`documents/page.tsx`)
4. ✅ Meetings (`meetings/page.tsx`)
5. ⚠️ Profile (`profile/page.tsx`) - 宽度限制问题
6. ✅ Notifications (`notifications/page.tsx`)
7. ⚠️ Settings (`settings/page.tsx`) - 宽度限制问题
8. ❌ Universities (`universities/page.tsx`) - 标题样式问题
9. ❌ Programs (`programs/page.tsx`) - 多个问题
10. ❌ Templates (`templates/page.tsx`) - 多个问题
11. ✅ Favorites (`favorites/page.tsx`)
