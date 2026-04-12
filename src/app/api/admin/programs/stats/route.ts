import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/admin/programs/stats - Get detailed statistics for programs
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get basic counts
    const [totalCount, activeCount, scholarshipCount, archivedCount] = await Promise.all([
      supabase.from('programs').select('id', { count: 'exact', head: true }),
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      // Use scholarship_types column - programs with scholarship have non-null scholarship_types
      supabase.from('programs').select('id', { count: 'exact', head: true }).not('scholarship_types', 'is', null),
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('is_active', false),
    ]);
    
    // Featured count - is_featured column may not exist, set to 0
    const featuredCount = { count: 0 };

    // Get programs by degree level
    const { data: degreeData } = await supabase
      .from('programs')
      .select('degree_level')
      .eq('is_active', true);

    const degreeDistribution = (degreeData || []).reduce((acc: Record<string, number>, p) => {
      const type = p.degree_level || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Get programs by discipline/category
    const { data: disciplineData } = await supabase
      .from('programs')
      .select('category')
      .eq('is_active', true);

    const disciplineDistribution = (disciplineData || []).reduce((acc: Record<string, number>, p) => {
      const discipline = p.category || 'Other';
      acc[discipline] = (acc[discipline] || 0) + 1;
      return acc;
    }, {});

    // Get top programs by applications (last N days)
    const { data: topPrograms } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        degree_level,
        universities (name_en),
        application_documents(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get programs by university (top 10)
    const { data: universityData } = await supabase
      .from('programs')
      .select(`
        universities (id, name_en)
      `)
      .eq('is_active', true);

    const universityDistribution = (universityData || []).reduce((acc: Record<string, { id: string; name: string; count: number }>, p) => {
      const uni = p.universities;
      if (uni && !Array.isArray(uni) && 'id' in uni && 'name_en' in uni) {
        const typedUni = uni as { id: string; name_en: string };
        if (!acc[typedUni.id]) {
          acc[typedUni.id] = { id: typedUni.id, name: typedUni.name_en, count: 0 };
        }
        acc[typedUni.id].count++;
      }
      return acc;
    }, {});

    const topUniversities = Object.values(universityDistribution)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent programs
    const { data: recentPrograms } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        degree_level,
        created_at,
        universities (name_en)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get tuition distribution
    const { data: tuitionData } = await supabase
      .from('programs')
      .select('tuition_fee_per_year, currency')
      .eq('is_active', true)
      .not('tuition_fee_per_year', 'is', null);

    const tuitionRanges = {
      '0-10k': 0,
      '10k-20k': 0,
      '20k-30k': 0,
      '30k-50k': 0,
      '50k+': 0,
    };

    (tuitionData || []).forEach(p => {
      if (p.currency === 'CNY' && p.tuition_fee_per_year) {
        if (p.tuition_fee_per_year <= 10000) tuitionRanges['0-10k']++;
        else if (p.tuition_fee_per_year <= 20000) tuitionRanges['10k-20k']++;
        else if (p.tuition_fee_per_year <= 30000) tuitionRanges['20k-30k']++;
        else if (p.tuition_fee_per_year <= 50000) tuitionRanges['30k-50k']++;
        else tuitionRanges['50k+']++;
      }
    });

    // Get teaching language distribution
    const { data: languageData } = await supabase
      .from('programs')
      .select('language')
      .eq('is_active', true);

    const languageDistribution: Record<string, number> = {};
    (languageData || []).forEach(p => {
      if (p.language) {
        p.language.split(',').forEach((lang: string) => {
          const trimmedLang = lang.trim();
          if (trimmedLang) {
            languageDistribution[trimmedLang] = (languageDistribution[trimmedLang] || 0) + 1;
          }
        });
      }
    });

    return NextResponse.json({
      overview: {
        total: totalCount.count || 0,
        active: activeCount.count || 0,
        featured: featuredCount.count || 0,
        withScholarship: scholarshipCount.count || 0,
        archived: archivedCount.count || 0,
      },
      degreeDistribution,
      disciplineDistribution: Object.entries(disciplineDistribution)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topPrograms: (topPrograms || []).map(p => {
        const uni = p.universities;
        const uniName = uni && !Array.isArray(uni) && 'name_en' in uni 
          ? (uni as { name_en: string }).name_en 
          : undefined;
        return {
          id: p.id,
          name: p.name,
          degree: p.degree_level,
          university: uniName,
        };
      }),
      topUniversities,
      recentPrograms: (recentPrograms || []).map(p => {
        const uni = p.universities;
        const uniName = uni && !Array.isArray(uni) && 'name_en' in uni 
          ? (uni as { name_en: string }).name_en 
          : undefined;
        return {
          id: p.id,
          name: p.name,
          degree: p.degree_level,
          university: uniName,
          createdAt: p.created_at,
        };
      }),
      tuitionDistribution: Object.entries(tuitionRanges).map(([range, count]) => ({
        range,
        count,
      })),
      languageDistribution: Object.entries(languageDistribution)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    });
  } catch (error) {
    console.error('Error in programs stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
