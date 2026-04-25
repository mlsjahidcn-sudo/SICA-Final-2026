---
name: Update Homepage Success Section with Dynamic Cards
overview: Replace the hardcoded success section on homepage with dynamic cards matching the success-cases page design, fetching featured success cases from the API
todos:
  - id: add-success-cases-state
    content: Add state management for success cases in HomePageContent
    status: completed
  - id: fetch-success-cases
    content: Fetch featured success cases from API on mount
    status: completed
    dependencies:
      - add-success-cases-state
  - id: update-card-design
    content: Replace hardcoded cards with dynamic cards matching success-cases page design
    status: completed
    dependencies:
      - fetch-success-cases
  - id: update-view-all-link
    content: Update View All link to /success-cases
    status: completed
    dependencies:
      - update-card-design
---

## User Requirements

用户希望首页的成功案例部分使用与 success-cases 页面相同的卡片设计，包含：

- 动态API数据（非硬编码）
- 录取通知书图片（PDF文件显示PDF图标）
- Featured 精选徽章
- 学生姓名（英文 + 中文）
- 大学名称和位置图标
- 年份和项目标签
- 描述文本

## Current State

首页当前使用硬编码的成功案例数据，与 success-cases 页面的设计不一致。

## Target State

首页成功案例部分使用动态API数据，卡片设计与 success-cases 页面保持一致。

## Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- UI: shadcn/ui, Tailwind CSS
- Icons: Lucide React, Tabler Icons

## Implementation Approach

1. 在 `HomePageContent` 组件中添加 success cases 状态管理
2. 使用 `useEffect` 获取精选成功案例数据 (`/api/success-cases?featured=true&limit=3`)
3. 替换硬编码卡片为动态卡片，复用 success-cases 页面的卡片设计
4. 更新"查看全部"链接指向 `/success-cases`

## Directory Structure

```
src/components/
└── home-page-content.tsx    # [MODIFY] Update success section with dynamic data
```

## Key Changes

1. **Add State**: `successCases`, `loading` states
2. **Fetch Data**: Call `/api/success-cases?featured=true&limit=3` on mount
3. **Card Design**: Use Image for admission notice, PDF icon for PDFs, Featured badge
4. **Icons**: Use MapPin for location, Calendar for year
5. **Link**: Update to `/success-cases`