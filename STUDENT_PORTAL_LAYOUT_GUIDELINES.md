# 学生门户页面布局设计规范

## 版本
v1.0 - 2026-04-13

---

## 核心原则

1. **一致性优先**：所有页面使用统一的根容器和间距
2. **可读性优先**：表单页面使用宽度限制，列表页面全宽
3. **响应式设计**：确保在各种屏幕尺寸下都有良好体验

---

## 页面容器规范

### 标准布局（列表页面）

适用于：
- Dashboard
- Applications 列表
- Documents 列表
- Meetings 列表
- Notifications
- Universities 列表
- Programs 列表
- Favorites

**结构**：
```tsx
<div className="flex flex-1 flex-col gap-6 p-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>
      <p className="text-muted-foreground">Description</p>
    </div>
    <Button>Action</Button>
  </div>
  {/* Content */}
</div>
```

**特点**：
- 全宽布局
- 6个单位(24px)的gap间距
- 6个单位(24px)的padding

---

### 表单布局（详情/编辑页面）

适用于：
- Profile（个人资料）
- Settings（设置）
- Applications 创建/编辑
- Documents 上传

**结构**：
```tsx
<div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>
      <p className="text-muted-foreground">Description</p>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </div>
  </div>
  {/* Content */}
</div>
```

**特点**：
- 最大宽度 4xl (896px)
- 居中对齐
- 适合阅读和填写的舒适宽度
- 防止表单行过长

---

## Header 规范

### 标准Header

```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>
    <p className="text-muted-foreground">Description</p>
  </div>
  <div className="flex items-center gap-2">
    <Button variant="outline">Secondary</Button>
    <Button>Primary</Button>
  </div>
</div>
```

**样式规范**：
- 标题：`text-2xl font-semibold tracking-tight`
- 描述：`text-muted-foreground`
- 按钮组：使用 `flex items-center gap-2` 包装

---

### 简化Header（无操作按钮）

```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>
    <p className="text-muted-foreground">Description</p>
  </div>
</div>
```

---

## 内容区域规范

### 卡片布局

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

---

### 列表项布局

```tsx
<div className="space-y-4">
  {items.map(item => (
    <Card key={item.id}>
      <CardContent className="pt-6">
        {/* Item content */}
      </CardContent>
    </Card>
  ))}
</div>
```

---

### 网格布局

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>
```

---

## 间距规范

### 页面级间距
- 根容器 padding: `p-6` (24px)
- 根容器 gap: `gap-6` (24px)
- Header 到内容的间距：由 gap-6 提供

### 组件级间距
- 卡片内部 padding: `p-6` 或 `pt-6`
- 卡片之间间距: `space-y-4` (16px) 或 `gap-4` (16px)
- 表单字段之间间距: `space-y-6` (24px) 或 `space-y-4` (16px)

---

## 响应式断点

### Tailwind CSS 断点
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### 响应式模式

**网格布局**：
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

**按钮组**：
```tsx
<div className="flex flex-col sm:flex-row gap-2">
```

**表单布局**：
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

---

## 页面分类

### 列表页面（全宽）
- ✅ Dashboard
- ✅ Applications 列表
- ✅ Documents 列表
- ✅ Meetings 列表
- ✅ Notifications
- ✅ Universities 列表
- ✅ Programs 列表
- ✅ Favorites

### 表单页面（限制宽度）
- ✅ Profile
- ✅ Settings
- ⚠️ Applications 创建/编辑（待实现宽度限制）
- ⚠️ Documents 上传（待实现宽度限制）

---

## 待优化项目

### 高优先级
1. Applications 创建/编辑页面应用 `max-w-4xl mx-auto`
2. Documents 上传页面应用 `max-w-4xl mx-auto`

### 中优先级
1. 创建统一的 `PageContainer` 组件
2. 创建统一的 `PageHeader` 组件
3. 将所有页面迁移到新组件

### 低优先级
1. 考虑为超宽屏幕添加更大的宽度限制（如 `max-w-6xl`）
2. 优化响应式断点逻辑

---

## 变更日志

### v1.0 - 2026-04-13
- 初始版本
- 定义了标准布局和表单布局规范
- 明确了间距和响应式设计标准
- 修复了 Programs、Templates、Universities 页面的布局问题
