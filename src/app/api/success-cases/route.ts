import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET /api/success-cases
 * Public endpoint to fetch published success cases
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 12)
 * - featured: Filter featured cases only (optional)
 * - year: Filter by admission year (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const featured = searchParams.get('featured') === 'true';
    const year = searchParams.get('year');
    const offset = (page - 1) * limit;

    // Build query - only fetch published cases
    let query = supabase
      .from('success_cases')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (featured) {
      query = query.eq('is_featured', true);
    }

    if (year) {
      query = query.eq('admission_year', parseInt(year));
    }

    const { data: cases, error, count } = await query;

    if (error) {
      console.error('Error fetching success cases:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch success cases',
          details: error.message,
          code: error.code,
          hint: error.code === 'PGRST204' ? 'Table does not exist. Please run the migration first.' : undefined
        },
        { status: 500 }
      );
    }

    // Generate signed URLs for documents (1 hour expiry)
    const casesWithUrls = await Promise.all(
      (cases || []).map(async (caseItem) => {
        let admission_notice_signed_url = null;
        let jw202_signed_url = null;
        let student_photo_signed_url = null;

        // Generate signed URL for admission notice
        if (caseItem.admission_notice_url) {
          const { data } = await supabase.storage
            .from('success-cases')
            .createSignedUrl(caseItem.admission_notice_url, 3600);
          admission_notice_signed_url = data?.signedUrl || null;
        }

        // Generate signed URL for JW202
        if (caseItem.jw202_url) {
          const { data } = await supabase.storage
            .from('success-cases')
            .createSignedUrl(caseItem.jw202_url, 3600);
          jw202_signed_url = data?.signedUrl || null;
        }

        // Generate signed URL for student photo
        if (caseItem.student_photo_url) {
          const { data } = await supabase.storage
            .from('success-cases')
            .createSignedUrl(caseItem.student_photo_url, 3600);
          student_photo_signed_url = data?.signedUrl || null;
        }

        return {
          ...caseItem,
          admission_notice_signed_url,
          jw202_signed_url,
          student_photo_signed_url,
        };
      })
    );

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success_cases: casesWithUrls,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error in success-cases GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
