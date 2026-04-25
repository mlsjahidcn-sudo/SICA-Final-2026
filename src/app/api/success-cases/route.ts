import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { apiCache, CACHE_TTL, withTimeout } from '@/lib/api-cache';

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
    const minimal = searchParams.get('minimal') === 'true'; // Skip unused URLs for performance
    const offset = (page - 1) * limit;

    // Generate cache key for this query
    const cacheKey = `success-cases:${featured}:${year || 'all'}:${page}:${limit}:${minimal}`;
    
    // Check cache first (only for featured cases on first page)
    if (featured && page === 1) {
      const cached = apiCache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

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

    const { data: cases, error, count } = await withTimeout(
      query,
      5000,
      'Success cases query timed out'
    );

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
    // Optimize by batch generating all URLs at once, skip unused if minimal=true
    const casesWithUrls = await Promise.all(
      (cases || []).map(async (caseItem) => {
        // Collect all paths that need signed URLs
        const pathsToSign: string[] = [];
        const pathMapping: { [key: string]: string } = {};
        
        // Always include admission_notice_url
        if (caseItem.admission_notice_url) {
          pathsToSign.push(caseItem.admission_notice_url);
          pathMapping[caseItem.admission_notice_url] = 'admission_notice';
        }
        
        // Only include other URLs if not in minimal mode
        if (!minimal) {
          if (caseItem.jw202_url) {
            pathsToSign.push(caseItem.jw202_url);
            pathMapping[caseItem.jw202_url] = 'jw202';
          }
          if (caseItem.student_photo_url) {
            pathsToSign.push(caseItem.student_photo_url);
            pathMapping[caseItem.student_photo_url] = 'student_photo';
          }
        }

        // Batch generate signed URLs (single API call for all paths)
        let admission_notice_signed_url = null;
        let jw202_signed_url = null;
        let student_photo_signed_url = null;

        if (pathsToSign.length > 0) {
          const { data: signedUrls } = await supabase.storage
            .from('success-cases')
            .createSignedUrls(pathsToSign, 3600);

          if (signedUrls) {
            signedUrls.forEach((item, index) => {
              const path = pathsToSign[index];
              const type = pathMapping[path];
              if (item.signedUrl) {
                if (type === 'admission_notice') admission_notice_signed_url = item.signedUrl;
                else if (type === 'jw202') jw202_signed_url = item.signedUrl;
                else if (type === 'student_photo') student_photo_signed_url = item.signedUrl;
              }
            });
          }
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

    const response = {
      success_cases: casesWithUrls,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    // Cache the response for featured cases on first page (5 minutes)
    if (featured && page === 1) {
      apiCache.set(cacheKey, response, CACHE_TTL.LONG);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in success-cases GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
