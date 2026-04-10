import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

interface ProfileResponse {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  company_name: string | null;
  position: string | null;
  address: string | null;
  website: string | null;
}

// Helper to convert empty string to null
const emptyToNull = (val: string | null | undefined): string | null => {
  if (val === '' || val === undefined) return null;
  return val;
};

// Add cache-busting headers to response
const addNoCacheHeaders = (response: NextResponse): NextResponse => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
};

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    
    // Get user basic info from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, phone, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    
    if (userError) {
      console.error('[GET /api/partner/profile] Error fetching user:', userError);
      return addNoCacheHeaders(NextResponse.json({ error: 'Failed to fetch profile', details: userError.message }, { status: 500 }));
    }
    
    if (!userData) {
      console.error('[GET /api/partner/profile] No user found for ID:', user.id);
      return addNoCacheHeaders(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }
    
    // Get partner profile extension from partners table
    const { data: partnerProfile, error: profileError } = await supabase
      .from('partners')
      .select('company_name, contact_person, company_address, website')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.log('[GET /api/partner/profile] Partner profile error:', profileError);
    }
    
    // Map DB columns to API response fields
    const profile: ProfileResponse = {
      id: userData.id,
      full_name: userData.full_name || '',
      email: userData.email || '',
      phone: userData.phone,
      avatar_url: userData.avatar_url,
      company_name: partnerProfile?.company_name || null,
      position: partnerProfile?.contact_person || null,
      address: partnerProfile?.company_address || null,
      website: partnerProfile?.website || null,
    };
    
    return addNoCacheHeaders(NextResponse.json({ profile }));
    
  } catch (error) {
    console.error('[GET /api/partner/profile] Error:', error);
    return addNoCacheHeaders(NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 }));
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    
    // Update user basic info
    const userUpdateData = {
      full_name: emptyToNull(body.full_name),
      email: emptyToNull(body.email),
      phone: emptyToNull(body.phone),
      avatar_url: emptyToNull(body.avatar_url),
      updated_at: new Date().toISOString(),
    };
    
    const { error: updateUserError } = await supabase
      .from('users')
      .update(userUpdateData)
      .eq('id', user.id);
    
    if (updateUserError) {
      console.error('[PUT /api/partner/profile] Error updating user:', updateUserError);
      return addNoCacheHeaders(NextResponse.json({ error: 'Failed to update user profile', details: updateUserError.message }, { status: 500 }));
    }
    
    // Update or create partner profile in partners table
    const { data: existingProfile, error: findError } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (findError) {
      console.log('[PUT /api/partner/profile] Find error:', findError);
    }
    
    const profileData: Record<string, unknown> = {
      company_name: emptyToNull(body.company_name),
      contact_person: emptyToNull(body.position),
      company_address: emptyToNull(body.address),
      website: emptyToNull(body.website),
      updated_at: new Date().toISOString(),
    };
    
    let profileError;
    if (existingProfile) {
      const result = await supabase
        .from('partners')
        .update(profileData)
        .eq('id', existingProfile.id);
      profileError = result.error;
    } else {
      const result = await supabase
        .from('partners')
        .insert({ ...profileData, user_id: user.id });
      profileError = result.error;
    }
    
    if (profileError) {
      return addNoCacheHeaders(NextResponse.json({ 
        success: true, 
        warning: 'User profile updated but partner details failed to save',
        partnerError: profileError.message,
      }));
    }
    
    // Fetch the actual saved data from the database to return
    const { data: savedUser } = await supabase
      .from('users')
      .select('id, full_name, email, phone, avatar_url')
      .eq('id', user.id)
      .single();
    
    const { data: savedPartner } = await supabase
      .from('partners')
      .select('company_name, contact_person, company_address, website')
      .eq('user_id', user.id)
      .single();
    
    const updatedProfile: ProfileResponse = {
      id: user.id,
      full_name: savedUser?.full_name || '',
      email: savedUser?.email || '',
      phone: savedUser?.phone,
      avatar_url: savedUser?.avatar_url,
      company_name: savedPartner?.company_name || null,
      position: savedPartner?.contact_person || null,
      address: savedPartner?.company_address || null,
      website: savedPartner?.website || null,
    };
    
    return addNoCacheHeaders(NextResponse.json({ success: true, profile: updatedProfile }));
    
  } catch (error) {
    console.error('[PUT /api/partner/profile] Error:', error);
    return addNoCacheHeaders(NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 }));
  }
}
