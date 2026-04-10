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

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GET /api/partner/profile] User ID:', user.id);

    const supabase = getSupabaseClient();
    
    // Get user basic info from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, phone, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    
    if (userError) {
      console.error('[GET /api/partner/profile] Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch profile', details: userError.message }, { status: 500 });
    }
    
    if (!userData) {
      console.error('[GET /api/partner/profile] No user found for ID:', user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('[GET /api/partner/profile] User data:', userData);
    
    // Get partner profile extension from partners table
    // Note: partners table has company_address (not address) and contact_person (not position)
    const { data: partnerProfile, error: profileError } = await supabase
      .from('partners')
      .select('company_name, contact_person, company_address, website')
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log('[GET /api/partner/profile] Partner profile:', partnerProfile);
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
      position: partnerProfile?.contact_person || null, // contact_person maps to position
      address: partnerProfile?.company_address || null,  // company_address maps to address
      website: partnerProfile?.website || null,
    };
    
    return NextResponse.json({ profile });
    
  } catch (error) {
    console.error('[GET /api/partner/profile] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[PUT /api/partner/profile] User ID:', user.id);

    const supabase = getSupabaseClient();
    const body = await request.json();
    
    console.log('[PUT /api/partner/profile] Request body:', JSON.stringify(body));
    
    // Update user basic info
    const userUpdateData = {
      full_name: emptyToNull(body.full_name),
      email: emptyToNull(body.email),
      phone: emptyToNull(body.phone),
      avatar_url: emptyToNull(body.avatar_url),
      updated_at: new Date().toISOString(),
    };
    
    console.log('[PUT /api/partner/profile] Updating user with:', JSON.stringify(userUpdateData));
    
    const { error: updateUserError } = await supabase
      .from('users')
      .update(userUpdateData)
      .eq('id', user.id);
    
    if (updateUserError) {
      console.error('[PUT /api/partner/profile] Error updating user:', updateUserError);
      return NextResponse.json({ error: 'Failed to update user profile', details: updateUserError.message }, { status: 500 });
    }
    
    console.log('[PUT /api/partner/profile] User updated successfully');
    
    // Update or create partner profile in partners table
    // Map API fields to DB columns:
    //   position → contact_person
    //   address → company_address
    const { data: existingProfile, error: findError } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log('[PUT /api/partner/profile] Existing partner:', existingProfile);
    if (findError) {
      console.log('[PUT /api/partner/profile] Find error:', findError);
    }
    
    const profileData: Record<string, unknown> = {
      company_name: emptyToNull(body.company_name),
      contact_person: emptyToNull(body.position), // position maps to contact_person
      company_address: emptyToNull(body.address),  // address maps to company_address
      website: emptyToNull(body.website),
      updated_at: new Date().toISOString(),
    };
    
    console.log('[PUT /api/partner/profile] Profile data to save:', JSON.stringify(profileData));
    
    let profileError;
    let savedProfile;
    
    if (existingProfile) {
      console.log('[PUT /api/partner/profile] Updating existing partner, id:', existingProfile.id);
      const result = await supabase
        .from('partners')
        .update(profileData)
        .eq('id', existingProfile.id)
        .select()
        .single();
      profileError = result.error;
      savedProfile = result.data;
    } else {
      console.log('[PUT /api/partner/profile] Inserting new partner');
      const result = await supabase
        .from('partners')
        .insert({ ...profileData, user_id: user.id })
        .select()
        .single();
      profileError = result.error;
      savedProfile = result.data;
    }
    
    if (profileError) {
      console.error('[PUT /api/partner/profile] Error saving partner profile:', profileError);
      // Still return success for user update, but warn about partner profile
      return NextResponse.json({ 
        success: true, 
        warning: 'User profile updated but partner details failed to save',
        partnerError: profileError.message,
      });
    }
    
    console.log('[PUT /api/partner/profile] Partner profile saved successfully:', savedProfile);
    
    // Return the updated profile so frontend can refresh
    const updatedProfile: ProfileResponse = {
      id: user.id,
      full_name: body.full_name || '',
      email: body.email || '',
      phone: emptyToNull(body.phone),
      avatar_url: emptyToNull(body.avatar_url),
      company_name: emptyToNull(body.company_name),
      position: emptyToNull(body.position),
      address: emptyToNull(body.address),
      website: emptyToNull(body.website),
    };
    
    return NextResponse.json({ success: true, profile: updatedProfile });
    
  } catch (error) {
    console.error('[PUT /api/partner/profile] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
