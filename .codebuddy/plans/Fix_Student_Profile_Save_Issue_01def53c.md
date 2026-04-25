---
name: Fix Student Profile Save Issue
overview: 修复学生Profile无法保存的问题 - API尝试写入不存在的profile_completion列。移除无效的数据库写入操作，保持运行时计算方式。
todos:
  - id: remove-invalid-column-update
    content: Remove profile_completion database update from PUT API
    status: completed
---

## 问题分析

用户报告学生门户 Profile 无法保存。经过调查发现：

### 根本原因

API 尝试写入数据库中不存在的 `profile_completion` 列。

### 验证结果

- `curl` 查询确认: `column students.profile_completion does not exist`
- `students` 表和 `users` 表都没有此列
- Profile completion 通过 `calculateProfileCompletion()` 函数在运行时计算，无需持久化

## 解决方案

移除 PUT API 中无效的 `profile_completion` 数据库更新操作。

## 修复文件

`src/app/api/student/profile/route.ts` 第281-301行

## 修改内容

删除以下代码块：

```typescript
// ── Step 3: Update profile_completion ──
const { data: refreshedUser } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

const { data: refreshedStudent } = await supabase
  .from('students')
  .select('*')
  .eq('user_id', userId)
  .single();

const completion = calculateProfileCompletion(refreshedUser, refreshedStudent);

await supabase
  .from('students')
  .update({ profile_completion: completion })  // ❌ 列不存在
  .eq('user_id', userId);

console.log('PUT profile - profile completion updated:', completion + '%');
```

## 原因

1. `students` 表没有 `profile_completion` 列
2. Profile completion 已在 GET 请求时通过 `calculateProfileCompletion()` 动态计算
3. 无需持久化此计算值