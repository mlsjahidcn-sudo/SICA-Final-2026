# SICA (Study in China Academy) - 开发规范

## 项目概览

SICA 是一个完整的留学中介管理平台，支持多语言（中文/英文/法文）。

**技术栈：**
- Framework: Next.js 16 (App Router)
- Core: React 19
- Language: TypeScript 5
- Database: Supabase (PostgreSQL)
- Styling: Tailwind CSS + shadcn/ui
- Real-time: WebSocket

**访问地址：** https://abc123.dev.coze.site

## 核心功能

### 用户角色
- **Public**: 访客浏览、课程搜索、大学信息
- **Student**: 申请管理、进度跟踪、个人资料
- **Partner**: 合作伙伴管理、学生分配、佣金跟踪
- **Admin**: 全局管理、数据分析、用户管理

### 主要模块
- 首页 (Public pages)
- 学生门户 (Student Portal v2)
- 合作伙伴门户 (Partner Portal v2)
- 管理后台 (Admin v2)
- 博客系统 (Blog CRUD)
- AI 聊天助手

## 环境变量

必需配置在 `.env.local`：
```
COZE_SUPABASE_URL=https://maqzxlcsgfpwnfyleoga.supabase.co
COZE_SUPABASE_ANON_KEY=<JWT Anon Key>
COZE_SUPABASE_SERVICE_ROLE_KEY=<JWT Service Role Key>
MOONSHOT_API_KEY=<Moonshot API Key>
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式 (端口 5000)
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm ts-check

# 代码检查
pnpm lint

# 测试
pnpm test
```

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── (public)/          # 公共页面
│   ├── (student)/         # 学生门户
│   ├── (partner)/         # 合作伙伴门户
│   ├── (admin)/          # 管理后台
│   └── api/              # API 路由
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 基础组件
│   ├── student/          # 学生相关组件
│   ├── partner/          # 合作伙伴组件
│   └── admin/            # 管理后台组件
├── contexts/             # React Context
├── hooks/                 # 自定义 Hooks
├── lib/                   # 工具函数
├── storage/              # Supabase 客户端和存储
└── ws-handlers/          # WebSocket 处理器
```

## API 接口

| 路径 | 方法 | 描述 |
|------|------|------|
| `/api/universities` | GET | 获取大学列表 |
| `/api/programs` | GET | 获取课程列表 |
| `/api/scholarships` | GET | 获取奖学金 |
| `/api/testimonials` | GET | 获取成功案例 |
| `/api/partners` | GET | 获取合作伙伴 |
| `/api/auth/*` | POST | 认证接口 |
| `/api/chat/*` | POST | AI 聊天 |

## 数据库

使用 Supabase PostgreSQL，表包括：
- `profiles` - 用户资料
- `universities` - 大学信息
- `programs` - 课程信息
- `scholarships` - 奖学金
- `applications` - 申请记录
- `success_cases` - 成功案例
- `partner_showcases` - 合作伙伴展示
- `blogs` - 博客文章

## 常见问题

1. **API 返回 500**: 检查 Supabase 凭证是否正确配置
2. **HMR 不工作**: 重启开发服务器
3. **表不存在**: 确认 Supabase 数据库已创建相应表

## 开发规范

1. 使用 TypeScript 类型定义
2. 组件使用 shadcn/ui 风格
3. 遵循 Next.js App Router 规范
4. API 响应格式统一：`{ success, data, error }`
5. 使用 zod 进行环境变量验证
