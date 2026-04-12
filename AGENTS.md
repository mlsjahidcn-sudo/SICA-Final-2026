# 项目上下文

## 🔴 CRITICAL: External Supabase Database Configuration

**IMPORTANT**: This application MUST use the external Supabase database at all times. 

- **External Supabase URL**: `https://maqzxlcsgfpwnfyleoga.supabase.co`
- **Project Ref**: `maqzxlcsgfpwnfyleoga`
- **Required Environment Variables**:
  - `COZE_SUPABASE_URL`
  - `COZE_SUPABASE_ANON_KEY`
  - `COZE_SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL`

**DO NOT**:
- ❌ Use local SQLite, PostgreSQL, or any other database
- ❌ Create mock databases or in-memory databases
- ❌ Hardcode database credentials in code
- ❌ Use different Supabase projects without explicit approval
- ❌ Run SQL via local psql or any local database client

**ALWAYS**:
- ✅ Use the external Supabase database configured in `.env.local`
- ✅ Ensure all database operations go through Supabase client
- ✅ Use the service role key for admin operations
- ✅ Use the anon key for public/anonymous operations
- ✅ Check database connectivity before assuming local fallback
- ✅ Use `exec_sql` tool with `env: "develop"` for all SQL operations on the external Supabase database

### exec_sql Usage Rule

When running SQL queries against the external Supabase database, **always** use the `exec_sql` tool with `env: "develop"`. This ensures the SQL is executed against the external Supabase at `maqzxlcsgfpwnfyleoga.supabase.co`, NOT a local database.

**⚠️ CRITICAL: exec_sql may return stale data!** The `exec_sql` tool may cache results or read from a replica. For critical data verification (role, partner_role, etc.), **ALWAYS verify via the Supabase REST API** using the service role key, NOT `exec_sql`:

```bash
# ✅ CORRECT - Real-time verification via REST API
curl -s "https://maqzxlcsgfpwnfyleoga.supabase.co/rest/v1/users?select=id,email,role,partner_role&id=eq.USER_ID" \
  -H "apikey: SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"

# ❌ UNRELIABLE - May return stale data
exec_sql(sql: "SELECT role FROM users WHERE id = 'USER_ID';")
```

**⚠️ IMPORTANT**: Do NOT use `psql`, `pg_isready`, or any shell-based PostgreSQL client. These may connect to a local PostgreSQL instance if one exists, causing schema/data drift between local and external databases.

```yaml
# ✅ CORRECT - Uses external Supabase via exec_sql tool
exec_sql(env: "develop", sql: "SELECT * FROM users LIMIT 5;")

# ❌ WRONG - May connect to local database
exec_shell(command: "psql -c 'SELECT * FROM users LIMIT 5;'")

# ❌ WRONG - May connect to local database  
exec_shell(command: "PGPASSWORD=xxx psql -h localhost ...")
```

**Why this matters**: The `exec_sql` tool with `env: "develop"` is configured to route to the correct external Supabase instance. Shell-based PostgreSQL commands may resolve to a local `psql` binary that defaults to a local socket or localhost connection, leading to:
- Tables/columns created in the wrong database
- Data inserted locally instead of externally
- Schema mismatches between what PostgREST sees and what your code expects

**Verifying connection**: After running DDL (CREATE/ALTER), verify the change via the PostgREST REST API (not information_schema via exec_sql, which may show stale or different results):
```bash
curl -s "https://maqzxlcsgfpwnfyleoga.supabase.co/rest/v1/{table}?select=*&limit=1" \
  -H "apikey: {SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer {SERVICE_ROLE_KEY}"
```

**Database Connection File**: `src/storage/database/supabase-client.ts`

### ⚠️ RLS on `users` Table — Infinite Recursion

The `users` table has RLS enabled but queries via the **anon key client** result in an infinite recursion error. This is caused by RLS policies on other tables (e.g., `partner_team_activity`) that reference `users` in their policy expressions, creating a circular dependency.

**Impact**: All direct PostgREST queries with the anon key to `users` fail with `42P17: infinite recursion detected`.

**Workaround**: All application code uses the **service role key** (`getSupabaseClient()`) to query `users`, which bypasses RLS entirely. The signin API was updated to use the service role client for profile lookup.

**RLS Helper Functions**: `public.is_partner_admin()` and `public.get_partner_admin_id()` are `SECURITY DEFINER` functions used in RLS policies to avoid referencing `users` directly in policy expressions. When adding new RLS policies that need to check partner roles, always use these helper functions instead of querying `users` directly.

---

## Admin Development Guidelines
**IMPORTANT**: All future admin-related development, edits, and new features MUST use the admin-v2 interface located at `src/app/admin/(admin-v2)/v2/`. The old admin directory (`src/app/admin/(admin)/`) is deprecated and should only be used for reference.

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL + Auth)
- **WebSocket**: ws 库 (自定义服务器，实时通知)
- **Object Storage**: S3 兼容对象存储 (coze-coding-dev-sdk)
- **Testing**: Vitest (单元测试) + Playwright (E2E 测试)
- **i18n**: 自定义 React Context + Hooks (支持中英文切换)

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── admin/          # 管理员界面
│   │   │   ├── applications/  # 申请审核
│   │   │   │   └── [id]/meeting/  # 会议调度
│   │   │   ├── programs/    # 项目管理
│   │   │   └── universities/ # 大学管理
│   │   ├── partner/        # 合作伙伴界面
│   │   │   ├── page.tsx    # 仪表盘
│   │   │   └── applications/  # 申请查看
│   │   ├── (partner-v2)/   # 合作伙伴界面 v2 (shadcn dashboard-01)
│   │   │   └── partner-v2/
│   │   │       ├── layout.tsx    # v2 layout with sidebar
│   │   │       ├── page.tsx      # v2 仪表盘
│   │   │       └── applications/ # v2 申请管理
│   │   ├── student/        # 学生界面
│   │   │   ├── page.tsx    # 学生仪表盘
│   │   │   ├── profile/    # 个人资料管理
│   │   │   ├── applications/  # 申请列表
│   │   │   └── meetings/    # 会议列表
│   │   ├── (student-v2)/   # 学生界面 v2 (shadcn dashboard-01)
│   │   │   └── student-v2/
│   │   │       ├── layout.tsx    # v2 layout with sidebar
│   │   │       ├── page.tsx      # v2 仪表盘
│   │   │       ├── applications/ # v2 申请管理
│   │   │       ├── documents/    # v2 文档库
│   │   │       ├── meetings/     # v2 会议管理
│   │   │       ├── universities/ # v2 大学浏览
│   │   │       ├── programs/     # v2 项目浏览
│   │   │       ├── profile/      # v2 个人资料
│   │   │       ├── notifications/# v2 通知中心
│   │   │       ├── settings/     # v2 设置
│   │   │       └── favorites/    # v2 收藏夹
│   │   ├── api/            # API 路由
│   │   │   ├── admin/meetings/  # 会议管理 API
│   │   │   ├── admin/documents/  # 文档审核 API
│   │   │   ├── notifications/   # 通知 API (含实时通知发送)
│   │   │   ├── documents/   # 文档上传 API
│   │   │   ├── student/dashboard/  # 学生仪表盘 API
│   │   │   ├── student/profile/    # 学生资料 API
│   │   │   ├── student/settings/   # 学生设置 API
│   │   │   ├── meetings/    # 学生会议 API
│   │   │   └── cron/meeting-reminders/  # 定时提醒
│   │   ├── apply/          # 申请表单
│   │   ├── programs/       # 项目浏览
│   │   └── universities/   # 大学浏览
│   ├── components/ui/      # Shadcn UI 组件库
│   │   ├── file-upload.tsx # 文件上传组件
│   ├── components/chat/    # AI 聊天助手组件
│   │   └── chat-widget.tsx # 聊天浮动组件
│   ├── components/partner-v2/  # 合作伙伴 v2 组件
│   │   ├── partner-sidebar.tsx  # v2 侧边栏
│   │   ├── partner-stats-cards.tsx  # 统计卡片
│   │   └── partner-applications-chart.tsx  # 应用图表
│   ├── components/student-v2/  # 学生 v2 组件
│   │   ├── student-sidebar.tsx # 学生侧边栏
│   │   ├── student-realtime-provider.tsx # 实时通知 Provider
│   │   └── realtime-notification-toast.tsx # Toast 通知组件
│   ├── contexts/           # React Context
│   │   ├── auth-context.tsx # 认证上下文
│   │   └── realtime-notifications-context.tsx # 实时通知上下文
│   ├── hooks/              # 自定义 Hooks
│   │   └── use-websocket.ts # WebSocket Hook
│   ├── lib/                # 工具库
│   │   ├── utils.ts        # 通用工具函数 (cn)
│   │   ├── auth-utils.ts   # 认证工具函数
│   │   ├── email.ts        # 邮件服务与模板
│   │   └── ws-client.ts    # WebSocket 客户端库
│   ├── ws-handlers/        # WebSocket 处理器
│   │   └── notifications.ts # 通知处理器
│   └── server.ts           # 自定义服务端入口 (HTTP + WebSocket)
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

- **项目理解加速**：初始可以依赖项目下`package.json`文件理解项目类型，如果没有或无法理解退化成阅读其他文件。
- **Hydration 错误预防**：严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。


## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

### 背景与装饰设计规则 (Background & Decoration Rules)

- **禁止在表单页面使用装饰性背景卡片/图案** - 表单页面必须保持简洁、专业
- **仅使用纯色背景** - 表单页面使用 `bg-background` 或 `bg-card`，不得添加浮动装饰元素
- **装饰元素仅限营销落地页** - 模糊圆形、渐变背景等装饰效果仅适用于首页等营销页面
- **专业表单设计原则**：
  - 使用标准 `Card` 组件作为容器
  - 合理使用 `grid` 布局实现响应式表单（`sm:grid-cols-2`）
  - 清晰的标签和占位符文本
  - 一致的间距和对齐
  - 使用 `Separator` 组件分隔内容区块
  - 进度指示器应简洁明了

### Shadcn 组件使用规范

- 优先使用 `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` 构建卡片布局
- 表单使用 `Label`, `Input`, `Select`, `Textarea` 等组件
- 按钮使用 `Button` 组件，通过 `variant` 区分样式
- 分隔线使用 `Separator` 组件
- 进度条使用 `Progress` 组件
- 保持设计与 shadcn neutral 主题一致

## 功能模块

### 申请系统 (Application System)

申请系统支持完整的学生申请流程：

**状态流转**：
- `draft` → `submitted` → `under_review` → `accepted`/`rejected`
- 其他状态：`document_request`（文档请求）、`interview_scheduled`（面试安排）、`withdrawn`（撤回）

**用户角色**：
- **学生**：创建、编辑、提交申请；查看申请状态
- **合作伙伴**：查看申请列表和详情、编辑草稿申请（program、personal statement、study plan、notes、priority）
- **管理员**：审核申请、更新状态、添加评论

**🔴 CRITICAL: `profile_snapshot` JSONB Architecture**:
The `applications` table uses a `profile_snapshot` JSONB column to store flexible application content. Key fields stored inside `profile_snapshot`:
- `personal_statement` - Personal statement text
- `study_plan` - Study plan text
- `intake` - Intake/semester selection
- `university_id` - Target university ID
- Other dynamic fields from the application form

**Direct columns on `applications` table**: `id`, `student_id`, `program_id`, `partner_id`, `status`, `priority` (integer: 0=normal, 1=low, 2=high, 3=urgent), `notes`, `submitted_at`, `reviewed_at`, `reviewed_by`, `created_at`, `updated_at`, `profile_snapshot`

**API Response Convention**: All GET APIs extract `personal_statement`, `study_plan`, and `intake` from `profile_snapshot` and return them as top-level fields for frontend convenience. PUT APIs accept these as top-level body fields and merge them into `profile_snapshot` automatically.

**⚠️ Database Schema Verification**: The `exec_sql` tool may return stale/different schema data compared to the actual Supabase database. ALWAYS verify column existence via the PostgREST REST API (`/rest/v1/applications?select=*&limit=1`), not `exec_sql` or `information_schema`.

**Partner Access Control**:
- Partner admin: Can access all applications from their partner organization + team members' referrals
- Partner member: Can only access applications for students they referred
- Uses `canPartnerAccessApplication()` function which checks `partners.id` (not `users.id`) for org-level access
- A partner user may have multiple `partners` records (use `select` instead of `maybeSingle` when querying by `user_id`)

**Edit Restrictions**:
- Only `draft` applications can be edited (PUT returns 400 for non-draft)
- Only `draft` applications can be submitted (POST returns 400 for non-draft)

**API 端点**：
- `POST /api/applications` - 创建申请
- `GET /api/applications` - 获取申请列表
- `GET /api/applications/[id]` - 获取申请详情
- `PUT /api/applications/[id]` - 更新申请
- `POST /api/applications/[id]` - 提交申请
- `GET /api/admin/applications` - 管理员获取申请列表
- `PUT /api/admin/applications/[id]` - 管理员审核申请

**数据表**：
- `applications` - 申请主表
- `application_documents` - 申请文档
- `application_status_history` - 状态变更历史

### 博客系统 (Blog System)

博客系统用于内容营销和SEO优化，支持中英文双语内容。

**功能特性**：
- 博客文章发布与管理
- 分类和标签管理
- 中英文双语支持
- SEO 优化（自定义标题、描述、关键词）
- 阅读时间估算
- 浏览量统计
- 精选文章标记
- 相关文章推荐
- 社交分享功能
- AI 内容生成（标题、摘要、正文、SEO字段）
- 实时流式 AI 生成反馈
- AI 主题建议功能
- 博客编辑器（内容、媒体、SEO、设置四个标签页）
- 实时 SEO 预览功能
- **Topic-based Full Content Generation**: Enter a topic and AI generates all content (titles, excerpts, full article, SEO, FAQs)
- **Internal Link Suggestions**: AI suggests 3-5 relevant internal links with natural anchor texts
- **Auto FAQ Generator**: AI generates 5-8 relevant FAQs based on article content
- **Enhanced Blog Editor UI**: 6 tabs (Content, Media, SEO, Internal Links, FAQs, Settings)
- **Schema Markup (coming soon)**: Auto-generate Article, FAQ, Breadcrumb, and other schema
- **Quick Generate Panel**: One-click "Generate All Content" from a single topic

**页面路由**：
- `/blog` - 博客列表页
- `/blog/[slug]` - 博客详情页
- `/admin/v2/blog` - 管理员博客管理 (**Admin-v2: Use this for all future development**)
- `/admin/v2/blog/new` - 创建新文章 v2
- `/admin/v2/blog/[id]/edit` - 编辑文章 v2

**API 端点**：
- `GET /api/blog` - 获取已发布文章列表
- `GET /api/blog/[slug]` - 获取文章详情
- `GET /api/blog/categories` - 获取分类列表
- `GET /api/blog/tags` - 获取标签列表
- `GET /api/admin/blog` - 管理员获取所有文章
- `POST /api/admin/blog` - 创建文章
- `GET /api/admin/blog/[id]` - 获取文章详情（管理员）
- `PUT /api/admin/blog/[id]` - 更新文章
- `DELETE /api/admin/blog/[id]` - 删除文章
- `POST /api/admin/blog/ai/generate` - AI 内容生成（流式输出）
- `POST /api/admin/blog/ai/suggest-topics` - AI 主题建议

**数据表**：
- `blog_categories` - 博客分类表
- `blog_tags` - 博客标签表
- `blog_posts` - 博客文章表
- `blog_post_tags` - 文章-标签关联表

**文章状态**：
- `draft` - 草稿
- `published` - 已发布
- `archived` - 已归档

### 用户评价系统 (Testimonials System)

用户评价系统用于展示社交证明，提高网站转化率。

**功能特性**：
- 用户评价展示（支持视频和图片）
- 中英文双语支持
- 国家标志显示
- 星级评分（1-5星）
- 精选评价标记
- 自动轮播展示
- 评价来源追踪

**页面路由**：
- `/` - 首页展示精选评价
- `/admin/testimonials` - 管理员评价管理

**API 端点**：
- `GET /api/testimonials` - 获取已审核评价列表
- `GET /api/admin/testimonials` - 管理员获取所有评价
- `POST /api/admin/testimonials` - 创建评价
- `GET /api/admin/testimonials/[id]` - 获取评价详情
- `PUT /api/admin/testimonials/[id]` - 更新评价
- `DELETE /api/admin/testimonials/[id]` - 删除评价

**数据表**：
- `testimonials` - 用户评价表

**评价状态**：
- `pending` - 待审核
- `approved` - 已审核
- `featured` - 精选
- `rejected` - 已拒绝

**评价来源**：
- `website` - 网站提交
- `google` - Google 评价
- `facebook` - Facebook 评价
- `linkedin` - LinkedIn 评价
- `manual` - 手动添加

### 合作伙伴仪表盘 (Partner Dashboard)

合作伙伴可通过仪表盘查看统计数据和关键指标：

**功能特性**：
- 申请统计概览（总数、待审核、已录取、审核中）
- 环比增长指标
- 最近申请列表
- 状态分布图表
- 时间范围筛选（7天/30天/90天/1年）

**API 端点**：
- `GET /api/partner/dashboard` - 获取仪表盘统计数据

### 合作伙伴仪表盘 v2 (Partner Dashboard v2)

基于 shadcn dashboard-01 模板的现代化仪表盘界面：

**功能特性**：
- 响应式侧边栏 (collapsible offcanvas)
- 统计卡片组件 (PartnerStatsCards)
- 应用趋势图表 (PartnerApplicationsChart)
- 用户下拉菜单
- 移动端自适应布局
- 申请详情页 (带标签页)
- 申请时间线
- 文档查看器
- 数据导出 (CSV/JSON)
- 学生管理 (列表与详情)
- 数据分析与报告 (Analytics Dashboard)
- 通知中心 (Notifications Center)
- 设置与个人资料 (Settings & Profile)
- 日历与会议 (Calendar & Meetings)
- 大学浏览 (University Browser)

**页面路由**：
- `/partner-v2` - v2 仪表盘
- `/partner-v2/applications` - v2 申请列表
- `/partner-v2/applications/[id]` - 申请详情
- `/partner-v2/applications/[id]/documents` - 文档查看器
- `/partner-v2/students` - 学生列表
- `/partner-v2/students/[id]` - 学生详情
- `/partner-v2/universities` - 大学列表
- `/partner-v2/universities/[id]` - 大学详情
- `/partner-v2/meetings` - 会议列表
- `/partner-v2/meetings/calendar` - 日历视图
- `/partner-v2/meetings/[id]` - 会议详情
- `/partner-v2/analytics` - 数据分析仪表盘
- `/partner-v2/notifications` - 通知中心
- `/partner-v2/settings` - 设置页面
- `/partner-v2/profile` - 个人资料页面

**API 端点**：
- `GET /api/partner/dashboard` - 获取仪表盘统计数据
- `GET /api/partner/analytics` - 获取分析数据
- `GET /api/partner/export` - 导出申请数据
- `GET /api/partner/students` - 获取学生列表
- `GET /api/partner/students/[id]` - 获取学生详情
- `GET /api/applications/[id]/timeline` - 获取申请状态历史
- `GET /api/partner/notifications` - 获取通知列表
- `POST /api/partner/notifications/[id]/read` - 标记通知已读
- `GET /api/partner/settings` - 获取用户设置
- `PUT /api/partner/settings` - 更新用户设置
- `GET /api/partner/profile` - 获取个人资料
- `PUT /api/partner/profile` - 更新个人资料
- `POST /api/partner/avatar` - 上传头像
- `GET /api/partner/meetings` - 获取会议列表
- `GET /api/partner/meetings/[id]` - 获取会议详情

**组件**：
- `src/components/partner-v2/partner-sidebar.tsx` - v2 侧边栏
- `src/components/partner-v2/partner-stats-cards.tsx` - 统计卡片
- `src/components/partner-v2/partner-applications-chart.tsx` - 应用图表
- `src/components/partner-v2/application-status-badge.tsx` - 状态徽章
- `src/components/partner-v2/application-timeline.tsx` - 申请时间线
- `src/components/partner-v2/charts/applications-trend-chart.tsx` - 申请趋势图
- `src/components/partner-v2/charts/status-distribution-chart.tsx` - 状态分布图
- `src/components/partner-v2/charts/university-ranking-chart.tsx` - 大学排名图
- `src/components/partner-v2/charts/program-analytics-chart.tsx` - 项目分析图
- `src/components/partner-v2/charts/conversion-funnel.tsx` - 转化漏斗

### 数据分析与报告 (Analytics Dashboard)

合作伙伴可通过分析仪表盘获取深度洞察和报告：

**功能特性**：
- 概览统计卡片（总申请数、录取率、待处理率、增长率）
- 申请趋势图（按日期的应用数、录取数、拒绝数）
- 状态分布饼图（各状态占比）
- 大学排名柱状图（热门大学申请数）
- 项目分析柱状图（热门项目统计）
- 转化漏斗（从提交到录取的转化率）
- 时间范围筛选（7天/30天/90天/1年）
- 数据导出（CSV/JSON）

**页面路由**：
- `/partner-v2/analytics` - 分析仪表盘

**API 端点**：
- `GET /api/partner/analytics?days=30` - 获取分析数据

### 通知中心 (Notifications Center)

合作伙伴可通过通知中心查看和管理所有通知：

**功能特性**：
- 通知列表（按时间排序）
- 按类型筛选（全部/未读/申请/会议/文档）
- 标记单个通知为已读
- 一键标记全部已读
- 未读数量徽章显示
- 通知类型图标（申请/会议/文档/系统）

**页面路由**：
- `/partner-v2/notifications` - 通知中心

**API 端点**：
- `GET /api/partner/notifications` - 获取通知列表
- `GET /api/partner/notifications/unread-count` - 获取未读数量
- `POST /api/partner/notifications/[id]/read` - 标记单个通知已读
- `POST /api/partner/notifications/read-all` - 标记全部已读

**数据表**：
- `notifications` - 通知表（id, user_id, type, title, content, link, is_read, read_at, created_at）

**通知类型**：
- `application` - 申请相关通知
- `meeting` - 会议相关通知
- `document` - 文档相关通知
- `system` - 系统通知

### 合作伙伴备注 (Partner Notes)

合作伙伴可对申请或学生添加私密备注，用于内部协作和信息共享。

**功能特性**：
- 添加私密备注到申请或学生
- 备注内容支持换行和长文本
- 私密性控制（仅合作伙伴和管理员可见）
- 备注编辑和删除
- 作者信息和时间戳显示

**页面路由**：
- `/partner-v2/applications/[id]` - 申请详情页（Notes 标签页）
- `/partner-v2/students/[id]` - 学生详情页（Notes 标签页）

**API 端点**：
- `GET /api/partner/notes?application_id=xxx` - 获取申请备注列表
- `GET /api/partner/notes?student_id=xxx` - 获取学生备注列表
- `POST /api/partner/notes` - 创建备注
- `GET /api/partner/notes/[id]` - 获取备注详情
- `PUT /api/partner/notes/[id]` - 更新备注
- `DELETE /api/partner/notes/[id]` - 删除备注

**数据表**：
- `partner_notes` - 合作伙伴备注表
  - `id` - 备注 ID
  - `user_id` - 作者 ID（外键）
  - `application_id` - 关联申请 ID（可选）
  - `student_id` - 关联学生 ID（可选）
  - `content` - 备注内容
  - `is_private` - 是否私密（默认 true）
  - `created_at` - 创建时间
  - `updated_at` - 更新时间

**组件**：
- `src/components/partner-v2/partner-notes.tsx` - 备注管理组件
- `QuickNoteInput` - 快速备注输入组件

**权限控制**：
- 仅合作伙伴和管理员可查看备注
- 仅备注作者和管理员可编辑/删除备注

### 设置与个人资料 (Settings & Profile)

合作伙伴可通过设置页面管理账户偏好和个人信息：

**功能特性**：
- 通知偏好设置（邮件、会议提醒、申请更新）
- 显示设置（语言、时区、日期格式）
- 个人资料编辑（姓名、邮箱、电话）
- 组织信息管理（公司名称、职位、地址、网站）
- 头像上传（支持JPG/GIF/PNG，最大5MB）
- 安全设置（密码修改、双因素认证）

**页面路由**：
- `/partner-v2/settings` - 设置页面
- `/partner-v2/profile` - 个人资料页面

**API 端点**：
- `GET /api/partner/settings` - 获取用户设置
- `PUT /api/partner/settings` - 更新用户设置
- `GET /api/partner/profile` - 获取个人资料
- `PUT /api/partner/profile` - 更新个人资料
- `POST /api/partner/avatar` - 上传头像

**数据表**：
- `user_settings` - 用户设置表（id, user_id, settings JSONB）
- `partner_profiles` - 合作伙伴资料表（id, user_id, company_name, position, address, website）

### 日历与会议 (Calendar & Meetings)

合作伙伴可查看和管理所有面试会议：

**功能特性**：
- 日历视图（月历展示）
- 会议列表视图（按日期分组）
- 会议详情页（视频会议信息）
- 按状态筛选（已安排/已完成/已取消）
- 按时间筛选（今日/即将到来/过去）
- 一键加入视频会议（Zoom/Google Meet/Teams）

**页面路由**：
- `/partner-v2/meetings` - 会议列表
- `/partner-v2/meetings/calendar` - 日历视图
- `/partner-v2/meetings/[id]` - 会议详情

**API 端点**：
- `GET /api/partner/meetings` - 获取会议列表
- `GET /api/partner/meetings/[id]` - 获取会议详情

**数据表**：
- `meetings` - 会议表（id, application_id, student_id, title, meeting_date, duration_minutes, platform, status）
- `meeting_details` - 会议详情视图（含学生、申请、项目信息）

**会议状态**：
- `scheduled` - 已安排
- `completed` - 已完成
- `cancelled` - 已取消
- `rescheduled` - 已改期

### 大学浏览 (University Browser)

合作伙伴可浏览和查看中国大学信息：

**功能特性**：
- 大学列表（网格/列表视图切换）
- 高级搜索（按名称搜索）
- 多维度筛选（省份、类型、类别、奖学金）
- 大学详情页（基本信息、排名、统计数据）
- 项目列表（该大学所有项目）
- 设施信息、住宿信息
- 联系方式查看

**页面路由**：
- `/partner-v2/universities` - 大学列表
- `/partner-v2/universities/[id]` - 大学详情

**API 端点**：
- `GET /api/universities` - 获取大学列表（支持搜索、筛选、分页）
- `GET /api/universities/[id]` - 获取大学详情
- `GET /api/programs?university_id=[id]` - 获取大学项目列表

**筛选参数**：
- `search` - 搜索关键词（中英文名称）
- `province` - 省份筛选
- `type` - 大学类型（985/211/Double First-Class/provincial/private）
- `category` - 学科类别（comprehensive/technical/medical/normal等）
- `scholarship` - 奖学金可用筛选

### 学生门户 (Student Portal)

学生可通过学生门户管理个人信息、查看申请状态和会议安排：

**功能特性**：
- 个人资料管理（基本信息、护照、学历、语言成绩）
- 资料完成度指示器
- 申请状态概览
- 即将到来的会议提醒
- 待处理文档警报
- 快捷操作入口
- 最近活动时间线

**页面路由**：
- `/student` - 学生仪表盘
- `/student/profile` - 个人资料编辑
- `/student/applications` - 申请列表
- `/student/applications/[id]` - 申请详情
- `/student/applications/[id]/documents` - 文档管理
- `/student/meetings` - 会议列表

**API 端点**：
- `GET /api/student/dashboard` - 获取仪表盘数据
- `GET /api/student/profile` - 获取个人资料
- `PUT /api/student/profile` - 更新个人资料

**数据表**：
- `students` - 学生详细信息表
- `users` - 用户账户表

### 学生门户 v2 (Student Portal v2)

学生可通过学生门户 v2 管理所有学习申请相关事务，采用与 Partner Portal v2 相同的设计风格：

**功能特性**：
- **仪表盘**：统计概览、个人资料完成度、即将到来的会议、待处理文档、最近申请
- **申请管理**：申请列表（搜索/筛选/分页）、申请详情（时间线、文档）、新建申请向导
- **文档库**：文档状态管理、上传/下载、重新上传被拒绝文档
- **会议管理**：会议列表、会议详情、日历视图、一键加入视频会议
- **大学浏览**：网格/列表视图、高级搜索、多维度筛选、大学详情
- **项目浏览**：项目列表、学位/学科筛选、奖学金筛选、项目详情
- **个人资料**：分标签编辑（个人信息、教育背景、语言成绩）、资料完成度
- **通知中心**：通知列表、类型筛选、标记已读
- **设置**：通知偏好、显示设置、安全设置
- **收藏夹**：收藏的大学和项目

**页面路由**：
- `/student-v2` - 学生仪表盘
- `/student-v2/applications` - 申请列表
- `/student-v2/applications/new` - 新建申请
- `/student-v2/applications/[id]` - 申请详情
- `/student-v2/applications/[id]/edit` - 编辑申请
- `/student-v2/applications/[id]/documents` - 申请文档
- `/student-v2/templates` - 申请模板管理
- `/student-v2/documents` - 文档库
- `/student-v2/meetings` - 会议列表
- `/student-v2/meetings/calendar` - 日历视图
- `/student-v2/meetings/[id]` - 会议详情
- `/student-v2/universities` - 大学浏览
- `/student-v2/universities/[id]` - 大学详情
- `/student-v2/programs` - 项目浏览
- `/student-v2/programs/[id]` - 项目详情
- `/student-v2/profile` - 个人资料
- `/student-v2/notifications` - 通知中心
- `/student-v2/settings` - 设置页面
- `/student-v2/favorites` - 收藏夹

**API 端点**：
- `GET /api/student/dashboard` - 获取仪表盘数据
- `GET /api/student/applications` - 获取申请列表
- `GET /api/student/applications/[id]` - 获取申请详情
- `POST /api/student/applications` - 创建申请
- `PUT /api/student/applications/[id]` - 更新申请
- `GET /api/student/templates` - 获取模板列表
- `POST /api/student/templates` - 创建模板
- `GET /api/student/templates/[id]` - 获取模板详情
- `PUT /api/student/templates/[id]` - 更新模板
- `DELETE /api/student/templates/[id]` - 删除模板
- `GET /api/meetings` - 获取会议列表
- `GET /api/universities` - 获取大学列表
- `GET /api/programs` - 获取项目列表

**组件**：
- `src/components/student-v2/student-sidebar.tsx` - 学生侧边栏

**设计特点**：
- 响应式侧边栏（移动端 offcanvas）
- 统计卡片组件
- 状态徽章和时间线
- 日历视图集成
- 搜索和筛选功能
- 分页支持

### 申请模板系统 (Application Templates)

学生可创建和管理申请模板，复用个人陈述和学习计划内容。

**功能特性**：
- 创建可复用的申请模板（个人陈述、学习计划）
- 设置默认模板
- 模板使用次数统计
- 从模板预填申请内容
- 申请表单中快速保存为模板
- 模板编辑和删除

**页面路由**：
- `/student-v2/templates` - 模板管理页面

**API 端点**：
- `GET /api/student/templates` - 获取模板列表
- `POST /api/student/templates` - 创建模板
- `GET /api/student/templates/[id]` - 获取模板详情
- `PUT /api/student/templates/[id]` - 更新模板
- `DELETE /api/student/templates/[id]` - 删除模板
- `PATCH /api/student/templates/[id]` - 增加使用次数

**数据表**：
- `application_templates` - 申请模板表
  - `id` - 模板 ID
  - `user_id` - 用户 ID（外键）
  - `name` - 模板名称
  - `description` - 模板描述
  - `personal_statement` - 个人陈述模板
  - `study_plan` - 学习计划模板
  - `is_default` - 是否为默认模板
  - `use_count` - 使用次数

**组件**：
- `src/components/student-v2/template-manager.tsx` - 模板管理组件
- `SaveAsTemplateButton` - 保存为模板按钮

**集成点**：
- 新建申请页面：从模板预填、保存当前内容为模板
- 模板管理页面：完整的 CRUD 操作

### 大学管理 (University Management)

- 大学列表、详情、创建、编辑、删除
- 仅限管理员操作
- **AI大学信息生成**: 输入大学名称，AI自动填充所有详细信息

#### AI大学信息生成 (AI University Generation)

管理员在创建新大学时，可以使用AI自动生成大学详细信息：

**功能特性**：
- 输入大学英文名称或中文名称
- AI自动生成完整信息：中英文名称、描述、地址、排名、网站等
- 支持SEO优化：自动生成meta_title、meta_description、meta_keywords
- 生成设施、住宿等详细信息

**使用方法**：
1. 访问 `/admin/v2/universities/new`
2. 在"AI-Powered University Generation"卡片中输入大学名称
3. 点击"AI Generate"按钮
4. 等待AI生成完成后，检查并编辑表单字段
5. 点击"Create University"保存

**API端点**：
- `POST /api/admin/universities/generate` - AI生成大学信息

**生成字段**：
- 基本信息：name_en, name_cn, short_name, website, founded_year
- 位置：province, city, address_en, address_cn
- 分类：type (985/211/Double First-Class/Provincial/Private), category
- 排名：ranking_national, ranking_international
- 描述：description_en, description_cn
- 设施：facilities_en, facilities_cn
- 住宿：accommodation_info_en, accommodation_info_cn
- 学生数据：student_count, international_student_count
- 奖学金：scholarship_available, scholarship_percentage
- SEO：meta_title, meta_description, meta_keywords
- 媒体：logo_url, cover_image_url

**页面路由**：
- `/admin/v2/universities` - 大学列表
- `/admin/v2/universities/new` - 创建大学（含AI生成）
- `/admin/v2/universities/[id]` - 大学详情
- `/admin/v2/universities/[id]/edit` - 编辑大学

### 项目管理 (Program Management)

- 项目列表、详情、创建、编辑、删除
- 管理员可管理，公众可浏览

### 会议调度系统 (Meeting Scheduling)

完整的面试/会议调度功能，支持管理员与学生之间的视频面试安排。

**功能特性**：
- 日历集成与时间选择
- 支持视频会议（Zoom/Google Meet/Teams/其他）
- 会议链接、ID、密码管理
- 会议提醒邮件（可配置提前提醒时间）
- 取消/重新安排会议

**用户角色**：
- **管理员**：创建、编辑、取消会议；发送邀请邮件
- **学生**：查看会议详情、加入会议

**API 端点**：
- `GET /api/meetings` - 学生获取自己的会议列表
- `GET /api/admin/meetings` - 管理员获取所有会议
- `POST /api/admin/meetings` - 创建会议
- `GET /api/admin/meetings/[id]` - 获取会议详情
- `PUT /api/admin/meetings/[id]` - 更新会议
- `DELETE /api/admin/meetings/[id]` - 取消会议
- `GET /api/cron/meeting-reminders` - 发送会议提醒（定时任务）

**数据表**：
- `meetings` - 会议主表
- `meeting_details` - 会议详情视图（含关联数据）

**邮件模板**：
- `meeting_scheduled` - 会议创建通知
- `meeting_reminder` - 会议提醒（24小时前）
- `meeting_cancelled` - 会议取消通知

### 实时通知系统 (Real-time Notifications)

基于 WebSocket 的实时通知推送系统，支持实时推送通知、会议提醒和状态变更。

**技术架构**：
- 自定义 Next.js 服务器 (`src/server.ts`) 支持 WebSocket 和 HTTP 共用 5000 端口
- WebSocket 端点统一使用 `/ws/*` 路径前缀
- 心跳机制 30 秒间隔，自动重连延迟 1 秒
- 消息格式统一为 `{ type: string, payload: unknown }`

**功能特性**：
- 实时连接状态显示（连接中/已连接/断开/重连中）
- 自动重连机制（断线后自动重连）
- 心跳保活（30 秒间隔）
- Toast 通知（使用 Sonner）
- 不同类型通知的差异化显示（申请/会议/文档/系统）

**用户角色**：
- **学生**：接收申请状态变更、会议提醒、文档审核结果等实时通知
- **合作伙伴**：接收新申请、会议相关等实时通知
- **管理员**：发送实时通知给用户

**WebSocket 端点**：
- `/ws/notifications` - 通知推送通道

**API 端点**：
- `POST /api/notifications/send` - 发送实时通知

**消息类型**：
- `ping` / `pong` - 心跳消息
- `notification` - 新通知推送
- `meeting_reminder` - 会议提醒
- `application_status_change` - 申请状态变更

**组件**：
- `src/lib/ws-client.ts` - WebSocket 客户端库和类型定义
- `src/ws-handlers/notifications.ts` - WebSocket 通知处理器
- `src/hooks/use-websocket.ts` - React WebSocket Hook
- `src/contexts/realtime-notifications-context.tsx` - 实时通知 Context
- `src/components/realtime-notification-toast.tsx` - Toast 通知组件
- `src/components/student-v2/student-realtime-provider.tsx` - Student 实时通知 Provider

**开发环境配置**：
- 开发环境不销毁未注册的 upgrade 请求（兼容 HMR）
- 生产环境销毁未注册的 upgrade 请求防止内存泄漏

### 文档上传系统 (Document Upload)

基于 S3 兼容对象存储的文档上传系统，支持学生上传申请文档、管理员审核文档。

**技术架构**：
- 使用 `coze-coding-dev-sdk` 的 `S3Storage` 类
- 文件存储在对象存储中，数据库存储 `file_key`
- 通过预签名 URL 提供文件访问

**功能特性**：
- 拖拽上传支持
- 文件类型和大小验证（最大 10MB）
- 文档状态管理（pending/verified/rejected）
- 预签名 URL 下载
- 文档审核和拒绝理由

**用户角色**：
- **学生**：上传、下载、删除自己的文档
- **管理员**：审核文档、标记为验证/拒绝
- **合作伙伴**：查看关联申请的文档

**API 端点**：
- `GET /api/documents` - 获取文档列表
- `POST /api/documents` - 上传文档
- `DELETE /api/documents?id=xxx` - 删除文档
- `GET /api/documents/[id]/url` - 获取预签名下载 URL
- `GET /api/admin/documents/[id]` - 获取文档详情（管理员）
- `PUT /api/admin/documents/[id]` - 更新文档状态（管理员）

**数据表**：
- `application_documents` - 申请文档表
  - `file_key` - 对象存储 key
  - `file_name` - 原始文件名
  - `file_size` - 文件大小
  - `content_type` - MIME 类型
  - `status` - 状态（pending/verified/rejected）
  - `rejection_reason` - 拒绝理由

**支持的文档类型**：
- passport - 护照
- diploma - 学位证书
- transcript - 成绩单
- language_certificate - 语言证书
- photo - 证件照
- recommendation - 推荐信
- cv - 简历
- study_plan - 学习计划
- financial_proof - 财力证明
- medical_exam - 体检报告
- police_clearance - 无犯罪记录证明
- other - 其他文档

**组件**：
- `src/components/ui/file-upload.tsx` - 文件上传组件
- `src/app/(student-v2)/student-v2/documents/page.tsx` - 文档库页面
- `src/app/(student-v2)/student-v2/applications/[id]/documents/page.tsx` - 申请文档管理页面

**前端下载最佳实践**：
```typescript
// 使用 fetch + blob 模式下载跨域文件
const response = await fetch(signedUrl);
const blob = await response.blob();
const blobUrl = window.URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = blobUrl;
link.download = fileName;
link.click();
window.URL.revokeObjectURL(blobUrl);
```

### 设置与偏好系统 (Settings & Preferences)

用户可以通过设置页面管理通知偏好、显示设置和隐私选项。

**功能特性**：
- 通知设置（邮件、推送、会议提醒、申请更新、文档更新）
- 显示设置（语言、时区、日期格式）
- 隐私设置（资料可见性、联系方式展示）
- 安全设置（修改密码、双因素认证 - 规划中）

**页面路由**：
- `/student-v2/settings` - 学生设置页面
- `/partner-v2/settings` - 合作伙伴设置页面

**API 端点**：
- `GET /api/student/settings` - 获取用户设置
- `PUT /api/student/settings` - 更新用户设置

**数据表**：
- `user_settings` - 用户设置表
  - `user_id` - 用户 ID（外键）
  - `email_notifications` - 邮件通知开关
  - `push_notifications` - 推送通知开关
  - `meeting_reminders` - 会议提醒开关
  - `application_updates` - 申请更新通知开关
  - `document_updates` - 文档更新通知开关
  - `language` - 语言偏好（en/zh）
  - `timezone` - 时区设置
  - `date_format` - 日期格式
  - `profile_visibility` - 资料可见性（public/partners_only/private）
  - `show_contact_info` - 联系方式展示开关

**支持的语言**：
- `en` - English
- `zh` - 中文

**支持的时区**：
- Asia/Shanghai, Asia/Hong_Kong, Asia/Tokyo, Asia/Seoul, Asia/Singapore
- America/New_York, America/Los_Angeles
- Europe/London, Europe/Paris
- Australia/Sydney

**资料可见性选项**：
- `public` - 公开，所有人可见
- `partners_only` - 仅合作伙伴可见
- `private` - 私有，仅管理员可见

**默认设置**：
```typescript
{
  email_notifications: true,
  push_notifications: true,
  meeting_reminders: true,
  application_updates: true,
  document_updates: true,
  language: 'en',
  timezone: 'Asia/Shanghai',
  date_format: 'MMM d, yyyy',
  profile_visibility: 'public',
  show_contact_info: false
}
```

### 管理后台 (Admin Portal)

管理员可通过管理后台全面管理平台：

**功能模块**：
- **仪表盘**：平台统计数据、最近申请、待审批合作伙伴、即将到来的会议
- **学生管理**：学生列表、详情查看、申请历史、文档管理
- **合作伙伴管理**：审批/拒绝合作伙伴申请
- **申请管理**：审核申请、更新状态、添加评论
- **大学管理**：CRUD 操作
- **项目管理**：CRUD 操作
- **会议管理**：调度、查看、管理所有会议
- **系统设置**：平台配置、邮件通知、维护模式
- **数据导出**：导出学生、申请、合作伙伴数据（CSV/JSON）

**页面路由**：
- `/admin` - 管理员仪表盘
- `/admin/students` - 学生列表
- `/admin/students/[id]` - 学生详情
- `/admin/applications` - 申请管理
- `/admin/applications/[id]` - 申请详情
- `/admin/applications/[id]/meeting` - 会议调度
- `/admin/applications/[id]/documents` - 文档审核
- `/admin/universities` - 大学管理
- `/admin/universities/new` - 创建大学
- `/admin/universities/[id]/edit` - 编辑大学
- `/admin/programs` - 项目管理
- `/admin/programs/new` - 创建项目
- `/admin/programs/[id]/edit` - 编辑项目
- `/admin/meetings` - 会议管理
- `/admin/settings` - 系统设置

**API 端点**：
- `GET /api/admin/dashboard` - 获取仪表盘统计数据
- `GET /api/admin/students` - 获取学生列表
- `GET /api/admin/students/[id]` - 获取学生详情
- `PUT /api/admin/students/[id]` - 更新学生信息
- `GET /api/admin/partners` - 获取合作伙伴列表
- `POST /api/admin/partners/[id]/approve` - 批准合作伙伴
- `POST /api/admin/partners/[id]/reject` - 拒绝合作伙伴
- `GET /api/admin/export` - 导出数据

**组件**：
- `src/components/admin/sidebar.tsx` - 管理后台侧边栏
- `src/components/admin/export-button.tsx` - 数据导出按钮

### AI 聊天助手 (AI Chat Assistant)

基于 LLM 的 AI 聊天助手，支持 SSE 流式输出，为用户解答来华留学相关问题。

**功能特性**：
- SSE 流式响应（打字机效果）
- 对话历史持久化（Supabase 存储）
- 多轮对话上下文（最近 20 条消息）
- 角色感知（学生/合作伙伴/管理员获得不同上下文）
- 建议问题快速入口
- 对话历史管理（新建、加载、删除）
- 中英文双语支持（自动匹配用户语言）

**页面路由**：
- 浮动气泡组件，集成在 Student Portal v2 和 Partner Portal v2 布局中

**API 端点**：
- `POST /api/chat` - 发送消息（SSE 流式响应）
- `GET /api/chat/sessions` - 获取用户对话列表
- `DELETE /api/chat/sessions?id=xxx` - 删除对话
- `GET /api/chat/sessions/[id]/messages` - 获取对话消息

**数据表**：
- `chat_sessions` - 对话会话表（id, user_id, title, created_at, updated_at）
- `chat_messages` - 对话消息表（id, session_id, role, content, metadata, created_at）

**组件**：
- `src/components/chat/chat-widget.tsx` - 聊天浮动组件（气泡 + 面板 + 流式渲染）

**技术架构**：
- LLM: `coze-coding-dev-sdk` (LLMClient)，模型 `doubao-seed-2-0-lite-260215`
- 流式输出: SSE 协议 (`text/event-stream` + `ReadableStream`)
- 前端渲染: `fetch` + `body.getReader()` 增量渲染
- 对话存储: Supabase `chat_sessions` + `chat_messages`

**消息格式 (SSE)**：
```json
{ "type": "session", "session_id": "uuid" }  // 会话创建
{ "type": "content", "content": "text" }       // 流式内容
{ "type": "done", "session_id": "uuid" }       // 完成信号
{ "type": "error", "error": "message" }        // 错误信号
```

## 国际化系统 (Internationalization)

项目支持中英文双语切换，使用自定义 React Context + Hooks 实现，无需依赖复杂的第三方库。

### 架构设计

**核心文件**：
- `src/i18n/config.ts` - 语言配置（支持的语言、默认语言、语言名称和标志）
- `src/i18n/context.tsx` - I18n Context 和 useI18n Hook
- `src/i18n/locales/en.json` - 英文翻译文件
- `src/i18n/locales/zh.json` - 中文翻译文件
- `src/components/language-switcher.tsx` - 语言切换组件

**支持的语言**：
- `en` - English (默认)
- `zh` - 中文

### 使用方法

#### 1. 在组件中使用翻译

```typescript
import { useI18n } from '@/i18n/context';

function MyComponent() {
  const { t, locale, setLocale } = useI18n();
  
  return (
    <div>
      <h1>{t('home.hero.title')}</h1>
      <p>{t('home.hero.subtitle')}</p>
      <button onClick={() => setLocale('zh')}>切换到中文</button>
    </div>
  );
}
```

#### 2. 带参数的翻译

在翻译文件中使用 `{paramName}` 占位符：

```json
{
  "welcome": "Welcome, {name}!"
}
```

使用时传入参数：

```typescript
t('welcome', { name: 'John' })
// 输出: "Welcome, John!"
```

#### 3. 语言切换组件

```typescript
import { LanguageSwitcher } from '@/components/language-switcher';

// 下拉菜单样式
<LanguageSwitcher />

// 内联按钮样式
<LanguageSwitcherInline />
```

### 翻译文件结构

翻译文件采用嵌套结构，支持模块化管理：

```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "nav": {
    "home": "Home",
    "universities": "Universities"
  },
  "home": {
    "hero": {
      "title": "Study in China Academy"
    }
  }
}
```

### 语言持久化

- 用户选择的语言会自动保存到 localStorage
- 页面刷新后会自动恢复用户的语言选择
- 首次访问时会尝试检测浏览器语言

### 添加新语言

1. 在 `src/i18n/config.ts` 中添加语言配置
2. 在 `src/i18n/locales/` 下创建对应的翻译文件
3. 在 `src/i18n/context.tsx` 中导入新语言的翻译

### 测试页面

访问 `/i18n-test` 页面可以查看国际化功能的演示和测试。

## 认证与授权

- 使用 Supabase Auth 进行身份验证
- 通过 `user_metadata.role` 存储角色信息（student/partner/admin）
- `AuthContext` 管理全局认证状态
- `auth-utils.ts` 提供 API 路由的认证验证函数

## 静态检查命令

```bash
# TypeScript 类型检查
pnpm ts-check

# ESLint 检查
pnpm lint

# 构建检查
pnpm build

# 单元测试
pnpm test:run

# 单元测试覆盖率
pnpm test:coverage

# E2E 测试
pnpm test:e2e
```

## 测试配置

### 单元测试 (Vitest)

项目使用 Vitest 进行单元测试，配置文件为 `vitest.config.ts`。

**测试目录结构**:
```
src/
├── lib/__tests__/           # 工具函数测试
│   ├── utils.test.ts       # cn 函数测试
│   └── ws-client.test.ts   # WebSocket 客户端测试
├── hooks/__tests__/         # 自定义 Hooks 测试
│   └── use-debounce.test.ts # useDebounce Hook 测试
└── components/ui/__tests__/ # UI 组件测试
    └── button.test.tsx     # Button 组件测试
```

**运行测试**:
- `pnpm test` - 运行测试并监听变化
- `pnpm test:run` - 运行一次测试
- `pnpm test:coverage` - 运行测试并生成覆盖率报告

### E2E 测试 (Playwright)

项目使用 Playwright 进行端到端测试，配置文件为 `playwright.config.ts`。

**测试目录结构**:
```
e2e/
└── app.spec.ts             # 应用程序 E2E 测试
```

**测试内容**:
- 首页加载和导航
- 大学列表页面
- 项目列表页面
- 响应式设计测试
- 可访问性测试

**运行测试**:
- `pnpm test:e2e` - 运行 E2E 测试
- `pnpm test:e2e:ui` - 打开 Playwright UI 运行测试

## SEO 优化系统 (SEO Optimization)

项目实现了全面的 SEO 优化，包括元数据管理、结构化数据和搜索引擎友好配置。

### SEO 架构

**核心文件**：
- `src/lib/seo-config.ts` - SEO 配置和工具函数
- `src/components/seo/json-ld.tsx` - 结构化数据组件
- `src/app/sitemap.ts` - 动态站点地图
- `src/app/robots.ts` - 爬虫配置

### 元数据配置

所有公共页面都有完整的元数据配置：

**根布局 (`src/app/layout.tsx`)**：
```typescript
export const metadata: Metadata = {
  title: { default: '...', template: '%s | SICA' },
  description: '...',
  keywords: [...],
  openGraph: { ... },
  twitter: { card: 'summary_large_image', ... },
  alternates: { canonical: '...', languages: {...} },
  robots: { index: true, follow: true, googleBot: {...} },
};
```

**动态元数据生成**：
- 大学详情页：`/universities/[id]/page.tsx`
- 项目详情页：`/programs/[id]/page.tsx`
- 博客文章页：`/blog/[slug]/page.tsx`

### 结构化数据 (JSON-LD)

支持的结构化数据类型：

**组织结构化数据**：
```tsx
import { OrganizationSchema } from '@/components/seo/json-ld';
<OrganizationSchema />
```

**网站结构化数据**：
```tsx
import { WebsiteSchema } from '@/components/seo/json-ld';
<WebsiteSchema />
```

**大学结构化数据**：
```tsx
import { UniversitySchema } from '@/components/seo/json-ld';
<UniversitySchema university={{ name_en: '...', city: '...', province: '...' }} />
```

**项目结构化数据**：
```tsx
import { ProgramSchema } from '@/components/seo/json-ld';
<ProgramSchema program={{ name: '...', degree_level: '...', university_name: '...' }} />
```

**文章结构化数据**：
```tsx
import { ArticleSchema } from '@/components/seo/json-ld';
<ArticleSchema article={{ title: '...', publishedAt: '...', author: '...' }} />
```

**面包屑结构化数据**：
```tsx
import { BreadcrumbSchema } from '@/components/seo/json-ld';
<BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }]} />
```

**FAQ 结构化数据**：
```tsx
import { FAQSchema } from '@/components/seo/json-ld';
<FAQSchema faqs={[{ question: '...', answer: '...' }]} />
```

### 站点地图

动态生成的站点地图包含：

**静态页面**：
- `/` - 首页 (priority: 1, daily)
- `/about` - 关于页面 (priority: 0.8, monthly)
- `/universities` - 大学列表 (priority: 0.9, weekly)
- `/programs` - 项目列表 (priority: 0.9, weekly)
- `/blog` - 博客列表 (priority: 0.8, daily)
- `/faq`, `/contact`, `/apply` - 其他页面

**动态页面**：
- 所有活跃的大学详情页 (priority: 0.7, monthly)
- 所有活跃的项目详情页 (priority: 0.7, monthly)
- 所有已发布的博客文章 (priority: 0.6, weekly)

**访问地址**：`/sitemap.xml`

### Robots.txt

爬虫访问控制配置：

**允许访问**：
- 所有公共页面 (`/`)

**禁止访问**：
- `/admin/` - 管理后台
- `/api/` - API 端点
- `/student/`, `/student-v2/` - 学生门户
- `/partner/`, `/partner-v2/` - 合作伙伴门户
- `/assessment/`, `/profile/` - 其他私密页面

**访问地址**：`/robots.txt`

### SEO 工具函数

`src/lib/seo-config.ts` 提供的工具函数：

```typescript
// 生成 Open Graph 元数据
generateOpenGraph({ title, description, url, images, type })

// 生成 Twitter Card 元数据
generateTwitterCard({ title, description, image })

// 生成多语言链接
generateAlternateLanguages(path)

// 生成面包屑结构化数据
generateBreadcrumbSchema(items)

// 生成大学结构化数据
generateUniversitySchema(university)

// 生成项目结构化数据
generateProgramSchema(program)

// 生成文章结构化数据
generateArticleSchema(article)

// 生成 FAQ 结构化数据
generateFAQSchema(faqs)
```

### 最佳实践

1. **每个页面都应有完整的元数据**：title、description、keywords、openGraph、twitter
2. **动态内容使用 generateMetadata**：大学、项目、博客等详情页
3. **添加结构化数据**：使用 JSON-LD 组件增强搜索结果显示
4. **设置规范链接**：使用 `alternates.canonical` 避免重复内容
5. **更新站点地图**：新增公共页面时更新 sitemap.ts
6. **测试 SEO**：使用 Google Rich Results Test 验证结构化数据
