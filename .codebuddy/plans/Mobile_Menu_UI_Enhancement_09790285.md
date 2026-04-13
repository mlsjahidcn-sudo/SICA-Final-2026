---
name: Mobile Menu UI Enhancement
overview: Enhance the mobile main menu with improved Shadcn components, better visual hierarchy, icons for navigation items, smooth animations, and professional responsive design.
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Modern
    - Clean
    - Professional
    - Card-based
    - Smooth animations
    - Touch-friendly
  fontSystem:
    fontFamily: Inter
    heading:
      size: 18px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 16px
      weight: 400
  colorSystem:
    primary:
      - "#0f172a"
      - "#3b82f6"
    background:
      - "#ffffff"
      - "#f8fafc"
      - "#f1f5f9"
    text:
      - "#0f172a"
      - "#64748b"
      - "#94a3b8"
    functional:
      - "#ef4444"
      - "#22c55e"
      - "#f59e0b"
todos:
  - id: add-nav-icons
    content: 为所有导航项添加图标，创建导航配置对象
    status: completed
  - id: enhance-nav-styling
    content: 优化导航项样式，添加卡片效果和悬停状态
    status: completed
    dependencies:
      - add-nav-icons
  - id: improve-collapsible
    content: 增强 Programs 可展开区域的动画和视觉设计
    status: completed
  - id: enhance-user-section
    content: 改进用户资料区域的卡片设计和角色显示
    status: completed
  - id: improve-cta-button
    content: 优化 Apply Now 按钮视觉效果
    status: completed
  - id: add-section-groups
    content: 添加区域分组和分隔线
    status: completed
    dependencies:
      - enhance-nav-styling
  - id: add-animations
    content: 添加流畅的过渡动画和触摸反馈
    status: completed
  - id: test-responsive
    content: 测试响应式布局和触摸交互
    status: completed
    dependencies:
      - add-animations
---

## 用户需求

增强移动端主导航菜单的UI设计，使其符合Shadcn组件规范，具有专业的响应式设计。

## 功能概述

优化移动端导航菜单的视觉层次、交互体验和动画效果，包括：

- 为导航项添加图标以提升识别度
- 优化分组布局和视觉层次
- 增强 Programs 可展开区域的设计
- 改进用户资料区域显示
- 优化 CTA 按钮视觉效果
- 添加流畅的过渡动画
- 确保触摸友好的交互尺寸

## 视觉效果

现代化、专业的移动端导航菜单，具有清晰的视觉层次、流畅的动画过渡、图标化的导航项，以及符合 Shadcn 设计规范的卡片式布局。

## 技术栈

### 组件库

- **shadcn/ui**: Sheet, Collapsible, Button, Avatar, Separator, Badge
- **图标**: @tabler/icons-react (已导入)
- **样式**: Tailwind CSS 4

### 实现策略

#### 1. 导航项增强

为每个导航链接添加对应图标，使用卡片式容器：

```
导航项分组：
- 主导航：Free Assessment (IconSparkles), Universities (IconSchool), Blog (IconFileText), Success Cases (IconAward)
- Programs：可展开区域 (IconGraduationCap)
- 关于：About (IconInfoCircle), Partners (IconBuilding), Contact (IconMail)
```

#### 2. 视觉层次优化

- 使用 `rounded-lg` 和 `hover:bg-accent` 实现卡片效果
- 使用 `Separator` 组件分隔不同区域
- 主要操作使用 `text-primary` 突出显示
- 次要操作使用 `text-muted-foreground`

#### 3. Programs 可展开区域

- 添加 `IconChevronRight` 旋转动画
- 使用 `data-[state=open]:rotate-90` 状态动画
- 子项使用左边框 `border-l-2` 视觉引导
- 平滑的展开/收起过渡

#### 4. 动画与过渡

- 所有交互元素添加 `transition-all duration-200`
- 点击效果 `active:scale-[0.98]`
- Sheet 内容淡入动画
- Collapsible 平滑展开

#### 5. 响应式触摸目标

- 最小触摸目标 44px (`py-3` 或 `h-11`)
- 项间距 `space-y-1` 或 `gap-2`
- 长菜单滚动处理 `overflow-y-auto`

### 文件结构

```
src/components/layout/header.tsx
├── 移动端菜单 Sheet 组件
│   ├── 头部区域（Logo + 关闭按钮）
│   ├── 用户信息卡片（已登录时）
│   ├── CTA 按钮（Apply Now）
│   ├── 主导航区域
│   │   ├── Free Assessment（高亮）
│   │   ├── Universities
│   │   ├── Blog
│   │   └── Success Cases
│   ├── Programs 可展开区域
│   │   ├── Bachelor's Degrees
│   │   ├── Master's Degrees
│   │   ├── PhD Programs
│   │   ├── Language Programs
│   │   └── View All Programs
│   ├── 关于区域
│   │   ├── About
│   │   ├── Partners
│   │   └── Contact
│   ├── 账户区域（已登录）
│   │   ├── Dashboard
│   │   ├── Profile
│   │   └── 角色相关链接
│   └── 认证按钮
│       ├── Sign In / Register（未登录）
│       └── Sign Out（已登录）
```

### 关键代码结构

```typescript
// 导航项配置
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

// 主导航项
const mainNavItems: NavItem[] = [
  { label: 'Free Assessment', href: '/assessment', icon: <IconSparkles />, highlight: true },
  { label: 'Universities', href: '/universities', icon: <IconSchool /> },
  { label: 'Blog', href: '/blog', icon: <IconFileText /> },
  { label: 'Success Cases', href: '/success-cases', icon: <IconAward /> },
];

// 关于导航项
const aboutNavItems: NavItem[] = [
  { label: 'About', href: '/about', icon: <IconInfoCircle /> },
  { label: 'Partners', href: '/partners', icon: <IconBuilding /> },
  { label: 'Contact', href: '/contact', icon: <IconMail /> },
];
```

### 性能考虑

- 使用 CSS transitions 而非 JavaScript 动画
- 避免不必要的重渲染
- 图标组件懒加载优化

## 设计风格

采用现代化的卡片式导航设计，符合 Shadcn UI 规范。使用清晰的视觉层次、柔和的背景色区分区域、流畅的动画过渡，打造专业的移动端导航体验。

## 布局设计

### 整体结构（从上到下）

1. **头部区域**：Logo + 关闭按钮
2. **用户卡片**（已登录）：头像、姓名、邮箱、角色标签
3. **CTA 区域**：Apply Now 大按钮（渐变背景）
4. **主导航区**：带图标的导航链接，卡片式布局
5. **Programs 展开**：可折叠的程序列表
6. **关于区域**：分隔线后的辅助导航
7. **账户区域**：用户相关链接
8. **认证按钮**：登录/注册/登出

### 单个导航项设计

- 高度：44-48px（触摸友好）
- 内边距：py-3 px-4
- 圆角：rounded-lg
- 悬停：hover:bg-accent
- 图标：左侧，20x20px
- 文字：16px，font-medium
- 高亮项：text-primary + 图标着色

### Programs 可展开区域

- 触发器：全宽按钮，右箭头指示
- 展开状态：箭头旋转 90deg
- 子项：左侧 2px 边框，缩进
- 背景：bg-muted/50
- 动画：平滑高度过渡