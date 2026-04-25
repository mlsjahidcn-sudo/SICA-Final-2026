import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// Default settings for new users
const DEFAULT_SETTINGS = {
  email_notifications: true,
  push_notifications: true,
  meeting_reminders: true,
  application_updates: true,
  document_updates: true,
  language: 'en',
  timezone: 'Asia/Shanghai',
  date_format: 'MMM d, yyyy',
  profile_visibility: 'public',
  show_contact_info: false,
};

// GET - Get user settings
export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({ 
        settings: { ...DEFAULT_SETTINGS, user_id: authUser.id },
        isDefault: true
      });
    }

    return NextResponse.json({ settings, isDefault: false });
  } catch (error) {
    console.error('Error in settings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getSupabaseClient();

    // Validate settings
    const validFields = [
      'email_notifications',
      'push_notifications',
      'meeting_reminders',
      'application_updates',
      'document_updates',
      'language',
      'timezone',
      'date_format',
      'profile_visibility',
      'show_contact_info',
    ];

    const updateData: Record<string, unknown> = {
      user_id: authUser.id,
      updated_at: new Date().toISOString(),
    };

    for (const field of validFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate profile_visibility
    if (updateData.profile_visibility && 
        !['public', 'partners_only', 'private'].includes(updateData.profile_visibility as string)) {
      return NextResponse.json({ 
        error: 'Invalid profile_visibility. Must be: public, partners_only, or private' 
      }, { status: 400 });
    }

    // Validate language
    if (updateData.language && !['en', 'zh'].includes(updateData.language as string)) {
      return NextResponse.json({ 
        error: 'Invalid language. Must be: en or zh' 
      }, { status: 400 });
    }

    // Upsert settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert(updateData, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      settings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error in settings PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Partial update of user settings
export async function PATCH(request: NextRequest) {
  return PUT(request);
}
