import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * POST /api/student/claim
 * Allows an orphan student (no user account) to claim their account
 * 
 * Request body:
 * - email: string
 * - password: string
 * - full_name: string
 * - student_id: string (the orphan student record to claim)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, student_id } = await request.json();

    // Validate required fields
    if (!email || !password || !full_name || !student_id) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name, and student_id are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 1. Check if email already exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return NextResponse.json(
        { error: 'Failed to verify email availability' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 400 }
      );
    }

    // 2. Verify the student record exists and is orphan (user_id IS NULL)
    const { data: studentRecord, error: studentError } = await supabase
      .from('students')
      .select('id, user_id, admin_notes')
      .eq('id', student_id)
      .is('user_id', null)
      .maybeSingle();

    if (studentError) {
      console.error('Error checking student record:', studentError);
      return NextResponse.json(
        { error: 'Failed to verify student record' },
        { status: 500 }
      );
    }

    if (!studentRecord) {
      return NextResponse.json(
        { error: 'Student record not found or already has an account' },
        { status: 404 }
      );
    }

    // 3. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name,
          role: 'student',
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/login`,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // 4. Create user profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: full_name,
        role: 'student',
        approval_status: 'approved',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Attempt to clean up auth user (best effort)
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // 5. Link the student record to the new user
    const { error: updateError } = await supabase
      .from('students')
      .update({
        user_id: authData.user.id,
        admin_notes: studentRecord.admin_notes 
          ? `${studentRecord.admin_notes} | Account claimed by ${full_name} (${email})`
          : `Account claimed by ${full_name} (${email})`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', student_id);

    if (updateError) {
      console.error('Error linking student record:', updateError);
      // This is critical - we have a user but no student link
      // Log this for manual intervention
      return NextResponse.json({
        success: true,
        warning: 'Account created but failed to link student record. Please contact support.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: full_name,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account claimed successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: full_name,
      },
    });
  } catch (error) {
    console.error('Claim account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
