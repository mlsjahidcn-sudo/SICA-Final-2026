import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET - Get university statistics for charts
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for database operations (bypasses RLS)
    const supabase = getSupabaseClient();

    // Get all universities with their data
    const { data: universities, error } = await supabase
      .from('universities')
      .select('id, province, type, is_active, scholarship_available, ranking_national');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get programs count per university
    const { data: programsData } = await supabase
      .from('programs')
      .select('university_id');

    // Calculate statistics
    const provinceDistribution: Record<string, number> = {};
    const typeDistribution: Record<string, number> = {
      '985': 0,
      '211': 0,
      'Double First-Class': 0,
      'Provincial': 0,
      'Other': 0
    };
    const programsPerProvince: Record<string, number> = {};
    const rankingDistribution = {
      top10: 0,
      top20: 0,
      top50: 0,
      top100: 0,
      unranked: 0
    };

    // Count programs per university
    const programsCount: Record<string, number> = {};
    programsData?.forEach(p => {
      programsCount[p.university_id] = (programsCount[p.university_id] || 0) + 1;
    });

    universities?.forEach(uni => {
      // Province distribution
      provinceDistribution[uni.province] = (provinceDistribution[uni.province] || 0) + 1;

      // Programs per province
      programsPerProvince[uni.province] = (programsPerProvince[uni.province] || 0) + (programsCount[uni.id] || 0);

      // Type distribution (type is an array)
      const types = Array.isArray(uni.type) ? uni.type : [uni.type].filter(Boolean);
      if (types.includes('985')) {
        typeDistribution['985']++;
      } else if (types.includes('211')) {
        typeDistribution['211']++;
      } else if (types.includes('Double First-Class')) {
        typeDistribution['Double First-Class']++;
      } else if (types.includes('Provincial') || types.includes('provincial')) {
        typeDistribution['Provincial']++;
      } else {
        typeDistribution['Other']++;
      }

      // Ranking distribution
      if (uni.ranking_national) {
        if (uni.ranking_national <= 10) rankingDistribution.top10++;
        else if (uni.ranking_national <= 20) rankingDistribution.top20++;
        else if (uni.ranking_national <= 50) rankingDistribution.top50++;
        else if (uni.ranking_national <= 100) rankingDistribution.top100++;
      } else {
        rankingDistribution.unranked++;
      }
    });

    // Get scholarship stats
    const { count: withScholarship } = await supabase
      .from('universities')
      .select('*', { count: 'exact', head: true })
      .eq('scholarship_available', true);

    const { count: withoutScholarship } = await supabase
      .from('universities')
      .select('*', { count: 'exact', head: true })
      .eq('scholarship_available', false);

    // Get active/inactive stats
    const { count: activeCount } = await supabase
      .from('universities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: inactiveCount } = await supabase
      .from('universities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);

    // Transform for charts
    const provinceData = Object.entries(provinceDistribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const typeData = Object.entries(typeDistribution)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);

    const rankingData = [
      { name: 'Top 10', value: rankingDistribution.top10 },
      { name: 'Top 20', value: rankingDistribution.top20 },
      { name: 'Top 50', value: rankingDistribution.top50 },
      { name: 'Top 100', value: rankingDistribution.top100 },
      { name: 'Unranked', value: rankingDistribution.unranked }
    ];

    const statusData = [
      { name: 'Active', value: activeCount || 0 },
      { name: 'Inactive', value: inactiveCount || 0 }
    ];

    const scholarshipData = [
      { name: 'With Scholarship', value: withScholarship || 0 },
      { name: 'No Scholarship', value: withoutScholarship || 0 }
    ];

    const programsByProvinceData = Object.entries(programsPerProvince)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return NextResponse.json({
      provinceDistribution: provinceData,
      typeDistribution: typeData,
      rankingDistribution: rankingData,
      statusDistribution: statusData,
      scholarshipDistribution: scholarshipData,
      programsByProvince: programsByProvinceData,
      summary: {
        total: universities?.length || 0,
        active: activeCount || 0,
        inactive: inactiveCount || 0,
        withScholarship: withScholarship || 0,
        withoutScholarship: withoutScholarship || 0
      }
    });
  } catch (error) {
    console.error('Get university stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
