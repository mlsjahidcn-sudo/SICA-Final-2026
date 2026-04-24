import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import { createRateLimitMiddleware, rateLimitPresets } from '@/lib/rate-limit';
import { errors } from '@/lib/api-response';

const exportRateLimit = createRateLimitMiddleware(rateLimitPresets.export);

// Type for university with programs count
type UniversityWithProgramCount = {
  id: string;
  name_en: string | null;
  name_cn: string | null;
  short_name: string | null;
  province: string;
  city: string;
  type: string;
  category: string;
  ranking_national: number | null;
  scholarship_available: boolean;
  is_active: boolean;
  view_count: number;
  created_at: string;
  programs: { count: number }[];
};

// GET - Export universities data
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = exportRateLimit(request);
    if (!rateLimitResult.allowed) {
      return errors.rateLimit(rateLimitResult.resetTime);
    }

    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Get all universities with program counts
    const { data: universities, error } = await supabase
      .from('universities')
      .select('*, programs(count)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform data
    const transformedData = universities?.map(uni => ({
      id: uni.id,
      name_en: uni.name_en,
      name_cn: uni.name_cn,
      short_name: uni.short_name,
      province: uni.province,
      city: uni.city,
      type: uni.type,
      category: uni.category,
      ranking_national: uni.ranking_national,
      scholarship_available: uni.scholarship_available,
      is_active: uni.is_active,
      view_count: uni.view_count,
      programs_count: (uni as UniversityWithProgramCount).programs?.[0]?.count || 0,
      created_at: uni.created_at,
    })) || [];

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID', 'Name (EN)', 'Name (CN)', 'Short Name', 'Province', 'City',
        'Type', 'Category', 'National Ranking', 'Scholarship Available',
        'Active', 'View Count', 'Programs Count', 'Created At'
      ];
      
      const csvRows = [
        headers.join(','),
        ...transformedData.map(uni => [
          `"${uni.id}"`,
          `"${(uni.name_en || '').replace(/"/g, '""')}"`,
          `"${(uni.name_cn || '').replace(/"/g, '""')}"`,
          `"${(uni.short_name || '').replace(/"/g, '""')}"`,
          `"${uni.province}"`,
          `"${uni.city}"`,
          `"${Array.isArray(uni.type) ? uni.type.join('; ') : uni.type || ''}"`,
          `"${uni.category || ''}"`,
          uni.ranking_national || '',
          uni.scholarship_available ? 'Yes' : 'No',
          uni.is_active ? 'Yes' : 'No',
          uni.view_count,
          uni.programs_count,
          `"${new Date(uni.created_at).toISOString()}"`
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="universities-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON by default
    return new NextResponse(JSON.stringify(transformedData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="universities-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    console.error('Export universities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
