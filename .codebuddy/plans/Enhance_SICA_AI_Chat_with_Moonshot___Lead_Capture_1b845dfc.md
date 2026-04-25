---
name: Enhance SICA AI Chat with Moonshot & Lead Capture
overview: 增强 SICA AI 聊天功能，集成完整的线索捕获表单并创建可分享的专用聊天页面
todos:
  - id: integrate-lead-form
    content: 修改 chat-widget.tsx，集成 LeadCaptureForm 替换简单对话框
    status: completed
  - id: create-chat-page
    content: 创建 /chat 专用聊天页面，支持全屏聊天和链接分享
    status: completed
  - id: add-share-feature
    content: 添加聊天分享功能，生成可分享链接
    status: completed
    dependencies:
      - create-chat-page
---

## 产品概述

增强 SICA AI 聊天系统，集成完整的线索捕获功能和专用聊天页面

## 核心功能

1. **AI 聊天增强** - 已使用 Moonshot API (Kimi K2.5) 提供智能对话
2. **线索捕获表单** - 将完整表单集成到聊天组件，捕获学生信息（姓名、邮箱、WhatsApp、学位、专业等），存储到管理员线索模块
3. **专用聊天页面** - 创建 `/chat` 页面，可分享链接给学生进行全屏聊天

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **LLM**: Moonshot API (Kimi K2.5) - 已配置 ✅
- **Database**: Supabase PostgreSQL

## 实现方案

### 1. 聊天组件线索捕获增强

修改 `chat-widget.tsx`，将现有的简单对话框替换为完整的 `LeadCaptureForm` 组件：

- 用户发送 5 条消息后触发完整表单
- 表单提交到 `/api/leads`，存储到 `leads` 表
- 管理员可在 `/admin/v2/leads` 查看和管理

### 2. 专用聊天页面

创建 `/chat` 页面：

- 全屏聊天体验，适合分享给学生
- 支持分享链接功能
- 复用现有聊天逻辑和组件

## 目录结构

```
src/
├── app/
│   └── chat/
│       └── page.tsx          # [NEW] 专用聊天页面
├── components/
│   ├── chat-widget.tsx       # [MODIFY] 集成 LeadCaptureForm
│   └── chat/
│       └── lead-capture-form.tsx  # [EXISTING] 线索表单组件
```

## 实现要点

- 复用现有的 `LeadCaptureForm` 组件
- 保持与现有 leads 系统的数据兼容性
- 专用页面支持独立 URL 分享