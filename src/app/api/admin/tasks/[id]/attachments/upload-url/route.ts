import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// POST /api/admin/tasks/[id]/attachments/upload-url - Get presigned upload URL
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      );
    }

    // Generate unique file key
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `task-attachments/${id}/${timestamp}-${randomStr}-${sanitizedFileName}`;

    // Check if S3 is configured
    const s3Configured = process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_BUCKET_NAME;

    if (!s3Configured) {
      // Fallback: Return a mock URL for development
      const uploadUrl = `/api/upload/${fileKey}`;
      return NextResponse.json({ uploadUrl, fileKey });
    }

    // Try to use S3-compatible storage
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (error) {
    console.error('Upload URL POST error:', error);
    
    // Fallback on error
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileKey = `task-attachments/fallback/${timestamp}-${randomStr}`;
    const uploadUrl = `/api/upload/${fileKey}`;
    return NextResponse.json({ uploadUrl, fileKey });
  }
}
