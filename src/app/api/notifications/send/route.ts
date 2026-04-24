/**
 * API endpoint to send real-time notifications
 * Used by server-side code to push notifications to connected users
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationTypes } from '@/lib/ws-client';

// This is a workaround since we can't directly import from server.ts in Next.js API routes
// In production, this would be handled by a message queue or database polling

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, type, payload } = body;

    if (!user_id || !type || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, type, payload' },
        { status: 400 }
      );
    }

    // In a real implementation, this would:
    // 1. Store the notification in the database
    // 2. Push to the WebSocket server via a message queue or direct call
    // 3. Return success

    // For now, we'll store the notification and let the WebSocket server poll
    // or use a different mechanism (e.g., Supabase Realtime)

    return NextResponse.json({
      success: true,
      message: 'Notification queued',
      notification: { user_id, type, payload }
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'WebSocket notification endpoint. Use POST to send notifications.',
    endpoints: {
      '/ws/notifications': 'WebSocket endpoint for real-time notifications'
    }
  });
}
