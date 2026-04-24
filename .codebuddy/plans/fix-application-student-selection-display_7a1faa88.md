---
name: fix-application-student-selection-display
overview: 修复添加申请时学生选择页面显示"Unnamed Student"和"No email"的问题。根本原因是API返回扁平数据结构（id, email, full_name直接在顶层），但前端期望嵌套结构（student.users?.full_name, student.users?.email）。需要修复3个文件中的接口和显示逻辑。
todos:
  - id: fix-new-application-page
    content: 修复 applications/new/page.tsx 的 StudentInfo 接口定义和所有 student.users.* 数据引用路径
    status: completed
  - id: fix-applications-page
    content: 修复 applications/page.tsx 的 StudentInfo 接口和 New Application 弹窗中的学生选择器数据路径
    status: completed
  - id: verify-build
    content: 运行 tsc --noEmit 编译检查确认无类型错误
    status: completed
    dependencies:
      - fix-new-application-page
      - fix-applications-page
---

## Product Overview

修复合作伙伴添加申请时学生选择页面显示"Unnamed Student"和"No email"的问题，并全面检查申请流程中所有相关页面的数据结构匹配问题。

## Core Features

- **问题根因**：数据结构不匹配。API `/api/partner/students` 返回扁平结构（直接从 `users` 表查询），字段为 `full_name`、`email` 等顶层字段；但前端 `StudentInfo` 接口定义了嵌套结构（期望从 `students` 表关联 `users` 子对象），通过 `student.users?.full_name` 和 `student.users?.email` 访问数据，这些路径全部为 undefined。

- **受影响文件1：`applications/new/page.tsx`**
- 第33-45行：`StudentInfo` 接口错误地定义嵌套的 `users` 子对象
- 第79-84行：搜索过滤使用错误的 `student.users?.full_name` / `student.users?.email` 路径
- 第176/181/184行：学生卡片显示名称和邮箱使用错误路径
- 第230/235/238行：确认对话框同样使用错误路径

- **受影响文件2：`applications/page.tsx`**
- 第53-96行：内部 `StudentInfo` 接口同样的嵌套结构问题
- 第471-496行："New Application"弹窗中的学生选择器对话框使用 `student.users?.full_name` 和 `student.users?.email`

- **不受影响的文件**：
- 申请列表本身调用的是 `/api/applications`，该API正确返回嵌套的 `students → users` 结构，所以列表显示正常
- 申请向导页面（apply/page.tsx）调用的是 `/api/partner/students/[id]` 单个详情接口，也正确返回扁平字段

## Tech Stack

- Next.js App Router (TypeScript)
- Supabase (PostgreSQL)
- shadcn/ui 组件库

## Implementation Approach

### 策略：修改前端接口定义以匹配实际API返回结构

**核心原则**：API返回的是扁平结构，前端应该直接使用顶层字段而非通过嵌套路径访问。

### 修改方案

#### 1. `applications/new/page.tsx` 修改

- 重写 `StudentInfo` 接口，移除嵌套 `users` 对象，改用扁平字段：

```typescript
interface StudentInfo {
id: string;
user_id: string;
full_name?: string | null;
email?: string | null;
phone?: string | null;
nationality?: string | null;
}
```

- 搜索过滤器：`student.users?.full_name` → `student.full_name`，`student.users?.email` → `student.email`
- 学生卡片显示：同上替换所有引用
- 确认对话框：同上替换
- 头像字母：`student.users?.full_name` → `student.full_name`

#### 2. `applications/page.tsx` 修改  

- 内部 `StudentInfo` 接口同样重写为扁平结构
- 学生选择器对话框中所有 `student.users?.*` 引用改为直接字段访问
- 搜索过滤中 `a.students?.users` 改为正确的路径（注意：此处 `students` 来自 `/api/applications` 是嵌套结构，需保留原有逻辑不变）

### 关键区分

| 数据来源 | 结构 | 访问方式 |
| --- | --- | --- |
| `/api/partner/students` (学生列表) | 扁平 `{ id, email, full_name, ... }` | 直接 `student.email` |
| `/api/applications` (申请列表) | 嵌套 `{ students: { users: { email } } }` | 保持 `app.students?.users?.email` |


## Implementation Notes

- 不修改任何后端API代码，仅修正前端接口定义和数据访问路径
- `applications/page.tsx` 中有两处学生信息使用场景：(a) 列表中的学生名来自 `/api/applications` 嵌套结构 — 不改；(b) 弹窗学生选择器来自 `/api/partner/students` 扁平结构 — 需要改。需要为弹窗单独定义一个 `PickerStudentInfo` 类型或复用修改后的类型。
- 修改后需要运行 `tsc --noEmit` 确认无类型错误

## Directory Structure

```
src/app/(partner-v2)/partner-v2/
├── applications/
│   ├── new/page.tsx          # [MODIFY] 修复 StudentInfo 接口 + 所有数据访问路径
│   └── page.tsx              # [MODIFY] 修复 StudentInfo 接口 + 弹窗学生选择器数据路径
└── students/
    └── [id]/apply/page.tsx   # [NO CHANGE] 已正确使用扁平字段
```