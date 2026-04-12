import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET - Get signed URL for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Get document with application info - only select columns that exist
    const { data: doc, error: docError } = await supabase
      .from('application_documents')
      .select(`
        id,
        file_key,
        file_name,
        content_type,
        applications!inner(student_id, partner_id)
      `)
      .eq('id', id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const application = doc.applications as any;
    let isOwner = false;
    if (authUser.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      isOwner = studentRecord?.id === application.student_id;
    } else if (authUser.role === 'partner') {
      // applications.partner_id stores users.id
      isOwner = application.partner_id === authUser.id;
    }

    if (!isOwner && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get signed URL from Supabase Storage
    let url = null;
    if (doc.file_key) {
      // Try signed URL first (works for private buckets)
      const { data: signedUrlData } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(doc.file_key, 3600); // 1 hour

      if (signedUrlData?.signedUrl) {
        url = signedUrlData.signedUrl;
      } else {
        // Fallback to public URL
        const { data: urlData } = supabase
          .storage
          .from('documents')
          .getPublicUrl(doc.file_key);
        url = urlData?.publicUrl || null;
      }
    }

    if (!url) {
      return NextResponse.json({ error: 'File not available' }, { status: 404 });
    }

    return NextResponse.json({ 
      url,
      file_name: doc.file_name,
      content_type: doc.content_type
    });
  } catch (error) {
    console.error('Error generating URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
