---
name: Disable FAQ, TOS, and Privacy Pages
overview: Disable the three public pages (FAQ, Terms of Service, Privacy Policy) by redirecting them to home page
todos:
  - id: add-redirects
    content: Add redirect to home page for FAQ, Terms, and Privacy pages
    status: completed
  - id: remove-footer-links
    content: Remove FAQ, Privacy, Terms links from Footer component
    status: completed
  - id: remove-register-links
    content: Remove Terms and Privacy links from registration pages
    status: completed
  - id: remove-contact-faq
    content: Remove FAQ button from Contact page
    status: completed
---

## User Requirements

用户需要临时禁用以下三个页面：

- `/faq` - FAQ页面
- `/terms` - 服务条款页面
- `/privacy` - 隐私政策页面

这些页面需要被禁用，但可能在未来重新启用。

## 影响范围

这些页面在以下位置被引用：

1. **Footer** (`src/components/layout/footer.tsx`) - FAQ、Privacy、Terms链接
2. **Student Register** (`src/app/(auth)/register/page.tsx`) - Terms、Privacy链接（注册协议）
3. **Partner Register** (`src/app/(auth)/partner/register/page.tsx`) - Terms、Privacy链接（注册协议）
4. **Contact Page** (`src/app/(public)/contact/page.tsx`) - FAQ链接

## Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript

## Implementation Approach

使用 Next.js 的 `redirect()` 函数将三个页面重定向到首页 (`/`)，同时移除所有指向这些页面的链接。

### 具体方案：

1. **页面重定向**：在每个页面文件中使用 `redirect('/')` 重定向到首页
2. **移除链接**：从 Footer、Register页面、Contact页面 移除指向这些被禁用页面的链接

### 文件修改清单：

1. `src/app/(public)/faq/page.tsx` - 添加重定向
2. `src/app/(public)/terms/page.tsx` - 添加重定向
3. `src/app/(public)/privacy/page.tsx` - 添加重定向
4. `src/components/layout/footer.tsx` - 移除 FAQ、Privacy、Terms 链接
5. `src/app/(auth)/register/page.tsx` - 移除协议链接文本
6. `src/app/(auth)/partner/register/page.tsx` - 移除协议链接文本
7. `src/app/(public)/contact/page.tsx` - 移除 FAQ 按钮