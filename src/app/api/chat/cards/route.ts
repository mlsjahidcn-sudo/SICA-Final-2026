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
  studentCount: number | null;
  logoUrl: string | null;
}

interface ProgramCardData {
  id: string;
  name: string;
  nameCn: string | null;
  degree: string | null;
  major: string | null;
  universityName: string | null;
  universityId: string | null;
  language: string | null;
  duration: string | null;
  durationMonths: number | null;
  tuition: number | null;
  currency: string;
  scholarshipAvailable: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { universities: universityIds, programs: programIds } = body;

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
          student_count,
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
          studentCount: u.student_count ? Number(u.student_count) : null,
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
          name_en,
          name_cn,
          degree_type,
          major,
          teaching_language,
          duration_months,
          tuition,
          tuition_currency,
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
            name: String(p.name_en || 'Unknown Program'),
            nameCn: p.name_cn ? String(p.name_cn) : null,
            degree: p.degree_type ? String(p.degree_type) : null,
            major: p.major ? String(p.major) : null,
            universityName: uniData?.name_en ? String(uniData.name_en) : null,
            universityId: p.university_id ? String(p.university_id) : null,
            language: p.teaching_language ? String(p.teaching_language) : null,
            duration: p.duration_months ? `${p.duration_months} months` : null,
            durationMonths: p.duration_months ? Number(p.duration_months) : null,
            tuition: p.tuition ? Number(p.tuition) : null,
            currency: String(p.tuition_currency || 'CNY'),
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
