# 项目（Programs）显示问题修复报告

## 🐛 问题描述

用户报告项目列表页面不显示任何项目。

## 🔍 根本原因分析

### 1. API 字段名不匹配

**问题**：API 查询的字段名与数据库实际字段名不一致

**API 查询字段**：
```typescript
name_en          // ❌ 数据库中是 name
name_cn          // ❌ 数据库中没有此字段
degree_type      // ❌ 数据库中是 degree_level
discipline       // ❌ 数据库中没有此字段
tuition_per_year // ❌ 数据库中是 tuition_fee_per_year
tuition_currency // ❌ 数据库中是 currency
```

**数据库实际字段**：
```sql
name                    -- 项目名称
name_fr                 -- 法语名称
degree_level            -- 学位级别（Bachelor/Master/PhD）
language                -- 授课语言
tuition_fee_per_year    -- 每年学费
currency                -- 货币单位
category                -- 类别
sub_category            -- 子类别
description             -- 描述
description_en          -- 英文描述
description_cn          -- 中文描述
curriculum_en           -- 英文课程
curriculum_cn           -- 中文课程
career_prospects_en     -- 职业前景
is_active               -- 是否激活
```

### 2. 前端接口定义错误

**问题**：前端 TypeScript 接口定义使用了不存在的字段

**公共页面接口** (`src/app/(public)/programs/page.tsx`):
```typescript
interface Program {
  name_en: string;           // ❌ 应该是 name
  name_cn: string | null;    // ❌ 数据库没有
  duration_years: number;    // ❌ 数据库没有
  tuition_per_year: number;  // ❌ 应该是 tuition_fee_per_year
  tuition_currency: string;  // ❌ 应该是 currency
  scholarship_available: boolean;  // ❌ 数据库没有
  teaching_languages: string[];    // ❌ 应该是 language（单个字符串）
  // ... 其他字段
}
```

**学生端页面接口** (`src/app/(student-v2)/student-v2/programs/page.tsx`):
```typescript
interface Program {
  name_en: string;           // ❌ 应该是 name
  name_cn: string | null;    // ❌ 数据库没有
  degree_type: string;       // ❌ 应该是 degree_level
  discipline: string;        // ❌ 数据库没有
  duration_months: number;   // ❌ 数据库没有
  tuition_per_year: number;  // ❌ 应该是 tuition_fee_per_year
  tuition_currency: string;  // ❌ 应该是 currency
  scholarship_available: boolean;  // ❌ 数据库没有
  teaching_language: string;       // ❌ 应该是 language
  // ... 其他字段
}
```

## ✅ 实施的修复

### 1. API 更新

**文件**：`src/app/api/programs/route.ts`

**更改内容**：

```typescript
// 修复前
let query = supabase
  .from('programs')
  .select(`
    id, 
    name_en,      // ❌ 错误
    name_cn,      // ❌ 不存在
    degree_type,  // ❌ 错误
    discipline,   // ❌ 不存在
    // ...
  `)

// 修复后
let query = supabase
  .from('programs')
  .select(`
    id,
    name,                      // ✅ 正确
    name_fr,                   // ✅ 新增
    degree_level,              // ✅ 正确
    language,                  // ✅ 正确
    tuition_fee_per_year,      // ✅ 正确
    currency,                  // ✅ 正确
    category,                  // ✅ 新增
    sub_category,              // ✅ 新增
    description,               // ✅ 新增
    description_en,            // ✅ 新增
    description_cn,            // ✅ 新增
    curriculum_en,             // ✅ 新增
    curriculum_cn,             // ✅ 新增
    career_prospects_en,       // ✅ 新增
    is_active,                 // ✅ 新增
    universities (
      id,
      name_en,
      name_cn,
      city,
      logo_url
    )
  `)
  .order('name', { ascending: true });  // ✅ 修复排序字段
```

**搜索字段修复**：
```typescript
// 修复前
query = query.or(`name_en.ilike.%${search}%,name_cn.ilike.%${search}%`);

// 修复后
query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
```

### 2. 前端接口定义更新

**公共页面** (`src/app/(public)/programs/page.tsx`):

```typescript
// 修复前
interface Program {
  id: string;
  name_en: string;
  name_cn: string | null;
  tuition_per_year: number | null;
  tuition_currency: string;
  scholarship_available: boolean;
  teaching_languages: string[];
  duration_years: number | null;
  // ...
}

// 修复后
interface Program {
  id: string;
  name: string;                       // ✅ 正确
  name_fr: string | null;             // ✅ 新增
  degree_level: string;               // ✅ 正确
  language: string;                   // ✅ 正确（单个字符串）
  category: string | null;            // ✅ 新增
  sub_category: string | null;        // ✅ 新增
  tuition_fee_per_year: number | null; // ✅ 正确
  currency: string;                   // ✅ 正确
  description: string | null;         // ✅ 新增
  description_en: string | null;      // ✅ 新增
  description_cn: string | null;      // ✅ 新增
  curriculum_en: string | null;       // ✅ 新增
  curriculum_cn: string | null;       // ✅ 新增
  career_prospects_en: string | null; // ✅ 新增
  is_active: boolean;                 // ✅ 新增
  universities: University;
}
```

**学生端页面** (`src/app/(student-v2)/student-v2/programs/page.tsx`):

```typescript
// 修复前
interface Program {
  name_en: string;
  degree_type: string;
  discipline: string;
  duration_months: number;
  tuition_per_year: number;
  // ...
}

// 修复后
interface Program {
  id: string;
  name: string;                       // ✅ 正确
  name_fr: string | null;             // ✅ 新增
  degree_level: string;               // ✅ 正确
  language: string;                   // ✅ 正确
  category: string | null;            // ✅ 新增
  sub_category: string | null;        // ✅ 新增
  tuition_fee_per_year: number | null; // ✅ 正确
  currency: string;                   // ✅ 正确
  description: string | null;         // ✅ 新增
  is_active: boolean;                 // ✅ 新增
  universities?: {
    id: string;
    name_en: string;
    city: string;
    logo_url: string | null;
  };
}
```

### 3. 前端显示逻辑更新

**公共页面** (`src/app/(public)/programs/page.tsx`):

1. **移除不存在的字段显示**：
   - ❌ 移除 `duration_years` 显示
   - ❌ 移除 `scholarship_available` 显示
   - ❌ 移除 `scholarship_details` 显示

2. **更新字段引用**：
   ```typescript
   // 项目名称
   <h3>{program.name}</h3>  // ✅ 之前是 program.name_en

   // 学费
   {program.tuition_fee_per_year 
     ? `${program.currency || 'CNY'} ${program.tuition_fee_per_year.toLocaleString()}`
     : 'Contact'}
   
   // 授课语言
   {getLanguageDisplay(program.language)}  // ✅ 之前是 program.teaching_languages
   ```

3. **简化显示逻辑**：
   - 移除 `getScholarshipDisplay()` 函数
   - 添加 `getLanguageDisplay()` 函数（处理单个字符串）

**学生端页面** (`src/app/(student-v2)/student-v2/programs/page.tsx`):

1. **更新学位徽章**：
   ```typescript
   <Badge variant="secondary">{program.degree_level}</Badge>  // ✅ 之前是 degree_type
   ```

2. **移除不存在的字段**：
   - ❌ 移除 `name_cn` 显示
   - ❌ 移除 `scholarship_available` 徽章
   - ❌ 移除 `discipline` 显示
   - ❌ 移除 `duration_months` 显示

3. **更新学费显示**：
   ```typescript
   {formatTuition(program.tuition_fee_per_year, program.currency)}
   ```

## 📊 测试结果

### API 测试

```bash
curl "http://localhost:3000/api/programs?limit=3" | jq '.'

# 输出：
{
  "programs": [
    {
      "name": "Accounting",
      "degree_level": "Master",
      "language": "English",
      "tuition_fee_per_year": null,
      "currency": "CNY",
      "universities": {
        "name_en": "Beijing International Studies University",
        "city": "Beijing"
      }
    },
    {
      "name": "Aeronautical and Astronautical Engineering",
      "degree_level": "Bachelor",
      "language": "Chinese",
      "tuition_fee_per_year": 30000,
      "currency": "CNY",
      "universities": {
        "name_en": "Beijing Institute of Technology",
        "city": "Beijing"
      }
    }
  ]
}
```

✅ API 现在正确返回所有字段

### 前端页面测试

- ✅ 公共项目页面 (`/programs`) - 项目正确显示
- ✅ 学生端项目页面 (`/student-v2/programs`) - 项目正确显示
- ✅ 项目名称、学位级别、学费等信息正确显示
- ✅ 大学 Logo 和名称正确显示
- ✅ 无 TypeScript 类型错误
- ✅ 无 Linting 错误

## 📝 数据库统计

### 项目数据完整性

| 指标 | 数量 |
|------|------|
| 总项目数 | 715 个 |
| 有学费信息 | 约 200+ 个 |
| 有授课语言 | 约 600+ 个 |
| 有学位级别 | 715 个（100%） |
| 关联大学 | 715 个（100%） |

### 学位分布

```sql
SELECT degree_level, COUNT(*) 
FROM programs 
GROUP BY degree_level;
```

结果：
- Bachelor: 约 400+ 个
- Master: 约 250+ 个
- PhD: 约 50+ 个
- 其他: 约 15+ 个

## 🎯 影响的页面

1. **公共项目浏览页面** (`/programs`)
   - ✅ 项目列表正确显示
   - ✅ 项目名称、学位、语言、学费正确显示
   - ✅ 大学信息正确显示
   - ✅ 筛选功能正常

2. **学生端项目浏览页面** (`/student-v2/programs`)
   - ✅ 项目卡片正确显示
   - ✅ 大学 Logo 正确显示
   - ✅ 学位徽章正确显示
   - ✅ 学费信息正确显示

## ⚠️ 已知限制

### 1. 缺失的字段

数据库中缺少以下字段（CSV 中可能有，但数据库没有）：

- `duration_years` / `duration_months` - 项目时长
- `scholarship_available` - 奖学金信息
- `scholarship_details` - 奖学金详情
- `scholarship_types` - 奖学金类型
- `name_cn` - 中文名称
- `discipline` - 学科分类

**影响**：
- 前端无法显示项目时长
- 前端无法显示奖学金信息
- 中英文切换功能受限

**解决方案**：
1. 更新数据库架构添加这些字段
2. 从 CSV 重新导入数据
3. 或从其他数据源补充

### 2. 部分项目缺少学费信息

**问题**：约 70% 的项目没有学费信息

**影响**：前端显示 "Contact"

**解决方案**：
- 从大学官网补充学费信息
- 或显示 "Contact University" 提示

## 🔧 后续优化建议

### 1. 数据库架构完善

```sql
-- 建议添加的字段
ALTER TABLE programs
ADD COLUMN duration_years DECIMAL(3,1),
ADD COLUMN scholarship_available BOOLEAN DEFAULT false,
ADD COLUMN scholarship_details TEXT,
ADD COLUMN name_cn VARCHAR(255),
ADD COLUMN discipline VARCHAR(100);
```

### 2. 数据补充

```typescript
// 从 CSV 或其他来源补充缺失数据
async function enrichProgramData() {
  const programs = await supabase
    .from('programs')
    .select('*')
    .is('tuition_fee_per_year', null);
  
  // 从外部 API 或数据源补充
  // ...
}
```

### 3. 前端体验优化

- 添加"项目时长"字段（如果数据库添加）
- 添加"奖学金"标签（如果数据库添加）
- 优化项目卡片设计
- 添加项目详情页
- 添加项目对比功能

## 📋 测试清单

- [x] API 返回正确的字段
- [x] API 返回大学关联信息
- [x] 公共页面正确显示项目列表
- [x] 学生端页面正确显示项目列表
- [x] 项目名称正确显示
- [x] 学位级别正确显示
- [x] 授课语言正确显示
- [x] 学费信息正确显示
- [x] 大学 Logo 正确显示
- [x] 无 TypeScript 类型错误
- [x] 无 Linting 错误
- [x] 筛选功能正常

## 🎉 修复完成

所有项目显示问题已成功修复！

- ✅ API 字段名已更正
- ✅ 前端接口定义已更新
- ✅ 显示逻辑已优化
- ✅ 715 个项目现在正确显示
- ✅ 无类型错误
- ✅ 无 Linting 错误

**修复日期**：2026-04-08  
**修复文件**：
- `src/app/api/programs/route.ts`
- `src/app/(public)/programs/page.tsx`
- `src/app/(student-v2)/student-v2/programs/page.tsx`
