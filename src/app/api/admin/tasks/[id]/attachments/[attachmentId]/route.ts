import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// DELETE /api/admin/tasks/[id]/attachments/[attachmentId] - Delete an attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const { id, attachmentId } = await params;

    // Get attachment info first
    const { data: attachment, error: fetchError } = await supabase
      .from('admin_task_attachments')
      .select('file_key')
      .eq('id', attachmentId)
      .eq('task_id', id)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Delete from S3 (if configured)
    try {
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

      const s3Client = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      });

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || '',
          Key: attachment.file_key,
        })
      );
    } catch (s3Error) {
      console.error('Failed to delete from S3:', s3Error);
      // Continue to delete from database even if S3 delete fails
    }

    // Delete from database
    const { error } = await supabase
      .from('admin_task_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('task_id', id);

    if (error) {
      console.error('Error deleting attachment:', error);
      return NextResponse.json(
        { error: 'Failed to delete attachment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Attachment DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
