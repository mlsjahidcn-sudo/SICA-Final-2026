import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// Default settings for new users
const defaultSettings = {
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    meetingReminders: true,
    applicationUpdates: true,
    documentUpdates: true,
  },
  display: {
    language: 'en',
    timezone: 'Asia/Shanghai',
    dateFormat: 'MMM d, yyyy',
  },
  privacy: {
    profileVisibility: 'public',
    showContactInfo: false,
  },
};

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // Get user settings scoped to current user
    const { data: settingsData, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    if (!settingsData) {
      return NextResponse.json({ settings: defaultSettings });
    }

    // Map database columns to frontend settings format
    const settings = {
      notifications: {
        emailNotifications: settingsData.email_notifications ?? true,
        pushNotifications: settingsData.push_notifications ?? true,
        meetingReminders: settingsData.meeting_reminders ?? true,
        applicationUpdates: settingsData.application_updates ?? true,
        documentUpdates: settingsData.document_updates ?? true,
      },
      display: {
        language: settingsData.language || 'en',
        timezone: settingsData.timezone || 'Asia/Shanghai',
        dateFormat: settingsData.date_format || 'MMM d, yyyy',
      },
      privacy: {
        profileVisibility: settingsData.profile_visibility || 'public',
        showContactInfo: settingsData.show_contact_info ?? false,
      },
    };

    return NextResponse.json({ settings });

  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();

    // Map frontend settings format to database columns
    const dbData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.notifications) {
      if (body.notifications.emailNotifications !== undefined)
        dbData.email_notifications = body.notifications.emailNotifications;
      if (body.notifications.pushNotifications !== undefined)
        dbData.push_notifications = body.notifications.pushNotifications;
      if (body.notifications.meetingReminders !== undefined)
        dbData.meeting_reminders = body.notifications.meetingReminders;
      if (body.notifications.applicationUpdates !== undefined)
        dbData.application_updates = body.notifications.applicationUpdates;
      if (body.notifications.documentUpdates !== undefined)
        dbData.document_updates = body.notifications.documentUpdates;
    }

    if (body.display) {
      if (body.display.language !== undefined)
        dbData.language = body.display.language;
      if (body.display.timezone !== undefined)
        dbData.timezone = body.display.timezone;
      if (body.display.dateFormat !== undefined)
        dbData.date_format = body.display.dateFormat;
    }

    if (body.privacy) {
      if (body.privacy.profileVisibility !== undefined)
        dbData.profile_visibility = body.privacy.profileVisibility;
      if (body.privacy.showContactInfo !== undefined)
        dbData.show_contact_info = body.privacy.showContactInfo;
    }

    // Check if user_settings exists for this user
    const { data: existing, error: checkError } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking settings:', checkError);
      return NextResponse.json({ error: 'Failed to check settings' }, { status: 500 });
    }

    let error;
    if (existing) {
      // Update existing settings for this user
      const result = await supabase
        .from('user_settings')
        .update(dbData)
        .eq('id', existing.id)
        .eq('user_id', user.id);
      error = result.error;
    } else {
      // Insert new settings for this user
      const result = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          ...dbData,
        });
      error = result.error;
    }

    if (error) {
      console.error('Error saving settings:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Settings PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
