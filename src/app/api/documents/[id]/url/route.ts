import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET - Get URL for a document
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

    // Get document with application info
    const { data: doc, error: docError } = await supabase
      .from('application_documents')
      .select(`
        id,
        file_key,
        file_url,
        file_name,
        content_type,
        applications!inner(student_id, partner_id)
      `)
      .eq('id', id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify access - user must own the application or be admin/partner
    // applications.student_id references students.id, NOT users.id
    // applications.partner_id references partners.id, NOT users.id
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
    }
    const isAdmin = authUser.role === 'admin';
    let isPartner = false;
    if (authUser.role === 'partner') {
      const { data: partnerRecord } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      isPartner = partnerRecord?.id === application.partner_id;
    }

    if (!isOwner && !isAdmin && !isPartner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get URL from Supabase Storage
    let url = null;
    if (doc.file_key) {
      const { data: urlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(doc.file_key);
      url = urlData?.publicUrl || null;
    } else if (doc.file_url) {
      // Fallback to legacy file_url
      url = doc.file_url;
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
