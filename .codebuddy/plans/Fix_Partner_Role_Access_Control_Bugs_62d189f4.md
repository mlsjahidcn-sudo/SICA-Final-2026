---
name: Fix Partner Role Access Control Bugs
overview: 修复 Partner 模块中角色访问控制的两个 Bug：1) Applications 和 Students API 数据过滤不一致；2) Profile 页面错误使用 authUser 判断管理员角色
todos:
  - id: fix-profile-role-check
    content: 修复 Profile 页面的 Role 判断逻辑，使用 usePartner() 上下文
    status: completed
  - id: fix-applications-api-filter
    content: 统一 Applications API 的过滤逻辑，移除 Admin 额外的 partner_id 过滤
    status: completed
    dependencies:
      - fix-profile-role-check
  - id: verify-data-consistency
    content: 验证修复后的数据一致性
    status: completed
    dependencies:
      - fix-applications-api-filter
---

## 需求概述

修复 Partner 团队成员权限流程中的 Bug，确保：

- Partner 团队成员只能看到自己提交的申请
- Partner Admin 可以看到所有学生
- 保持数据一致性

## 已识别的问题

### Bug 1: Applications 和 Students API 数据不一致

- **位置**: `/src/app/api/applications/route.ts` (第 155-161 行) 和 `/src/app/api/partner/students/route.ts`
- **问题**: Applications API (Admin) 使用额外的 `partner_id` 过滤条件，但 Students API 没有
- **影响**: Admin 在 Applications 列表中看到的申请，对应的学生可能不出现在 Students 列表中

### Bug 2: Profile 页面 Role 判断错误

- **位置**: `/src/app/(partner-v2)/partner-v2/profile/page.tsx` (第 56 行)
- **问题**: 使用 `authUser` 判断角色，但 `authUser` 可能没有 `partner_role` 字段
- **影响**: 普通 Member 可能被错误判断为 Admin，显示不应该看到的管理功能

### Bug 3: 过滤逻辑不统一

- **位置**: Applications API 和 Students API
- **问题**: 两个 API 使用不同的过滤逻辑（一个用 `partner_id`，一个用 `referred_by_partner_id`）
- **影响**: 数据展示不一致

## 技术方案

### 修改文件

1. `/src/app/api/applications/route.ts` - 移除 Admin 的 `partner_id` 额外过滤，统一使用 `referred_by_partner_id` 逻辑
2. `/src/app/api/partner/students/route.ts` - 保持现有逻辑（已是正确实现）
3. `/src/app/(partner-v2)/partner-v2/profile/page.tsx` - 使用 `usePartner()` 上下文判断角色

### 实现策略

1. **统一过滤逻辑**: Applications API 应该只通过 `referred_by_partner_id` 过滤，与 Students API 保持一致
2. **修复 Role 判断**: Profile 页面导入 `usePartner` 并使用其 `isPartnerAdmin` 值
3. **保持向后兼容**: 不改变现有数据库结构，只修复查询逻辑

### 关键代码变更

#### Bug 2 修复 (Profile 页面)

```typescript
// 旧代码 (错误)
const isPartnerAdmin = !(authUser as unknown as Record<string, unknown>)?.partner_role || ...

// 新代码 (正确)
import { usePartner } from '@/contexts/partner-context';
const { isPartnerAdmin } = usePartner();
```

#### Bug 1 修复 (Applications API)

移除 Admin 的 `partner_id` 额外过滤条件，保持只通过 `referred_by_partner_id` 过滤