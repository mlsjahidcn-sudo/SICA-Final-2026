---
name: Enhance AI University Generation
overview: Enhance the AI university generation endpoint to populate all database fields including tuition, scholarships, admissions, media, and SEO fields.
todos:
  - id: update-ai-prompt
    content: 更新 AI 生成端点的系统提示词，添加所有缺失字段的 JSON 结构和生成指南
    status: pending
  - id: update-field-mapping
    content: 更新前端新大学页面的字段映射逻辑，添加学费、招生、设施、媒体等新字段
    status: pending
    dependencies:
      - update-ai-prompt
  - id: add-field-validation
    content: 在 API 响应处理中添加字段验证和规范化逻辑
    status: pending
    dependencies:
      - update-field-mapping
  - id: test-generation
    content: 测试 AI 生成功能，验证所有字段正确生成和映射
    status: pending
    dependencies:
      - add-field-validation
---

## 问题概述

用户反馈 AI 大学生成功能没有生成所有字段。当前 AI 生成端点只生成约 20 个字段，而数据库架构有 50+ 个字段。

## 核心需求

- 增强 AI 大学生成功能，覆盖所有数据库字段
- 确保生成的数据完整、准确、专业
- 减少手动输入的工作量

## 缺失字段分类

### 学费与财务 (6个字段)

- `tuition_min`, `tuition_max`, `tuition_currency` - 学费范围
- `default_tuition_per_year`, `default_tuition_currency`, `use_default_tuition` - 默认学费设置

### 招生信息 (6个字段)

- `tier` - 大学层级 (Tier 1-5)
- `acceptance_flexibility` - 录取灵活性
- `csca_required`, `has_application_fee` - CSCA要求和申请费
- `application_deadline` - 申请截止日期
- `intake_months` - 入学月份（数组）

### 设施与住宿 (4个字段)

- `accommodation_available` - 是否提供住宿
- `accommodation_info_en`, `accommodation_info_cn` - 住宿信息（中英文）
- `facilities_en`, `facilities_cn` - 设施描述（中英文）

### 媒体资源 (3个字段)

- `images` - 额外图片（数组）
- `video_urls` - 视频链接（数组）
- `og_image` - OpenGraph 分享图片

### 联系方式 (2个字段)

- `contact_email`, `contact_phone` - 联系邮箱和电话

### 位置信息 (3个字段)

- `country` - 国家（默认 China）
- `latitude`, `longitude` - 地理坐标

### SEO与其他 (2个字段)

- `tags` - 标签（数组）
- `slug` - URL别名

## 预期效果

用户输入大学名称后，AI 自动生成完整的大学信息，包括学费、招生要求、设施描述、联系方式、SEO设置等所有字段，大幅减少手动输入工作。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **AI**: LLM integration via `invokeLLM`

## 实现方案

### 1. 增强 AI 系统提示词

更新 `/api/admin/universities/generate/route.ts` 中的系统提示词，添加完整的 JSON 响应结构：

```typescript
const systemPrompt = `You are an expert in Chinese higher education...
Return your response ONLY as a valid JSON object with the following structure:
{
  // Basic Info (existing)
  "name_en": "...",
  "name_cn": "...",
  "short_name": "...",
  
  // Location (enhanced)
  "province": "...",
  "city": "...",
  "country": "China",
  "address_en": "...",
  "address_cn": "...",
  "latitude": number or null,
  "longitude": number or null,
  
  // Classification (existing)
  "type": "985|211|Double First-Class|Provincial|Private",
  "category": "...",
  "tier": "Tier 1|Tier 2|Tier 3|Tier 4|Tier 5",
  "ranking_national": number,
  "ranking_international": number or null,
  "founded_year": number or null,
  
  // Descriptions (enhanced)
  "description_en": "Comprehensive English description (300+ words)",
  "description_cn": "Comprehensive Chinese description (300+ characters)",
  "facilities_en": "Campus facilities description in English",
  "facilities_cn": "校园设施描述（中文）",
  "accommodation_info_en": "Accommodation information in English",
  "accommodation_info_cn": "住宿信息（中文）",
  
  // Tuition & Scholarships (new)
  "tuition_min": number or null,
  "tuition_max": number or null,
  "tuition_currency": "CNY|USD|EUR|GBP",
  "default_tuition_per_year": number or null,
  "default_tuition_currency": "CNY",
  "use_default_tuition": boolean,
  "scholarship_available": boolean,
  "scholarship_percentage": number (0-100),
  "scholarship_info_en": "Detailed scholarship info in English",
  "scholarship_info_cn": "奖学金详情（中文）",
  
  // Admissions (new)
  "acceptance_flexibility": "Flexible|Strict|Conditional",
  "csca_required": boolean,
  "has_application_fee": boolean,
  "application_deadline": "YYYY-MM-DD or description",
  "intake_months": [3, 9],
  
  // Contact (new)
  "contact_email": "admissions@university.edu.cn",
  "contact_phone": "+86-xxx-xxxx-xxxx",
  "website": "https://...",
  
  // Media (enhanced)
  "logo_url": "...",
  "cover_image_url": "...",
  "og_image": "...",
  "images": ["url1", "url2"],
  "video_urls": ["youtube_url"],
  
  // Student Stats (existing)
  "student_count": number,
  "international_student_count": number,
  "teaching_languages": ["English", "Chinese"],
  
  // SEO (existing)
  "meta_title": "...",
  "meta_description": "...",
  "meta_keywords": ["keyword1", "keyword2"],
  "tags": ["tag1", "tag2"],
  "slug": "university-name-slug"
}
...guidelines...`;
```

### 2. 前端字段映射更新

更新 `/app/admin/(admin-v2)/v2/universities/new/page.tsx` 中的 `handleAIGenerate` 函数，添加新字段的映射：

```typescript
const updatedFormData = {
  ...formData,
  // Existing fields...
  
  // New tuition fields
  tuition_min: generated.tuition_min?.toString() || '',
  tuition_max: generated.tuition_max?.toString() || '',
  tuition_currency: generated.tuition_currency || 'CNY',
  default_tuition_per_year: generated.default_tuition_per_year?.toString() || '',
  use_default_tuition: generated.use_default_tuition ?? false,
  
  // New admission fields
  tier: generated.tier || '',
  acceptance_flexibility: generated.acceptance_flexibility || '',
  csca_required: generated.csca_required ?? false,
  has_application_fee: generated.has_application_fee ?? false,
  application_deadline: generated.application_deadline || '',
  intake_months: generated.intake_months?.map(String) || [],
  
  // New contact fields
  contact_email: generated.contact_email || '',
  contact_phone: generated.contact_phone || '',
  
  // New location fields
  country: generated.country || 'China',
  
  // New facility fields
  facilities: generated.facilities_en || generated.facilities_cn || '',
  accommodation_available: generated.accommodation_available ?? false,
  scholarship_info: generated.scholarship_info_en || '',
  scholarship_info_cn: generated.scholarship_info_cn || '',
  
  // Enhanced media fields
  images: generated.images?.join('\n') || '',
  video_urls: generated.video_urls?.join('\n') || '',
  
  // SEO tags
  tags: generated.tags?.join(', ') || '',
};
```

### 3. 字段验证和规范化

在 API 响应处理中添加字段验证：

- 验证 `tier` 为有效值 (Tier 1-5)
- 验证 `intake_months` 为 1-12 的数字数组
- 规范化 `slug` 格式
- 验证 URL 格式的字段

## 目录结构

```
src/
├── app/api/admin/universities/
│   ├── generate/route.ts        # [MODIFY] 增强AI生成提示词和响应处理
│   └── [id]/seo/generate/route.ts # 保持现有SEO生成逻辑
├── app/admin/(admin-v2)/v2/universities/
│   ├── new/page.tsx             # [MODIFY] 更新字段映射
│   └── [id]/edit/page.tsx       # 参考（已有完整字段）
└── storage/database/shared/
    └── schema.ts                 # 参考（数据库架构定义）
```

## 实现注意事项

### 性能考虑

- AI 生成已包含大量字段，响应时间可能增加 2-3 秒
- 保持 `temperature: 0.3` 确保输出稳定性
- JSON 响应解析需要处理嵌套数组

### 数据验证

- `intake_months` 必须是 1-12 的有效月份
- `tuition_min` 和 `tuition_max` 应为合理数值（1000-200000 CNY）
- URL 字段需要验证格式或设为 null

### 向后兼容

- 保持现有字段的映射逻辑不变
- 新字段使用可选链和默认值
- 不影响已有的 SEO 生成功能

## Agent Extensions

### Skill

- **ui-ux-pro-max**
- Purpose: 获取 UI 设计指南，确保表单字段布局合理
- Expected outcome: 表单字段分组和布局建议