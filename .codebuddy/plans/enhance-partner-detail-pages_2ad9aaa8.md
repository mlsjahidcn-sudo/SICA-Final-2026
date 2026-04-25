---
name: enhance-partner-detail-pages
overview: Redesign partner student and partner application detail pages with clean, consistent design matching the admin individual modules. Remove gradients, custom colors, and add proper responsive spacing.
todos:
  - id: enhance-partner-student-detail-partner
    content: Enhance partner student detail page (partner-v2) - remove gradients and colored backgrounds
    status: completed
  - id: enhance-partner-student-detail-admin
    content: Enhance admin partner student detail page - standardize Avatar and cards
    status: completed
  - id: enhance-partner-application-detail-admin
    content: Enhance admin partner application detail page - clean status timeline and cards
    status: completed
---

## 用户需求

增强 Partner Student 和 Partner Application 详情页的 UI 设计，要求：

- 干净、简洁的设计风格，与其他模块保持一致
- 移除渐变背景、彩色背景块（如 blue-50, emerald-50）
- 使用标准 shadcn/ui 组件
- 适当的间距和响应式布局
- 不要恢复已删除的文件

## 目标页面

1. **Partner Student 详情页**：

- `src/app/(partner-v2)/partner-v2/students/[id]/page.tsx` - Partner 端的 Student 详情
- `src/app/admin/(admin-v2)/v2/partner-students/[id]/page.tsx` - Admin 端的 Partner Student 详情

2. **Partner Application 详情页**：

- `src/app/admin/(admin-v2)/v2/partner-applications/[id]/page.tsx` - Admin 端的 Partner Application 详情

## 参考设计

参考 `src/app/admin/(admin-v2)/v2/applications/[id]/page.tsx`（Individual Application 详情页）：

- 使用纯色 AvatarFallback（如 `bg-primary`）
- 使用标准 Badge variants
- Card 标题简洁，不使用彩色图标
- 无渐变背景或彩色背景块
- 统一的 InfoItem 和 StatRow 组件

## 技术方案

### 设计原则

- **Minimal Design**：使用标准 shadcn/ui 组件，避免自定义颜色
- **一致性**：所有详情页使用相同的布局和组件模式
- **响应式**：保持 lg:grid-cols-3 网格布局，适配移动端

### 具体修改

#### 1. Partner Student 详情页 (Partner 端)

文件：`src/app/(partner-v2)/partner-v2/students/[id]/page.tsx`

**修改项**：

- 移除 `bg-gradient-to-r from-primary to-blue-600` 按钮渐变
- 移除 `shadow-md shadow-primary/20` 阴影效果
- AvatarFallback 使用纯色：`bg-primary` 替代渐变
- 移除 `bg-emerald-50` 等自定义背景色
- Badge 使用标准 variants（default, secondary, outline, destructive）

#### 2. Partner Student 详情页 (Admin 端)

文件：`src/app/admin/(admin-v2)/v2/partner-students/[id]/page.tsx`

**修改项**：

- 移除 Avatar 的 `bg-gradient-to-br from-blue-500 to-purple-600` 渐变
- 移除 `bg-blue-50 dark:bg-blue-950/30 border border-blue-200` 等自定义背景
- 移除图标上的 `text-blue-500`, `text-amber-500` 等颜色
- 使用标准 `text-primary` 或无颜色
- 移除彩色边框

#### 3. Partner Application 详情页 (Admin 端)

文件：`src/app/admin/(admin-v2)/v2/partner-applications/[id]/page.tsx`

**修改项**：

- 移除 AvatarFallback 的 `bg-gradient-to-br from-indigo-500 to-pink-500` 渐变
- 移除状态时间线中的彩色圆圈和阴影效果
- 移除 `border-emerald-300 bg-emerald-50/50` 等彩色卡片背景
- 移除 Status Timeline 中的 `shadow-md shadow-primary/30 scale-110`
- 使用标准 `text-primary` 和 `bg-primary` 替代彩色

### 通用组件标准化

所有详情页使用统一的辅助组件：

```
// InfoItem - 保持现有结构，移除不必要的 icon 颜色
function InfoItem({ icon, label, value, className }) {
  return (
    <div className={`flex items-start gap-3 ${className || ''}`}>
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <span className="font-medium text-sm mt-0.5">{value}</span>
      </div>
    </div>
  );
}

// StatRow - 保持现有结构
function StatRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}
```

# Agent Extensions

无