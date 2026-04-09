import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Get user basic info - using first partner user for demo
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, phone, avatar_url')
      .eq('role', 'partner')
      .limit(1)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
    
    // Get partner profile extension
    const { data: partnerProfile, error: profileError } = await supabase
      .from('partner_profiles')
      .select('company_name, position, address, website')
      .eq('user_id', user.id)
      .single();
    
    // Ignore error if no profile exists yet
    const profile: ProfileResponse = {
      id: user.id,
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone,
      avatar_url: user.avatar_url,
      company_name: partnerProfile?.company_name || null,
      position: partnerProfile?.position || null,
      address: partnerProfile?.address || null,
      website: partnerProfile?.website || null,
    };
    
    return NextResponse.json({ profile });
    
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'partner')
      .limit(1)
      .single();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update user basic info
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        avatar_url: body.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (updateUserError) {
      console.error('Error updating user:', updateUserError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
    
    // Update or create partner profile
    const { data: existingProfile } = await supabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    const profileData = {
      user_id: user.id,
      company_name: body.company_name,
      position: body.position,
      address: body.address,
      website: body.website,
      updated_at: new Date().toISOString(),
    };
    
    let profileError;
    if (existingProfile) {
      const result = await supabase
        .from('partner_profiles')
        .update(profileData)
        .eq('id', existingProfile.id);
      profileError = result.error;
    } else {
      const result = await supabase
        .from('partner_profiles')
        .insert(profileData);
      profileError = result.error;
    }
    
    if (profileError) {
      console.error('Error updating partner profile:', profileError);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Profile PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
