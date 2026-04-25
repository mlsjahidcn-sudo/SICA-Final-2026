---
name: Fix Individual Application Detail 404 Error
overview: The /api/admin/individual-applications?id=xxx returns 404 even though the application exists in the database. The issue is likely a Supabase client or RLS problem where the service role key is not properly used for the detailed query.
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Maintenance
    - Bug Fix
todos:
  - id: fix-api-get-endpoint
    content: 添加 GET 处理程序到 /api/admin/individual-applications/[id]/route.ts，使用逐步获取以避免 PostgREST 联接问题
    status: completed
  - id: fix-detail-page
    content: 更新应用详情页以使用 GET /api/admin/individual-applications/[id]，而不是 ?id= 查询参数
    status: completed
    dependencies:
      - fix-api-get-endpoint
  - id: fix-id-param-route
    content: 将 /api/admin/individual-applications/route.ts 中的 ?id= 处理程序替换为 307 重定向，以实现向后兼容
    status: completed
    dependencies:
      - fix-api-get-endpoint
  - id: test-detail-page
    content: 使用 agent-browser 测试修复后的应用详情页
    status: completed
    dependencies:
      - fix-detail-page
---

``## 概述` `Admin 应用详情页在加载单个应用时显示 "Application Not Found"。根本原因是 `/api/admin/individual-applications?id=xxx` API 返回 `404`，尽管数据库中存在该记录。`## 核心功能` `- 修复应用详情页，使其正确加载应用数据` `- 确保 Individual Applications API 的单条记录查找正常工作` `- 确保 Individual 和 Partner 应用数据隔离正确` `

``## 技术栈` `- Next.js App Router + TypeScript` `- Supabase (PostgreSQL + PostgREST)` `- React 客户端组件`

`## 根本原因分析` `应用详情页流程如下：` `1. 前端调用 GET `/api/admin/applications/[id]` -> 返回 `200`（基本类型检查） ``2. 前端调用 GET `/api/admin/individual-applications?id=xxx` -> 返回 `404`（详细信息加载）`

`通过 `curl` + `service role key` 验证：第一个 API 正常工作，第二个返回 `404`。两个 API 都使用 `getSupabaseClient()`（服务角色密钥，绕过 RLS）。数据库直接 SQL 确认数据存在且联接关系有效。`

`可能的根本原因：` `1. Supabase 客户端单例初始化时序问题 - 单例可能过早初始化` `2. 复杂的 PostgREST 联接查询失败 - 嵌套联接 `applications -> students -> users` 和 `applications -> programs -> universities` 可能会触发 PostgREST 错误，该错误被作为 "not found" 处理 ``3. 调试日志显示查询执行但返回 null/error`

`## 实现方法`

`### 策略：添加专用 GET 路由处理单个应用详情`

`不使用 `route.ts` 中带有复杂联接的 `?id=` 参数，而是： ``1. 为 `/api/admin/individual-applications/[id]` 添加 `GET` 处理程序（当前仅存在 `PUT`） ``2. 使用逐步获取方法：首先获取基本应用数据，然后分别获取学生和程序数据` `3. 这避免了复杂的 PostgREST 联接失败` `4. 同时重构 `applications/[id]/page.tsx`，使其使用专用的 `[id]` 端点，而不是查询参数方法`

`### 关键技术决策` `- **逐步获取与联接**：使用逐步获取而不是嵌套的 PostgREST 联接。这更加稳健，因为简单的 `.single()` 查询始终有效（如 `applications/[id]/route.ts` 和 `individual-applications/[id]/status/route.ts` 所证明的那样）。 ``- **单个 GET 端点**：添加专用的 `GET` 处理程序，而不是使用 `?id=` 参数。这符合 REST 约定，并避免了复杂的路由参数解析。 ``- **服务角色密钥**：继续使用 `getSupabaseClient()`（无 token），因为它正确地绕过 RLS。 ``- **向后兼容性**：保留 `?id=` 参数以供其他潜在消费者使用，但优先使用 `GET /api/admin/individual-applications/[id]`。`

`## 实现说明` `- `getSupabaseClient()` 返回单例服务角色客户端。复杂联接在 Supabase 中失败时返回空数据而不是错误，导致 `.single()` 失败并返回 null。 ``- 逐步获取模式（先获取基本应用，再获取关联数据）更可靠，并允许更好的错误消息传递。` `- 更新应用详情页以使用新的 `GET /api/admin/individual-applications/[id]` 端点，简化 API 调用流程。`

`## 架构设计`

`### 修复后的 API 流程` ````mermaid` `sequenceDiagram`     `participant Page as 应用详情页`     `participant API1 as GET /api/admin/applications/[id]`     `participant API2 as GET /api/admin/individual-applications/[id]`     `participant DB as Supabase`

`Page->>API1: 获取基本应用信息`     `API1->>DB: select id, partner_id, status`     `DB-->>API1: {isIndividual: true}`     `API1-->>Page: 200 OK`

`Page->>API2: 获取完整详情`     `API2->>DB: select * from applications (simple)`     `DB-->>API2: {id, status, ...}`     `API2->>DB: select * from students where id=...`     `DB-->>API2: {user_id, nationality, ...}`     `API2->>DB: select * from users where id=...`     `DB-->>API2: {full_name, email, ...}`     `API2->>DB: select * from programs where id=...`     `DB-->>API2: {name, degree_level, ...}`     `API2->>DB: select * from universities where id=...`     `DB-->>API2: {name_en, city, ...}`     `API2-->>Page: 200 OK (完整应用数据)` ```` `

`无需 UI 更改。修复是 API 端和前端数据获取逻辑中的纯后端修复。`

# Agent Extensions

``## 智能代理扩展` `### 智能代理` `- **智能代理浏览器**`   `- 用途：登录后测试修复后的应用详情页`   `- 预期结果：应用详情页正确显示应用数据，不再显示 "Application Not Found"` `