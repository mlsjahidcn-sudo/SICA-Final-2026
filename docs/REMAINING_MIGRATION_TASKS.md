# Remaining Migration Tasks

## 已迁移页面 ✅

以下页面已成功迁移到新组件：

1. ✅ `/admin/v2/applications/new` - Application creation page
2. ✅ `/admin/v2/applications/[id]/edit` - Application edit page
3. ✅ `/partner-v2/applications/[id]/documents` - Document upload page
4. ✅ `/admin/v2/students/[id]` - Student detail page

---

## 待迁移页面列表

### 高优先级（表单页面）

#### Programs 模块
- [ ] `/admin/v2/programs/new` - 创建项目页面
- [ ] `/admin/v2/programs/[id]/edit` - 编辑项目页面

**预计代码减少**: ~90 行 (2 页面 × 45 行)

#### Universities 模块
- [ ] `/admin/v2/universities/new` - 创建大学页面
- [ ] `/admin/v2/universities/[id]/edit` - 编辑大学页面

**预计代码减少**: ~90 行 (2 页面 × 45 行)

#### Partners 模块
- [ ] `/admin/v2/partners/new` - 创建合作伙伴页面（如果存在）
- [ ] `/admin/v2/partners/[id]/edit` - 编辑合作伙伴页面（如果存在）

**预计代码减少**: ~90 行 (2 页面 × 45 行)

#### Blog 模块
- [ ] `/admin/v2/blog/new` - 创建博客文章页面
- [ ] `/admin/v2/blog/[id]/edit` - 编辑博客文章页面

**预计代码减少**: ~90 行 (2 页面 × 45 行)

#### Assessments 模块
- [ ] `/admin/v2/assessments/new` - 创建评估页面（如果存在）
- [ ] `/admin/v2/assessments/[id]/edit` - 编辑评估页面（如果存在）

**预计代码减少**: ~90 行 (2 页面 × 45 行)

---

### 中优先级（详情页面）

#### Applications 详情页
- [ ] `/admin/v2/applications/[id]` - 申请详情页面

**预计代码减少**: ~30 行

#### Partners 详情页
- [ ] `/admin/v2/partners/[id]` - 合作伙伴详情页面（如果存在）

**预计代码减少**: ~30 行

#### Programs 详情页
- [ ] `/admin/v2/programs/[id]` - 项目详情页面（如果存在）

**预计代码减少**: ~30 行

#### Universities 详情页
- [ ] `/admin/v2/universities/[id]` - 大学详情页面（如果存在）

**预计代码减少**: ~30 行

---

### 低优先级（列表页面）

#### 列表页面
- [ ] `/admin/v2/applications/page.tsx` - 申请列表页面
- [ ] `/admin/v2/students/page.tsx` - 学生列表页面
- [ ] `/admin/v2/partners/page.tsx` - 合作伙伴列表页面
- [ ] `/admin/v2/programs/page.tsx` - 项目列表页面
- [ ] `/admin/v2/universities/page.tsx` - 大学列表页面

**预计代码减少**: ~20 行/页面 (主要应用 PageContainer)

---

### Partner Portal 页面

#### Partner 详情页面
- [ ] `/partner-v2/applications/[id]` - Partner 申请详情页面

**预计代码减少**: ~30 行

#### Partner 列表页面
- [ ] `/partner-v2/applications/page.tsx` - Partner 申请列表页面

**预计代码减少**: ~20 行

---

## 迁移步骤

对于每个页面，按照以下步骤迁移：

### Step 1: 替换导入
```tsx
// 移除
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

// 添加
import { PageContainer, PageHeader, FormSection, FormGrid, FormField } from '@/components/admin'
```

### Step 2: 替换布局
```tsx
// 替换整个 TooltipProvider 结构为
<PageContainer title="Page Title">
  {/* Content */}
</PageContainer>
```

### Step 3: 替换标题区域
```tsx
// 替换自定义标题代码为
<PageHeader
  title="Page Title"
  description="Description"
  backHref="/back/path"
  actions={<Button>Action</Button>}
/>
```

### Step 4: 替换表单区域（如有）
```tsx
// 替换 Card 结构为
<FormSection title="Section Title">
  <FormGrid columns={2}>
    <FormField label="Field">
      <Input />
    </FormField>
  </FormGrid>
</FormSection>
```

### Step 5: 测试验证
- ✅ 功能是否正常
- ✅ 样式是否一致
- ✅ 响应式是否正常
- ✅ 类型检查通过

---

## 预计总代码减少量

| 类别 | 页面数量 | 平均减少/页 | 总计减少 |
|------|---------|-----------|---------|
| 高优先级（表单页面） | ~10 页 | 45 行 | ~450 行 |
| 中优先级（详情页面） | ~4 页 | 30 行 | ~120 行 |
| 低优先级（列表页面） | ~5 页 | 20 行 | ~100 行 |
| **总计** | **~19 页** | - | **~670 行** |

---

## 优先级说明

### 高优先级 - 表单页面
- **原因**: 表单页面代码重复最多，使用 `FormSection`、`FormGrid`、`FormField` 组件效果最显著
- **预计时间**: 每个页面 30-60 分钟
- **建议顺序**: Programs → Universities → Partners → Blog → Assessments

### 中优先级 - 详情页面
- **原因**: 详情页面有重复的标题和卡片结构，但代码重复度相对较低
- **预计时间**: 每个页面 15-30 分钟
- **建议顺序**: Applications → Partners → Programs → Universities

### 低优先级 - 列表页面
- **原因**: 列表页面主要减少 `PageContainer` 相关代码，效果较小
- **预计时间**: 每个页面 10-15 分钟
- **建议顺序**: 任意

---

## 迁移检查清单

每个页面迁移完成后，请检查：

- [ ] 所有导入已更新
- [ ] 布局结构已替换为 `PageContainer`
- [ ] 页面标题已替换为 `PageHeader`
- [ ] 表单分组已替换为 `FormSection`
- [ ] 表单网格已替换为 `FormGrid`
- [ ] 表单字段已替换为 `FormField`
- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过
- [ ] 功能测试通过
- [ ] 视觉回归测试通过

---

## 迁移进度追踪

### Week 1 (已完成)
- ✅ 创建可复用组件
- ✅ 迁移 Applications 创建/编辑页面
- ✅ 迁移 Documents 上传页面
- ✅ 迁移 Students 详情页面
- ✅ 编写迁移文档

### Week 2 (计划中)
- [ ] 迁移 Programs 创建/编辑页面
- [ ] 迁移 Universities 创建/编辑页面
- [ ] 迁移 Partners 创建/编辑页面

### Week 3 (计划中)
- [ ] 迁移 Blog 创建/编辑页面
- [ ] 迁移 Assessments 创建/编辑页面
- [ ] 迁移详情页面

### Week 4 (计划中)
- [ ] 迁移列表页面
- [ ] 迁移 Partner Portal 页面
- [ ] 全面测试和文档更新

---

## 注意事项

1. **保持功能一致**: 迁移过程中不要改变任何业务逻辑
2. **保留样式**: 确保迁移后视觉效果完全一致
3. **测试充分**: 每个页面迁移后都要进行完整的功能测试
4. **渐进迁移**: 不要一次性迁移所有页面，逐步进行
5. **文档更新**: 迁移完成后更新相关文档

---

## 相关文档

- [组件迁移指南](./COMPONENT_MIGRATION_GUIDE.md)
- [组件优化总结](./COMPONENT_OPTIMIZATION_SUMMARY.md)
- [组件源码](../src/components/admin/)

---

## 问题反馈

在迁移过程中遇到任何问题，请记录：

1. **问题描述**: 具体什么功能或样式出现问题
2. **页面路径**: 哪个页面出现问题
3. **预期行为**: 应该是什么样的
4. **实际行为**: 实际是什么样的
5. **截图**: 如有需要，附上截图

---

## 更新日志

### 2026-04-13
- ✅ 创建迁移任务列表
- ✅ 完成 4 个页面的迁移
- ✅ 编写完整文档
