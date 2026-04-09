import { NextRequest, NextResponse } from 'next/server';

// Default platform settings
const DEFAULT_SETTINGS = {
  general: {
    site_name: 'Study In China Academy',
    site_description: 'Your gateway to studying in China',
    contact_email: 'contact@sica.edu',
    support_email: 'support@sica.edu',
  },
  notifications: {
    notification_enabled: true,
    email_notifications: true,
  },
  security: {
    maintenance_mode: false,
    allow_registration: true,
  },
  applications: {
    default_application_status: 'submitted',
  },
};

// In-memory settings storage (will reset on server restart)
let platformSettings = { ...DEFAULT_SETTINGS };

// GET /api/admin/settings - Get all platform settings
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ settings: platformSettings });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/settings - Update platform settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Update settings
    if (body.site_name !== undefined || body.site_description !== undefined || body.contact_email !== undefined || body.support_email !== undefined) {
      platformSettings.general = {
        site_name: body.site_name || platformSettings.general.site_name,
        site_description: body.site_description || platformSettings.general.site_description,
        contact_email: body.contact_email || platformSettings.general.contact_email,
        support_email: body.support_email || platformSettings.general.support_email,
      };
    }
    
    if (body.notification_enabled !== undefined || body.email_notifications !== undefined) {
      platformSettings.notifications = {
        notification_enabled: body.notification_enabled ?? platformSettings.notifications.notification_enabled,
        email_notifications: body.email_notifications ?? platformSettings.notifications.email_notifications,
      };
    }
    
    if (body.maintenance_mode !== undefined || body.allow_registration !== undefined) {
      platformSettings.security = {
        maintenance_mode: body.maintenance_mode ?? platformSettings.security.maintenance_mode,
        allow_registration: body.allow_registration ?? platformSettings.security.allow_registration,
      };
    }
    
    if (body.default_application_status !== undefined) {
      platformSettings.applications = {
        default_application_status: body.default_application_status || platformSettings.applications.default_application_status,
      };
    }
    
    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: platformSettings,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
