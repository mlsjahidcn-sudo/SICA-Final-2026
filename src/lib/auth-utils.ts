import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  partner_id?: string;
  referred_by_partner_id?: string;
}

export async function verifyAuthToken(request: NextRequest): Promise<User | null> {
  try {
    console.log('=== verifyAuthToken called');
    
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'exists' : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format');
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    
    const supabase = getSupabaseClient(token);
    console.log('Supabase client with token created');

    // Verify the token with Supabase
    // Must pass the JWT explicitly since persistSession is false and client has no internal session
    console.log('Calling supabase.auth.getUser(token)');
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    console.log('getUser result - error:', error?.message, 'user:', !!authUser);

    if (error || !authUser) {
      console.log('getUser failed');
      return null;
    }

    console.log('User authenticated, constructing profile from JWT metadata for id:', authUser.id);
    
    // Try to get role from users table first (most reliable), then fall back to JWT metadata
    let role = authUser.user_metadata?.role;
    let fullName = authUser.user_metadata?.full_name;
    
    // Use service role client to avoid RLS issues when looking up user profile
    const serviceSupabase = getSupabaseClient();
    const { data: userProfile } = await serviceSupabase
      .from('users')
      .select('role, full_name, partner_id, referred_by_partner_id')
      .eq('id', authUser.id)
      .maybeSingle();
    
    if (userProfile) {
      role = userProfile.role;
      fullName = userProfile.full_name;
    }
    
    const user: User = {
      id: authUser.id,
      email: authUser.email!,
      role: role || 'student',
      full_name: fullName || authUser.email?.split('@')[0] || 'User',
      partner_id: userProfile?.partner_id || authUser.user_metadata?.partner_id,
      referred_by_partner_id: userProfile?.referred_by_partner_id || authUser.user_metadata?.referred_by_partner_id,
    };

    console.log('Returning constructed user with role:', user.role);
    return user;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

// Role-based authentication helpers
export function requireAuth(request: NextRequest): Promise<User | NextResponse> {
  return verifyAuthToken(request).then(user => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return user;
  });
}

export function requireRole(request: NextRequest, roles: string[]): Promise<User | NextResponse> {
  return verifyAuthToken(request).then(user => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!roles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return user;
  });
}

export function requireStudent(request: NextRequest): Promise<User | NextResponse> {
  return requireRole(request, ['student']);
}

export function requirePartner(request: NextRequest): Promise<User | NextResponse> {
  return requireRole(request, ['partner']);
}

export function requireAdmin(request: NextRequest): Promise<User | NextResponse> {
  return requireRole(request, ['admin']);
}

// Alias for requireAdmin - verifies user is admin
export const verifyAdmin = requireAdmin;

// Check if user owns a resource
export async function checkOwnership(
  request: NextRequest, 
  resourceType: 'application' | 'document' | 'meeting',
  resourceId: string
): Promise<{ user: User; isOwner: boolean } | NextResponse> {
  const user = await verifyAuthToken(request);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  let isOwner = false;

  switch (resourceType) {
    case 'application': {
      // applications.student_id references students.id, NOT users.id
      // So we need to look up the student record for this user first
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!studentRecord) {
        return { user, isOwner: false };
      }
      
      const { data } = await supabase
        .from('applications')
        .select('student_id')
        .eq('id', resourceId)
        .single();
      isOwner = data?.student_id === studentRecord.id;
      break;
    }
    case 'document': {
      // application_documents -> applications -> students -> users
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!studentRecord) {
        return { user, isOwner: false };
      }
      
      const { data } = await supabase
        .from('application_documents')
        .select('applications(student_id)')
        .eq('id', resourceId)
        .single();
      const appData = data?.applications as unknown as { student_id: string } | null;
      isOwner = appData?.student_id === studentRecord.id;
      break;
    }
    case 'meeting': {
      // meetings.student_id references users.id (FK: meetings_student_id_fkey -> users.id)
      const { data } = await supabase
        .from('meetings')
        .select('student_id')
        .eq('id', resourceId)
        .single();
      isOwner = data?.student_id === user.id;
      break;
    }
  }

  return { user, isOwner };
}
