import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UniversityCardData {
  id: string;
  name: string;
  nameCn: string | null;
  city: string | null;
  province: string | null;
  ranking: number | null;
  types: string[];
  tuitionMin: number | null;
  tuitionMax: number | null;
  currency: string;
  logoUrl: string | null;
}

interface ProgramCardData {
  id: string;
  name: string;
  degree: string | null;
  category: string | null;
  universityName: string | null;
  universityId: string | null;
  language: string | null;
  duration: string | null;
  durationYears: number | null;
  tuition: number | null;
  currency: string;
  scholarshipAvailable: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const universityIds = body.universities || body.universityIds;
    const programIds = body.programs || body.programIds;

    const results: {
      universities: UniversityCardData[];
      programs: ProgramCardData[];
    } = {
      universities: [],
      programs: [],
    };

    const supabase = getSupabaseClient();

    // Fetch universities
    if (universityIds && universityIds.length > 0) {
      const { data: universities, error: uniError } = await supabase
        .from('universities')
        .select(`
          id,
          name_en,
          name_cn,
          city,
          province,
          ranking_national,
          type,
          tuition_min,
          tuition_max,
          tuition_currency,
          logo_url
        `)
        .in('id', universityIds)
        .limit(5);

      if (!uniError && universities) {
        results.universities = universities.map((u) => ({
          id: String(u.id || ''),
          name: String(u.name_en || 'Unknown University'),
          nameCn: u.name_cn ? String(u.name_cn) : null,
          city: u.city ? String(u.city) : null,
          province: u.province ? String(u.province) : null,
          ranking: u.ranking_national ? Number(u.ranking_national) : null,
          types: Array.isArray(u.type) ? u.type as string[] : (u.type ? [String(u.type)] : []),
          tuitionMin: u.tuition_min ? Number(u.tuition_min) : null,
          tuitionMax: u.tuition_max ? Number(u.tuition_max) : null,
          currency: String(u.tuition_currency || 'CNY'),
          logoUrl: u.logo_url ? String(u.logo_url) : null,
        }));
      }
    }

    // Fetch programs
    if (programIds && programIds.length > 0) {
      const { data: programs, error: progError } = await supabase
        .from('programs')
        .select(`
          id,
          name,
          degree_level,
          category,
          language,
          duration_years,
          tuition_fee_per_year,
          currency,
          scholarship_available,
          university_id,
          universities!programs_university_id_fkey (
            name_en
          )
        `)
        .in('id', programIds)
        .limit(5);

      if (!progError && programs) {
        results.programs = programs.map((p) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const uniData = (p as any).universities as { name_en?: string } | null;
          return {
            id: String(p.id || ''),
            name: String(p.name || 'Unknown Program'),
            degree: p.degree_level ? String(p.degree_level) : null,
            category: p.category ? String(p.category) : null,
            universityName: uniData?.name_en ? String(uniData.name_en) : null,
            universityId: p.university_id ? String(p.university_id) : null,
            language: p.language ? String(p.language) : null,
            duration: p.duration_years ? `${p.duration_years} years` : null,
            durationYears: p.duration_years ? Number(p.duration_years) : null,
            tuition: p.tuition_fee_per_year ? Number(p.tuition_fee_per_year) : null,
            currency: String(p.currency || 'CNY'),
            scholarshipAvailable: Boolean(p.scholarship_available),
          };
        });
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Card data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card data' },
      { status: 500 }
    );
  }
}
