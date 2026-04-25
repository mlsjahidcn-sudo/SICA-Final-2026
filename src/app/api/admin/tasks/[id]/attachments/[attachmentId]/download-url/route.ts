import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// GET /api/admin/tasks/[id]/attachments/[attachmentId]/download-url - Get download URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const { id, attachmentId } = await params;

    // Get attachment info
    const { data: attachment, error: fetchError } = await supabase
      .from('admin_task_attachments')
      .select('file_key, file_name, content_type')
      .eq('id', attachmentId)
      .eq('task_id', id)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check if S3 is configured
    const s3Configured = process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_BUCKET_NAME;

    if (!s3Configured) {
      // Fallback: Return a mock URL for development
      const downloadUrl = `/api/files/${attachment.file_key}`;
      return NextResponse.json({ downloadUrl });
    }

    // Try to generate presigned download URL
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

    const s3Client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: attachment.file_key,
      ResponseContentDisposition: `attachment; filename="${attachment.file_name}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error('Download URL GET error:', error);
    
    // Fallback on error
    return NextResponse.json({
      downloadUrl: `/api/files/fallback`,
    });
  }
}
