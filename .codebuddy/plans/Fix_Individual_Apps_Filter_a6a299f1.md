---
name: Fix Individual Apps Filter
overview: Fix individual-applications API filter to use applications.partner_id IS NULL instead of users.referred_by_partner_id IS NULL.
todos:
  - id: fix-individual-apps-filter
    content: 修复 individual-applications API，直接筛选 applications.partner_id IS NULL
    status: completed
  - id: verify-typescript-compile
    content: 验证 TypeScript 编译
    status: completed
    dependencies:
      - fix-individual-apps-filter
---

## 问题描述

Individual Applications 列表页面只显示5个申请，但数据库中有11个申请（partner_id IS NULL）。

## 问题根因

`src/app/api/admin/individual-applications/route.ts` 第169-201行的API错误地通过 `users.referred_by_partner_id IS NULL` 来筛选个人申请，但实际上应该通过 `applications.partner_id IS NULL` 来筛选。

部分学生账号虽然被合作伙伴邀请注册（referred_by_partner_id有值），但他们自己提交的申请（applications.partner_id为空）也应该显示在Individual Applications列表中。

## 修复方案

1. 直接筛选 `applications.partner_id IS NULL` 而非通过 users 表间接筛选
2. 简化查询逻辑，直接使用 `eq('partner_id', null)` 筛选申请
3. 确保所有11个个人申请都能正确显示

## 技术方案

### 修改文件

`src/app/api/admin/individual-applications/route.ts`

### 修复步骤

1. 移除获取 individualUserIds 和 individualStudentIds 的复杂逻辑（第169-191行）
2. 改为直接在 applications 表上筛选 `partner_id IS NULL`
3. 调整查询逻辑为：

```typescript
let query = supabaseAdmin
.from('applications')
.select(...)
.is('partner_id', null)  // 直接筛选 partner_id 为 NULL
.order('created_at', { ascending: false });
```

4. 同样调整统计查询

### 数据模型理解

- `applications.partner_id`: 申请是否由合作伙伴创建（NULL = 学生自己创建）
- `users.referred_by_partner_id`: 用户是否被合作伙伴邀请注册（不影响申请来源）