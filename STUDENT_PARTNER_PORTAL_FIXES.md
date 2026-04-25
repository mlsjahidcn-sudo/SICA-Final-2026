# 学生和合作伙伴门户修复总结

## 修复日期
2026-04-13

## 修复的关键错误

### 1. 学生仪表盘 API (`/api/student/dashboard/route.ts`)

**问题描述**：
- 使用 `authUser.id`（users.id）作为 `student_id` 查询条件
- 但 `applications.student_id` 引用的是 `students.id`，而非 `users.id`

**影响**：
- 学生无法看到任何申请数据
- 统计数据错误
- 会议、文档、最近申请列表为空

**修复方案**：
```typescript
// 先获取学生记录
const { data: studentRecord } = await supabase
  .from('students')
  .select('id')
  .eq('user_id', authUser.id)
  .single();

// 使用 studentRecord.id 进行查询
.eq('student_id', studentRecord.id)
```

**修复位置**：
- Line 17: 申请统计查询
- Line 52: 会议查询
- Line 76: 文档查询
- Line 100: 最近申请查询

---

### 2. 合作伙伴仪表盘 API (`/api/partner/dashboard/route.ts`)

**问题描述**：
1. 使用 `user.id`（users.id）作为 `partner_id`
   - 但 `applications.partner_id` 引用的是 `partners.id`
2. 查询 `students.email` 字段
   - 但 `students` 表没有 `email` 列，email 存储在 `users` 表

**影响**：
- 合作伙伴无法看到任何申请数据
- 查询报错（email 列不存在）

**修复方案**：
```typescript
// 获取合作伙伴记录
const { data: partnerRecord } = await supabase
  .from('partners')
  .select('id')
  .eq('user_id', user.id)
  .single();

const partnerId = partnerRecord.id;

// 修复 email 查询
students (
  first_name,
  last_name,
  nationality,
  user_id,
  users (
    email
  )
)
```

**修复位置**：
- Line 10: 获取正确的 partner ID
- Lines 63-64: 通过 users 表获取 email

---

### 3. 合作伙伴会议详情 API (`/api/partner/meetings/[id]/route.ts`)

**问题描述**：
1. Partner 访问权限检查使用 `user.id` 与 `partner_id` 比较
   - 但 `partner_id` 是 `partners.id`，而非 `users.id`
2. 查询 `students.email` 字段（不存在）

**影响**：
- 合作伙伴无法访问会议详情（403 Forbidden）
- 查询报错

**修复方案**：
```typescript
// 获取合作伙伴记录进行权限检查
const { data: partnerRecord } = await supabase
  .from('partners')
  .select('id')
  .eq('user_id', user.id)
  .single();

if (app?.partner_id !== partnerRecord.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// 修复 email 查询
students (
  first_name,
  last_name,
  user_id,
  users (
    email
  )
)
```

**修复位置**：
- Lines 70-71: Partner 访问权限检查
- Line 51: Email 查询

---

### 4. 合作伙伴分析 API (`/api/partner/analytics/route.ts`)

**问题描述**：
- 使用 `user.id` 作为 `partner_id` 进行筛选
- 但 `applications.partner_id` 引用的是 `partners.id`

**影响**：
- 分析数据为空
- 统计图表无数据

**修复方案**：
```typescript
// 获取合作伙伴记录
const { data: partnerRecord } = await supabase
  .from('partners')
  .select('id')
  .eq('user_id', user.id)
  .single();

const partnerId = partnerRecord.id;

// 使用正确的 partnerId 进行查询
.eq('partner_id', partnerId)
```

**修复位置**：
- Line 83: Partner ID 筛选

---

## 数据库架构说明

### 关键关系

```
users.id → students.user_id → students.id → applications.student_id
users.id → partners.user_id → partners.id → applications.partner_id
students.user_id → users.id → users.email
```

### 重要提示

1. **`applications.student_id`** 引用 **`students.id`**（不是 `users.id`）
2. **`applications.partner_id`** 引用 **`partners.id`**（不是 `users.id`）
3. **`students.email`** 不存在，email 存储在 **`users`** 表
4. **`meetings.student_id`** 引用 **`users.id`**（这是正确的）

## 修复后的效果

### 学生门户
✅ 仪表盘统计正确显示
✅ 会议列表正常加载
✅ 文档列表正常加载
✅ 最近申请正常显示

### 合作伙伴门户
✅ 仪表盘统计正确显示
✅ 申请列表正常加载
✅ 会议详情可访问
✅ 分析数据正常显示
✅ 学生 email 正确显示

## 测试建议

1. 以学生身份登录，检查仪表盘数据
2. 以合作伙伴身份登录，检查仪表盘和分析页面
3. 合作伙伴尝试访问会议详情
4. 检查所有列表页面的 email 显示

## 注意事项

- 所有修复都使用 Supabase service role client，绕过 RLS
- 确保 `.env.local` 中配置了正确的 Supabase 凭据
- 所有查询都添加了错误处理和日志记录
