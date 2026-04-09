# 数据导入总结

## 📊 导入统计

### 大学数据（Universities）

| 指标 | 数量 | 百分比 |
|------|------|--------|
| **总大学数** | 98 所 | 100% |
| 有封面图片 | 89 所 | 90.8% |
| 有主图 | 89 所 | 90.8% |
| 有 Logo | 89 所 | 90.8% |
| 有标签 | 98 所 | 100% |

### 项目数据（Programs）

| 指标 | 数量 |
|------|------|
| **总项目数** | 715 个 |

## 🏷️ 大学标签分布

| 标签 | 大学数量 |
|------|---------|
| Regular（普通大学）| 65 所 |
| 211 工程 | 25 所 |
| 双一流 | 20 所 |
| 985 工程 | 13 所 |

## 🖼️ 图片来源分析

| 域名 | 数量 | 百分比 | 状态 |
|------|------|--------|------|
| static-data.gaokao.cn | 78 所 | 79.59% | ✅ 可访问 |
| studyinchina.academy | 10 所 | 10.20% | ⚠️ SSL 错误 |
| 无图片 | 9 所 | 9.18% | ❌ 缺失 |
| 其他 | 1 所 | 1.02% | ❓ 待验证 |

## ✅ 已修复的问题

### 1. 字段映射问题
- **问题**：前端使用 `cover_image_url`，数据库使用 `image_url`
- **解决方案**：添加 `cover_image_url` 字段并从 `image_url` 复制数据
- **状态**：✅ 已解决

### 2. 标签格式问题
- **问题**：`type` 字段存储为字符串，格式不一致（逗号分隔 vs JSON 数组）
- **解决方案**：创建新的 `tags` 字段（JSONB 类型），统一转换为数组格式
- **状态**：✅ 已解决

### 3. 数据库字段缺失
- **问题**：CSV 中有 40 个字段，但数据库表缺少很多字段
- **解决方案**：添加所有缺失字段（image_url, images, video_urls, meta 字段等）
- **状态**：✅ 已解决

## ⚠️ 已知问题

### 1. 图片访问问题
- **问题描述**：`studyinchina.academy` 域名的图片返回 HTTP 526 错误（SSL 握手失败）
- **影响范围**：10 所大学（10.20%）
- **临时解决方案**：
  - 前端使用 `unoptimized` 属性绕过 Next.js 图片优化
  - 或使用代理/CDN 访问这些图片
- **永久解决方案**：联系域名所有者修复 SSL 证书

### 2. 部分大学缺少图片
- **问题描述**：9 所大学没有封面图片
- **影响范围**：9.18%
- **解决方案**：
  - 使用占位图或渐变背景
  - 从其他来源补充图片

## 📝 数据库架构更新

### 新增字段

```sql
-- 大学表新增字段
ALTER TABLE universities
ADD COLUMN image_url TEXT,                    -- 主图 URL
ADD COLUMN images JSONB,                      -- 图片数组（多张图片）
ADD COLUMN cover_image_url TEXT,              -- 封面图 URL
ADD COLUMN tags JSONB,                        -- 标签数组
ADD COLUMN established_year INTEGER,          -- 建校年份
ADD COLUMN video_urls JSONB,                  -- 视频链接数组
ADD COLUMN meta_title TEXT,                   -- SEO 标题
ADD COLUMN meta_description TEXT,             -- SEO 描述
ADD COLUMN meta_keywords TEXT,                -- SEO 关键词
ADD COLUMN og_image TEXT,                     -- 社交分享图片
ADD COLUMN slug VARCHAR(255) UNIQUE,          -- URL 别名
ADD COLUMN application_deadline DATE,         -- 申请截止日期
ADD COLUMN is_active BOOLEAN DEFAULT true,    -- 是否激活
ADD COLUMN intake_months JSONB,               -- 入学月份
ADD COLUMN default_tuition_per_year DECIMAL(10,2),  -- 默认学费
ADD COLUMN default_tuition_currency VARCHAR(10),    -- 学费货币
ADD COLUMN use_default_tuition BOOLEAN,       -- 使用默认学费
ADD COLUMN scholarship_percentage INTEGER,    -- 奖学金百分比
ADD COLUMN tuition_by_degree JSONB,           -- 按学位的学费
ADD COLUMN scholarship_by_degree JSONB,       -- 按学位的奖学金
ADD COLUMN tier VARCHAR(50),                  -- 大学等级
ADD COLUMN acceptance_flexibility VARCHAR(50), -- 录取灵活性
ADD COLUMN csca_required BOOLEAN,             -- 是否需要 CSCA
ADD COLUMN has_application_fee BOOLEAN,       -- 是否有申请费
ADD COLUMN tuition_min DECIMAL(10,2),         -- 最低学费
ADD COLUMN tuition_max DECIMAL(10,2),         -- 最高学费
ADD COLUMN tuition_currency VARCHAR(10),      -- 学费货币
ADD COLUMN country VARCHAR(100) DEFAULT 'China', -- 国家
ADD COLUMN location TEXT;                     -- 详细地址
```

## 🔧 导入脚本

### 大学数据导入
```bash
pnpm import:universities:full
```

### 项目数据导入
```bash
pnpm import:programs
```

## 📋 数据验证

### 查询示例

```sql
-- 查看大学图片数据
SELECT 
  name_en,
  image_url,
  jsonb_array_length(images) as images_count,
  tags
FROM universities
LIMIT 5;

-- 查看不同等级的大学数量
SELECT 
  tier,
  COUNT(*) as count
FROM universities
GROUP BY tier
ORDER BY count DESC;

-- 查看有双一流标签的大学
SELECT name_en, tags
FROM universities
WHERE tags ? 'Double First-Class'
ORDER BY ranking_world;
```

## 🎯 下一步建议

1. **图片优化**
   - 将图片上传到自己的 CDN 或对象存储
   - 优化图片大小和格式
   - 为缺失图片的大学补充图片

2. **SEO 优化**
   - 为所有大学生成唯一的 slug
   - 完善 meta_title 和 meta_description
   - 添加结构化数据

3. **数据完善**
   - 补充缺失的申请截止日期
   - 完善学费信息
   - 添加更多大学设施信息

4. **前端优化**
   - 使用 Next.js Image 组件优化图片加载
   - 添加图片懒加载
   - 为图片添加占位符和加载动画

---

**导入日期**：2026-04-08  
**数据来源**：universities.csv, programs.csv  
**导入工具**：scripts/import-universities-full.ts, scripts/import-programs.ts
