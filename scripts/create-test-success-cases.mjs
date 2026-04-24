import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestCases() {
  console.log('🎯 Creating test success cases...\n');

  const testCases = [
    {
      student_name_en: 'Ahmed Mohammed',
      student_name_cn: '艾哈迈德·穆罕默德',
      university_name_en: 'Tsinghua University',
      university_name_cn: '清华大学',
      program_name_en: 'Master in Computer Science',
      program_name_cn: '计算机科学硕士',
      description_en: 'Received full scholarship for computer science program at one of China\'s top universities.',
      description_cn: '获得中国顶尖大学计算机科学项目全额奖学金。',
      status: 'published',
      is_featured: true,
      admission_year: 2025,
      intake: 'September',
      display_order: 1
    },
    {
      student_name_en: 'Maria Santos',
      student_name_cn: '玛丽亚·桑托斯',
      university_name_en: 'Peking University',
      university_name_cn: '北京大学',
      program_name_en: 'Bachelor in International Relations',
      program_name_cn: '国际关系学士',
      description_en: 'Successfully admitted to the prestigious international relations program.',
      description_cn: '成功被著名的国际关系项目录取。',
      status: 'published',
      is_featured: true,
      admission_year: 2025,
      intake: 'September',
      display_order: 2
    },
    {
      student_name_en: 'John Smith',
      student_name_cn: '约翰·史密斯',
      university_name_en: 'Zhejiang University',
      university_name_cn: '浙江大学',
      program_name_en: 'PhD in Biomedical Engineering',
      program_name_cn: '生物医学工程博士',
      description_en: 'Awarded research scholarship for PhD program in biomedical engineering.',
      description_cn: '获得生物医学工程博士项目研究奖学金。',
      status: 'published',
      is_featured: false,
      admission_year: 2025,
      intake: 'March',
      display_order: 3
    },
    {
      student_name_en: 'Fatima Al-Hassan',
      student_name_cn: '法蒂玛·哈桑',
      university_name_en: 'Shanghai Jiao Tong University',
      university_name_cn: '上海交通大学',
      program_name_en: 'Master in Business Administration',
      program_name_cn: '工商管理硕士',
      description_en: 'Received CSC scholarship for MBA program at SJTU.',
      description_cn: '获得上海交通大学MBA项目中国政府奖学金。',
      status: 'published',
      is_featured: false,
      admission_year: 2024,
      intake: 'September',
      display_order: 4
    },
    {
      student_name_en: 'David Kim',
      student_name_cn: '大卫·金',
      university_name_en: 'Fudan University',
      university_name_cn: '复旦大学',
      program_name_en: 'Bachelor in Economics',
      program_name_cn: '经济学学士',
      description_en: 'Admitted with partial scholarship to study economics.',
      description_cn: '获得部分奖学金被经济学专业录取。',
      status: 'published',
      is_featured: false,
      admission_year: 2024,
      intake: 'September',
      display_order: 5
    }
  ];

  try {
    const { data, error } = await supabase
      .from('success_cases')
      .insert(testCases)
      .select();

    if (error) {
      console.error('❌ Error creating test cases:', error.message);
      return;
    }

    console.log(`✅ Successfully created ${data.length} test success cases!\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   Total cases: ${data.length}`);
    console.log(`   Featured: ${data.filter(c => c.is_featured).length}`);
    console.log(`   Published: ${data.filter(c => c.status === 'published').length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🌐 View on public page:');
    console.log('   http://localhost:3000/success-cases\n');
    console.log('🔐 Manage in admin panel:');
    console.log('   http://localhost:3000/admin/v2/success-cases\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

createTestCases();
