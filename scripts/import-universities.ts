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

// 解析 CSV 行（处理引号内的分号）
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // 跳过下一个引号
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

// CSV 字段索引映射
const FIELD_INDEX = {
  id: 0,
  name: 1,
  name_chinese: 2,
  location: 3,
  city: 4,
  province: 5,
  country: 6,
  description: 7,
  website_url: 8,
  tuition_min: 9,
  tuition_max: 10,
  tuition_currency: 11,
  image_url: 12,
  images: 13,
  established_year: 14,
  type: 15,
  created_at: 16,
  updated_at: 17,
  logo_url: 18,
  video_urls: 19,
  ranking_world: 20,
  ranking_national: 21,
  meta_title: 22,
  meta_description: 23,
  meta_keywords: 24,
  og_image: 25,
  slug: 26,
  application_deadline: 27,
  is_active: 28,
  intake_months: 29,
  default_tuition_per_year: 30,
  default_tuition_currency: 31,
  use_default_tuition: 32,
  scholarship_percentage: 33,
  tuition_by_degree: 34,
  scholarship_by_degree: 35,
  tier: 36,
  acceptance_flexibility: 37,
  csca_required: 38,
  has_application_fee: 39,
};

interface UniversityDB {
  id: string;
  name_cn: string;
  name_en: string;
  province: string | null;
  city: string | null;
  type: string | null;
  category?: string | null;
  website_url: string | null;
  logo_url: string | null;
  description: string | null;
  ranking_national: number | null;
  ranking_world: number | null;
  scholarship_available?: boolean;
  accommodation_available?: boolean;
  facilities?: any;
}

// CSV 行转换为数据库对象
function mapCSVToDB(fields: string[]): UniversityDB {
  return {
    id: fields[FIELD_INDEX.id],
    name_cn: fields[FIELD_INDEX.name_chinese] || fields[FIELD_INDEX.name],
    name_en: fields[FIELD_INDEX.name],
    province: fields[FIELD_INDEX.province] || null,
    city: fields[FIELD_INDEX.city] || null,
    type: fields[FIELD_INDEX.type] || null,
    website_url: fields[FIELD_INDEX.website_url] || null,
    logo_url: fields[FIELD_INDEX.logo_url] || null,
    description: fields[FIELD_INDEX.description] || null,
    ranking_national: fields[FIELD_INDEX.ranking_national] ? parseInt(fields[FIELD_INDEX.ranking_national]) : null,
    ranking_world: fields[FIELD_INDEX.ranking_world] ? parseInt(fields[FIELD_INDEX.ranking_world]) : null,
  };
}

async function importUniversities() {
  console.log('🚀 Starting universities import...\n');
  
  const csvPath = path.join(__dirname, '../universities.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  const universities: UniversityDB[] = [];
  
  // 读取 CSV 文件
  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineNumber = 0;
  for await (const line of rl) {
    lineNumber++;
    
    // 跳过表头
    if (lineNumber === 1) {
      continue;
    }
    
    try {
      const fields = parseCSVLine(line);
      
      if (fields.length >= 16 && fields[0]) {  // 确保有足够字段且 ID 不为空
        const mapped = mapCSVToDB(fields);
        universities.push(mapped);
      }
    } catch (error) {
      console.error(`❌ Error parsing line ${lineNumber}:`, error);
    }
  }
  
  console.log(`📊 Total universities to import: ${universities.length}\n`);
  
  if (universities.length === 0) {
    console.log('⚠️  No universities found in CSV');
    return;
  }
  
  // 显示前 3 条记录预览
  console.log('📋 Preview (first 3):');
  universities.slice(0, 3).forEach((uni, idx) => {
    console.log(`   ${idx + 1}. ${uni.name_en} (${uni.name_cn}) - ${uni.city}, ${uni.province}`);
  });
  console.log('');
  
  // 分批导入（每批 50 条）
  const batchSize = 50;
  let imported = 0;
  let errors = 0;
  
  for (let i = 0; i < universities.length; i += batchSize) {
    const batch = universities.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(universities.length / batchSize);
    
    try {
      const { data, error } = await supabase
        .from('universities')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`❌ Batch ${batchNum}/${totalBatches} error:`, error.message);
        errors += batch.length;
      } else {
        imported += batch.length;
        console.log(`✅ Batch ${batchNum}/${totalBatches}: Imported ${imported}/${universities.length} universities`);
      }
    } catch (error) {
      console.error(`❌ Batch ${batchNum} exception:`, error);
      errors += batch.length;
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n📈 Import Summary:');
  console.log(`   ✅ Successfully imported: ${imported}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📊 Total: ${universities.length}`);
  
  if (imported === universities.length) {
    console.log('\n🎉 All universities imported successfully!');
  } else if (imported > 0) {
    console.log('\n⚠️  Partial import completed. Check errors above.');
  } else {
    console.log('\n❌ Import failed. No universities were imported.');
  }
}

// 执行导入
importUniversities()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
