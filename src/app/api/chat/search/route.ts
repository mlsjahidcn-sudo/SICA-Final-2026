import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

// Chinese to English city/province mapping for better search
const CITY_MAPPING: Record<string, string> = {
  '北京': 'Beijing',
  '上海': 'Shanghai',
  '广州': 'Guangzhou',
  '深圳': 'Shenzhen',
  '杭州': 'Hangzhou',
  '成都': 'Chengdu',
  '武汉': 'Wuhan',
  '南京': 'Nanjing',
  '西安': "Xi'an",
  '天津': 'Tianjin',
  '重庆': 'Chongqing',
  '苏州': 'Suzhou',
  '青岛': 'Qingdao',
  '大连': 'Dalian',
  '厦门': 'Xiamen',
  '宁波': 'Ningbo',
  '长沙': 'Changsha',
  '哈尔滨': 'Harbin',
  '沈阳': 'Shenyang',
  '济南': 'Jinan',
  '浙江': 'Zhejiang',
  '江苏': 'Jiangsu',
  '广东': 'Guangdong',
  '四川': 'Sichuan',
  '湖北': 'Hubei',
  '山东': 'Shandong',
};

// Helper to expand search query with Chinese-English mappings
function expandSearchQuery(query: string): string[] {
  const terms = [query];
  
  for (const [cn, en] of Object.entries(CITY_MAPPING)) {
    if (query.includes(cn)) {
      terms.push(en);
    }
    if (query.toLowerCase().includes(en.toLowerCase())) {
      terms.push(cn);
    }
  }
  
  return terms;
}

interface SearchResult {
  universities: Array<{
    id: string;
    name: string;
    name_cn: string | null;
    city: string | null;
    province: string | null;
    ranking: number | null;
    types: string[];
  }>;
  programs: Array<{
    id: string;
    name: string;
    name_cn: string | null;
    degree: string | null;
    major: string | null;
    university_id: string | null;
    university_name: string | null;
    language: string | null;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const result: SearchResult = {
      universities: [],
      programs: [],
    };

    // Expand search query with Chinese-English mappings
    const searchTerms = expandSearchQuery(query);
    
    // Build OR conditions for all search terms
    const universityConditions = searchTerms.map(term => 
      `name_en.ilike.%${term}%,name_cn.ilike.%${term}%,city.ilike.%${term}%,province.ilike.%${term}%`
    ).join(',');
    
    const programConditions = searchTerms.map(term =>
      `name_en.ilike.%${term}%,name_cn.ilike.%${term}%,major.ilike.%${term}%`
    ).join(',');

    // Search universities (by name, city, province)
    const { data: universities, error: uniError } = await supabase
      .from('universities')
      .select('id, name_en, name_cn, city, province, ranking_national, type')
      .or(universityConditions)
      .order('ranking_national', { ascending: true })
      .limit(5);

    if (!uniError && universities) {
      result.universities = universities.map(u => ({
        id: u.id,
        name: u.name_en,
        name_cn: u.name_cn,
        city: u.city,
        province: u.province,
        ranking: u.ranking_national,
        types: u.type ? [u.type] : [],
      }));
    }

    // Search programs (by name, major, discipline)
    const { data: programs, error: progError } = await supabase
      .from('programs')
      .select('id, name_en, name_cn, degree_type, major, university_id, teaching_language, universities(name_en)')
      .or(programConditions)
      .limit(5);

    if (!progError && programs) {
      result.programs = programs.map(p => {
        const uniData = p.universities as unknown as Array<{ name_en: string }> | null;
        return {
          id: p.id,
          name: p.name_en,
          name_cn: p.name_cn,
          degree: p.degree_type,
          major: p.major,
          university_id: p.university_id,
          university_name: uniData?.[0]?.name_en || null,
          language: p.teaching_language,
        };
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
