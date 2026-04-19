---
name: enhance-individual-modules
overview: 修复 admin/v2/individual-students 和 admin/v2/individual-applications 模块的关键 Bug（参数名不匹配、过滤逻辑错误、字段缺失等）并增强功能（错误处理、单条查询、UI 完善）
---

<plan_result>
<req>

## Product Overview

检查并修复 Admin Portal 中的 Individual Students 和 Individual Applications 模块，发现并修复所有问题。

## Core Issues Found (12 Issues)

### CRITICAL Bugs

1. **University 参数不匹配**: 前端发送 `university`，后端读取 `university_id`，大学筛选完全无效
2. **Individual Students 国籍过滤破坏分页**: 国籍过滤在内存分页之后执行，分页数字和显示数量不一致
3. **Individual Applications Search 破坏分页**: 内存搜索在 Supabase range() 之后执行，统计数字与结果不匹配

### Medium Issues  

4. **缺少 country/city 字段**: IndividualStudent 类型/API 未包含 users 表的 country, city 字段（partner-students 已修复）
5. **缺少单条记录查询 (?id=)**: individual-applications API 无详情页专用查询模式
6. **前端错误处理缺失**: 两个页面都静默吞掉 API 错误，无用户反馈
7. **缺少 University Filter UI**: individual-applications 有 university 状态变量但无下拉选择器

### Low Enhancements

8. **IndividualStudents 缺少 ?id= 单条查询**
9. **性能优化**: 全量拉取后手动分页，应使用数据库级分页
10. **统计数字应反映当前过滤器状态**
</req>
<tech>

## Tech Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase (PostgreSQL) - service role key for admin queries
- shadcn/ui components (Card, Table, Select, Badge)
- Lucide icons

## Implementation Approach

### Strategy Overview

参照 partner-students/partner-applications 已修复的模式，对 individual-students/individual-applications 做对称修复。核心思路：

1. API 层：修复参数名、添加 ?id= 单条查询、修复字段引用、将过滤前置到分页前
2. 前端层：修复参数传递、添加错误处理和调试日志、补全 Filter UI
3. 类型层：补充缺失字段

### Key Technical Decisions

- **country/city 来源**: users 表（非 students 表），与 partner-students 保持一致
- **过滤顺序**: 所有过滤必须在分页之前执行（先过滤再 slice）
- **参数命名**: 统一为 `university_id`（后端标准），前端发送对应名称
- **错误处理模式**: 复用 partner-students 详情页已建立的 error state + console.log 调试模式

## Directory Structure

```
src/app/api/admin/individual-students/route.ts    # [MODIFY] 添加 ?id= + country/city + nationality前置过滤
src/app/api/admin/individual-applications/route.ts  # [MODIFY] 修复university参数 + 添加?id= + search处理
src/lib/types/admin-modules.ts                     # [MODIFY] IndividualStudent 补充 country/city
src/app/admin/(admin-v2)/v2/individual-students/page.tsx      # [MODIFY] 错误处理 + 动态统计显示
src/app/admin/(admin-v2)/v2/individual-applications/page.tsx   # [MODIFY] 修复参数名 + 错误处理 + University Filter UI
```

## Implementation Notes

- **Grounded**: 复用 partner-students 已验证的查询模式和返回格式
- **Performance**: individual-students 当前全量拉取+内存分页可接受（数据量小），暂不改为 DB 分页以避免大改动
- **Blast radius**: 仅修改 5 个文件，不影响其他模块。partner-students 的修改不受影响
- **Backward compatible**: 新增 ?id= 参数不影响现有列表功能；university_id 参数名对齐后端
</tech>
<design framework="React" component="shadcn">
<description>
两个管理后台列表页面的修复增强，保持现有设计风格一致。主要改进：修复功能性 Bug（参数名、过滤逻辑、字段缺失）、添加错误状态展示、补全缺失的 University 下拉筛选项。
</description>
<style_keywords>
<keyword>Admin Dashboard</keyword>
<keyword>Clean Data Tables</keyword>
<keyword>Consistent Filters</keyword>
</style_keywords>
<font_system fontFamily="Inter, system-ui">
<heading size="20px" weight="600"></heading>
<subheading size="14px" weight="500"></subheading>
<body size="14px" weight="400"></body>
</font_system>
<color_system>
<primary_colors>
<color>#2563EB</color>
<color>#3B82F6</color>
</primary_colors>
<background_colors>
<color>#F8FAFC</color>
<color>#FFFFFF</color>
</background_colors>
<text_colors>
<color>#0F172A</color>
<color>#475569</color>
</text_colors>
<functional_colors>
<color>#EF4444</color>
<color>#22C55E</color>
<color">#F59E0B</color>
</functional_colors>
</color_system>
</design>
<todolist>
<item id="fix-individual-students-api" deps="">修复 individual-students API: 添加 ?id= 单条查询、country/city 字段、nationality 过滤移到分页前、正确计算 filteredTotal</item>
<item id="fix-individual-apps-api" deps="">修复 individual-applications API: 修复 university 参数名为 university_id、添加 ?id= 单条查询、search 后重算分页</item>
<item id="fix-types" deps="">修正 admin-modules.ts: IndividualStudent 接口补充 country 和 city 字段</item>
<item id="fix-individual-students-page" deps="fix-individual-students-api">修复 individual-students 页面: 添加 error state、动态统计显示、改善错误反馈</item>
<item id="fix-individual-apps-page" deps="fix-individual-apps-api">修复 individual-applications 页面: 修正 university->university_id 参数传递、添加 error state、补全 University 下拉 Filter UI</item>
<item id="verify-all" deps="fix-individual-students-api,fix-individual-apps-api,fix-types,fix-individual-students-page,fix-individual-apps-page">最终 lint 验证所有 5 个文件零错误</item>
</todolist>
</plan_result>