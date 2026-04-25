import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Supabase 配置 - 使用硬编码的外部数据库
const supabaseUrl = 'https://maqzxlcsgfpwnfyleoga.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// CSV 解析函数 - 处理分号分隔和引号
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

// 安全解析 JSON
function safeParseJSON(str: string | null | undefined): any {
  if (!str || str === 'null' || str === '') return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// 安全解析数字
function safeParseInt(str: string | null | undefined): number | null {
  if (!str || str === 'null' || str === '') return null;
  const num = parseInt(str);
  return isNaN(num) ? null : num;
}

function safeParseFloat(str: string | null | undefined): number | null {
  if (!str || str === 'null' || str === '') return null;
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

// 安全解析日期
function safeParseDate(str: string | null | undefined): string | null {
  if (!str || str === 'null' || str === '') return null;
  try {
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

// 安全解析布尔值
function safeParseBool(str: string | null | undefined): boolean {
  if (!str || str === 'null' || str === '') return false;
  return str.toLowerCase() === 'true' || str === '1';
}

interface University {
  id: string;
  name_en: string;
  name_cn: string;
  location?: string;
  city?: string;
  province?: string;
  country?: string;
  description?: string;
  website_url?: string;
  tuition_min?: number;
  tuition_max?: number;
  tuition_currency?: string;
  image_url?: string;
  images?: string[];
  established_year?: number;
  type?: string;
  logo_url?: string;
  video_urls?: string[];
  ranking_world?: number;
  ranking_national?: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  slug?: string;
  application_deadline?: string;
  is_active?: boolean;
  intake_months?: number[];
  default_tuition_per_year?: number;
  default_tuition_currency?: string;
  use_default_tuition?: boolean;
  scholarship_percentage?: number;
  tuition_by_degree?: any;
  scholarship_by_degree?: any;
  tier?: string;
  acceptance_flexibility?: string;
  csca_required?: boolean;
  has_application_fee?: boolean;
  scholarship_available?: boolean;
  accommodation_available?: boolean;
}

async function importUniversities() {
  console.log('🚀 Starting universities import...\n');
  
  const csvPath = path.join(process.cwd(), 'universities.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ universities.csv not found');
    process.exit(1);
  }
  
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const universities: University[] = [];
  let headers: string[] = [];
  let lineNumber = 0;
  
  // 读取 CSV
  for await (const line of rl) {
    lineNumber++;
    
    if (lineNumber === 1) {
      headers = parseCSVLine(line);
      console.log(`📋 CSV Headers (${headers.length} columns):\n`);
      continue;
    }
    
    const values = parseCSVLine(line);
    
    if (values.length < headers.length) {
      console.warn(`⚠️  Line ${lineNumber}: Missing columns (${values.length}/${headers.length})`);
      continue;
    }
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    const university: University = {
      id: row.id,
      name_en: row.name,
      name_cn: row.name_chinese,
      location: row.location || undefined,
      city: row.city || undefined,
      province: row.province || undefined,
      country: row.country || 'China',
      description: row.description || undefined,
      website_url: row.website_url || undefined,
      tuition_min: safeParseFloat(row.tuition_min) ?? undefined,
      tuition_max: safeParseFloat(row.tuition_max) ?? undefined,
      tuition_currency: row.tuition_currency || undefined,
      image_url: row.image_url || undefined,
      images: safeParseJSON(row.images) ?? undefined,
      established_year: safeParseInt(row.established_year) ?? undefined,
      type: row.type || undefined,
      logo_url: row.logo_url || undefined,
      video_urls: safeParseJSON(row.video_urls) ?? undefined,
      ranking_world: safeParseInt(row.ranking_world) ?? undefined,
      ranking_national: safeParseInt(row.ranking_national) ?? undefined,
      meta_title: row.meta_title || undefined,
      meta_description: row.meta_description || undefined,
      meta_keywords: row.meta_keywords || undefined,
      og_image: row.og_image || undefined,
      slug: row.slug || undefined,
      application_deadline: safeParseDate(row.application_deadline) ?? undefined,
      is_active: safeParseBool(row.is_active),
      intake_months: safeParseJSON(row.intake_months) ?? undefined,
      default_tuition_per_year: safeParseFloat(row.default_tuition_per_year) ?? undefined,
      default_tuition_currency: row.default_tuition_currency || undefined,
      use_default_tuition: safeParseBool(row.use_default_tuition),
      scholarship_percentage: safeParseInt(row.scholarship_percentage) ?? undefined,
      tuition_by_degree: safeParseJSON(row.tuition_by_degree) ?? undefined,
      scholarship_by_degree: safeParseJSON(row.scholarship_by_degree) ?? undefined,
      tier: row.tier || undefined,
      acceptance_flexibility: row.acceptance_flexibility || undefined,
      csca_required: safeParseBool(row.csca_required),
      has_application_fee: safeParseBool(row.has_application_fee),
      scholarship_available: safeParseBool(row.scholarship_available),
      accommodation_available: safeParseBool(row.accommodation_available),
    };
    
    universities.push(university);
  }
  
  console.log(`📊 Total universities to import: ${universities.length}\n`);
  
  if (universities.length === 0) {
    console.log('⚠️  No universities to import');
    return;
  }
  
  // 显示前 3 条预览
  console.log('👀 Preview (first 3 universities):\n');
  universities.slice(0, 3).forEach((uni, i) => {
    console.log(`${i + 1}. ${uni.name_en} (${uni.name_cn})`);
    console.log(`   Image URL: ${uni.image_url?.substring(0, 80) || 'N/A'}`);
    console.log(`   Images: ${uni.images ? `${uni.images.length} images` : 'N/A'}`);
    console.log(`   Logo: ${uni.logo_url?.substring(0, 80) || 'N/A'}`);
    console.log(`   Ranking: World #${uni.ranking_world || 'N/A'}, National #${uni.ranking_national || 'N/A'}`);
    console.log('');
  });
  
  // 批量导入
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;
  
  console.log('⏳ Importing universities...\n');
  
  for (let i = 0; i < universities.length; i += batchSize) {
    const batch = universities.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('universities')
      .upsert(batch, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${successCount}/${universities.length} universities imported`);
    }
  }
  
  console.log('\n📈 Import Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  // 验证导入结果
  const { data: finalCount } = await supabase
    .from('universities')
    .select('id', { count: 'exact', head: true });
  
  console.log(`\n🎯 Total universities in database: ${finalCount?.length || 0}`);
}

importUniversities().catch(console.error);
