---
name: Fix Hostinger Deployment Issues
overview: 修复导致 Hostinger 部署失败的所有 TypeScript 类型错误和配置问题
todos:
  - id: fix-api-route-errors
    content: 修复 API 路由 TypeScript 类型错误（7 个文件）
    status: pending
  - id: fix-component-errors
    content: 修复组件模块引用错误，创建缺失的 types 文件
    status: pending
  - id: fix-lib-errors
    content: 修复工具库类型错误（api-response, env-validation, student validations）
    status: pending
  - id: verify-build
    content: 运行 TypeScript 检查和构建验证
    status: pending
    dependencies:
      - fix-api-route-errors
      - fix-component-errors
      - fix-lib-errors
---

## 用户需求

检查并修复所有导致 Hostinger 部署失败的问题

## 核心问题

运行 `pnpm run ts-check` 发现 **22 个 TypeScript 编译错误**，这些错误会导致 Next.js 构建失败，从而阻止部署。

## 问题分类

### 1. API 路由类型错误（7 个错误）

- 类型不匹配和缺失属性
- 影响文件：`claim/route.ts`, `admin/students/[id]/route.ts`, `partner/students/route.ts`, `student/applications/route.ts`

### 2. 组件模块引用错误（4 个错误）

- 找不到 `../types` 模块
- 影响文件：`add-application/` 目录下的 4 个组件

### 3. 工具库类型错误（5 个错误）

- Zod 错误处理、API 响应类型、验证函数参数
- 影响文件：`api-response.ts`, `env-validation.ts`, `validations/student.ts`

### 4. Dockerfile 配置问题

- 使用 `npm` 但项目指定 `pnpm@9.0.0` 作为包管理器

## 技术栈

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5
- **Package Manager**: pnpm 9.0.0+
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Hostinger (Docker standalone)

## 修复策略

### 1. TypeScript 类型错误修复

- **类型断言与空值处理**：使用可选链和空值合并运算符
- **缺失属性**：扩展类型定义或使用类型断言
- **模块导入**：创建缺失的类型文件或修正导入路径

### 2. Dockerfile 优化

- 保持使用 `npm` 以兼容 Hostinger 共享主机环境
- 确保 `package-lock.json` 存在（通过 `npm install` 生成）

### 3. 构建验证

- 修复后运行 `pnpm run ts-check` 验证
- 运行 `pnpm run build` 确保构建成功