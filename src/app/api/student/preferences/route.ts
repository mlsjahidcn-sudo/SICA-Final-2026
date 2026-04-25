import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();

    // Get user preferences from user_metadata or a separate table
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      // Return default preferences if user not found
      return NextResponse.json({
        preferences: {
          application_updates: true,
          meeting_reminders: true,
          document_requests: true,
          promotional_emails: false,
          weekly_digest: true,
        },
      });
    }

    const preferences = userProfile?.metadata?.notificationPreferences || {
      application_updates: true,
      meeting_reminders: true,
      document_requests: true,
      promotional_emails: false,
      weekly_digest: true,
    };

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error in preferences GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/student/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Get current user metadata
    const { data: currentUser } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single();

    const currentMetadata = currentUser?.metadata || {};

    // Update user metadata with new preferences
    const { error } = await supabase
      .from('users')
      .update({
        metadata: {
          ...currentMetadata,
          notificationPreferences: preferences,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences,
    });
  } catch (error) {
    console.error('Error in preferences PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
