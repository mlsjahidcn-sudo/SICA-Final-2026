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
  university_id: 1,
  name: 2,
  name_chinese: 3,
  degree_level: 4,
  duration_years: 5,
  tuition_per_year: 6,
  tuition_currency: 7,
  description: 8,
  eligibility: 9,
  language: 10,
  intake_months: 11,
  field_of_study: 12,
  created_at: 13,
  updated_at: 14,
  slug: 15,
  risk_level: 16,
  scholarship_info: 17,
};

interface ProgramDB {
  id: string;
  university_id: string | null;
  name: string;
  degree_level: string;
  language?: string | null;
  tuition_fee_per_year?: number | null;
  currency?: string | null;
  description?: string | null;
  is_active?: boolean;
  duration_years?: number | null;
  category?: string | null;
}

// CSV 行转换为数据库对象
function mapCSVToDB(fields: string[]): ProgramDB {
  return {
    id: fields[FIELD_INDEX.id],
    university_id: fields[FIELD_INDEX.university_id] || null,
    name: fields[FIELD_INDEX.name],
    degree_level: fields[FIELD_INDEX.degree_level] || 'Bachelor',
    language: fields[FIELD_INDEX.language] || 'Chinese',
    tuition_fee_per_year: fields[FIELD_INDEX.tuition_per_year] ? parseFloat(fields[FIELD_INDEX.tuition_per_year]) : null,
    currency: fields[FIELD_INDEX.tuition_currency] || 'CNY',
    description: fields[FIELD_INDEX.description] || null,
    is_active: true,
    duration_years: fields[FIELD_INDEX.duration_years] ? parseFloat(fields[FIELD_INDEX.duration_years]) : null,
    category: fields[FIELD_INDEX.field_of_study] || null,
  };
}

async function importPrograms() {
  console.log('🚀 Starting programs import...\n');
  
  const csvPath = path.join(__dirname, '../programs.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  const programs: ProgramDB[] = [];
  const universityCache = new Set<string>();
  
  // 先获取所有已存在的大学 ID
  console.log('📋 Fetching existing universities...');
  const { data: universities, error: uniError } = await supabase
    .from('universities')
    .select('id');
  
  if (uniError) {
    console.error('❌ Error fetching universities:', uniError.message);
    process.exit(1);
  }
  
  universities?.forEach(uni => universityCache.add(uni.id));
  console.log(`✅ Found ${universityCache.size} universities in database\n`);
  
  // 读取 CSV 文件
  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineNumber = 0;
  let skippedCount = 0;
  
  for await (const line of rl) {
    lineNumber++;
    
    // 跳过表头
    if (lineNumber === 1) {
      continue;
    }
    
    try {
      const fields = parseCSVLine(line);
      
      if (fields.length >= 5 && fields[0]) {  // 确保有足够字段且 ID 不为空
        const program = mapCSVToDB(fields);
        
        // 检查 university_id 是否存在
        if (program.university_id && universityCache.has(program.university_id)) {
          programs.push(program);
        } else {
          skippedCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error parsing line ${lineNumber}:`, error);
    }
  }
  
  console.log(`📊 Total programs to import: ${programs.length}`);
  console.log(`⚠️  Skipped (missing university): ${skippedCount}\n`);
  
  if (programs.length === 0) {
    console.log('⚠️  No programs found in CSV');
    return;
  }
  
  // 显示前 3 条记录预览
  console.log('📋 Preview (first 3):');
  programs.slice(0, 3).forEach((prog, idx) => {
    console.log(`   ${idx + 1}. ${prog.name} (${prog.degree_level}) - Duration: ${prog.duration_years || 'N/A'} years`);
  });
  console.log('');
  
  // 分批导入（每批 50 条）
  const batchSize = 50;
  let imported = 0;
  let errors = 0;
  
  for (let i = 0; i < programs.length; i += batchSize) {
    const batch = programs.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(programs.length / batchSize);
    
    try {
      const { data, error } = await supabase
        .from('programs')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`❌ Batch ${batchNum}/${totalBatches} error:`, error.message);
        errors += batch.length;
      } else {
        imported += batch.length;
        console.log(`✅ Batch ${batchNum}/${totalBatches}: Imported ${imported}/${programs.length} programs`);
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
  console.log(`   📊 Total: ${programs.length}`);
  console.log(`   ⚠️  Skipped (no university): ${skippedCount}`);
  
  if (imported === programs.length) {
    console.log('\n🎉 All programs imported successfully!');
  } else if (imported > 0) {
    console.log('\n⚠️  Partial import completed. Check errors above.');
  } else {
    console.log('\n❌ Import failed. No programs were imported.');
  }
}

// 执行导入
importPrograms()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
