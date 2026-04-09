import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Get user settings
    const { data: settingsData, error } = await supabase
      .from('user_settings')
      .select('settings')
      .limit(1)
      .single();
    
    // Default settings
    const defaultSettings = {
      notifications: {
        emailNotifications: true,
        meetingReminders: true,
        applicationUpdates: true,
        documentRequests: true,
      },
      display: {
        language: 'en',
        timezone: 'Asia/Shanghai',
        dateFormat: 'MM/DD/YYYY',
      },
    };
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
    
    return NextResponse.json({
      settings: settingsData?.settings || defaultSettings,
    });
    
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    // Check if user_settings exists
    const { data: existing, error: checkError } = await supabase
      .from('user_settings')
      .select('id')
      .limit(1)
      .single();
    
    let error;
    if (existing) {
      // Update existing
      const result = await supabase
        .from('user_settings')
        .update({
          settings: body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      error = result.error;
    } else {
      // Insert new - we need a user_id, for now use a placeholder
      // In production, this would come from auth
      const result = await supabase
        .from('user_settings')
        .insert({
          settings: body,
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
