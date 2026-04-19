---
name: fix-university-search
overview: 修复 Add Application 页面中按大学搜索功能不工作的问题，涉及 API 缓存 key 和前端闭包陷阱两个 bug
todos:
  - id: fix-cache-key
    content: 修复 route.ts 缓存键：将 university_search 参数加入 cacheKey 计算
    status: completed
  - id: refactor-fetcher
    content: 重构 index.tsx 的 fetchPrograms：接受 mode 显式参数，移除闭包依赖 searchMode
    status: completed
  - id: update-callback
    content: 更新 selection-step.tsx 回调调用：onSearchPrograms(query, searchMode)
    status: completed
    dependencies:
      - refactor-fetcher
  - id: verify-build
    content: 运行 tsc --noEmit 编译检查确认无类型错误
    status: completed
    dependencies:
      - fix-cache-key
      - refactor-fetcher
      - update-callback
---

## Product Overview

修复 Add Application（Application Wizard）页面中按大学名称搜索（search by university）不生效的问题。当前只有按程序搜索能正常工作。

## Core Features

- 修复 **Bug 1: Cache Key 缺少 `university_search` 参数** — `route.ts:75` 的 cacheKey 未包含 `university_search`，导致切换到 university 模式后仍命中首次加载的全量缓存数据
- 修复 **Bug 2: fetchPrograms 闭包依赖问题** — `index.tsx` 的 `fetchPrograms` useCallback 通过闭包读取 `searchMode`，但 selection-step 的 debounce useEffect 持有的是旧引用，切换模式后可能仍发送错误参数
- 修复 **Bug 3: 空搜索时未传递 searchMode 信息** — 切换模式时调用 `onSearchPrograms('')` 但 `fetchPrograms('')` 中因 `if (search)` 为 false 不发送任何参数，API 无法区分是 program 还是 university 模式的初始加载

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Supabase (PostgreSQL) as database backend
- shadcn/ui components

## Implementation Approach

### Bug 1 Fix: Cache Key (route.ts:75)

在 cacheKey 字符串中加入 `${university_search || 'none'}` 参数，确保不同搜索模式产生不同的缓存键：

```
programs:${page}:${limit}:${university_id}:${search}:${university_search}:${degree_level}:...
```

### Bug 2+3 Fix: Refactor fetchPrograms (index.tsx)

将 `searchMode` 作为显式参数传入 `fetchPrograms`，避免闭包依赖问题：

```typescript
// 改变函数签名：接收 mode 参数
const fetchPrograms = useCallback(async (search: string, mode?: 'program' | 'university') => {
    // ...
    if (mode === 'university' && search) {
        params.set('university_search', search);
    } else if (search) {
        params.set('search', search);
    }
}, [formData.selectedDegree]); // 移除 searchMode 依赖
```

同时在 SelectionStep 调用时传入当前 searchMode：

```
onSearchPrograms={(query) => fetchPrograms(query, searchMode)}
```

这样即使切换模式后 debounce 触发旧引用，传入的 mode 值始终是最新的（因为 SelectionStep 内部 state 已更新）。

## Implementation Notes

- Cache key 修改位置：`/src/app/api/programs/route.ts` 第 75 行，插入 `${university_search || 'none'}`
- fetchPrograms 重构位置：`/src/app/(partner-v2)/partner-v2/students/components/application-wizard/index.tsx` 第 95-126 行
- SelectionStep prop 类型不变，只需修改调用处传参方式
- 需要运行 `tsc --noEmit` 验证编译通过
- 3 个文件修改，无新增文件

## Architecture Design

```
SelectionStep (searchQuery, searchMode)
    ↓ onSearchPrograms(query, searchMode)
ApplicationWizard.fetchPrograms(search, mode='program'|'university')
    ↓ API request
/api/programs?degree_level=...&university_search=...  OR  /api/programs?degree_level=...&search=...
    ↓ Cache key includes university_search parameter → correct cache hit/miss
Supabase Query → universities table lookup → programs filter by university_ids
```

## Directory Structure

```
project-root/
├── src/app/api/programs/route.ts                          # [MODIFY] Fix cacheKey + university_search logic
└── src/app/(partner-v2)/partner-v2/students/
    └── components/application-wizard/
        ├── index.tsx                                      # [MODIFY] Refactor fetchPrograms to accept mode param
        └── selection-step.tsx                             # [MODIFY] Pass searchMode to onSearchPrograms callback
```