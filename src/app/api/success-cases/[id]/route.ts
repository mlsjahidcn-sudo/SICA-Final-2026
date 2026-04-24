import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET /api/success-cases/[id]
 * Public endpoint to fetch a single published success case by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    // Fetch the case - only published cases are accessible
    const { data: caseItem, error } = await supabase
      .from('success_cases')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Success case not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching success case:', error);
      return NextResponse.json(
        { error: 'Failed to fetch success case' },
        { status: 500 }
      );
    }

    if (!caseItem) {
      return NextResponse.json(
        { error: 'Success case not found' },
        { status: 404 }
      );
    }

    // Generate signed URLs for documents (1 hour expiry)
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

    return NextResponse.json({
      success_case: {
        ...caseItem,
        admission_notice_signed_url,
        jw202_signed_url,
        student_photo_signed_url,
      },
    });
  } catch (error) {
    console.error('Error in success-cases/[id] GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
