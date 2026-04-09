import { NextRequest, NextResponse } from 'next/server';
import { requireStudent } from '@/lib/auth-utils';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { calculateProfileCompletion, STUDENT_SAFE_COLUMNS } from '@/lib/profile-completion';

// JSONB array fields that need array validation
const JSONB_ARRAY_FIELDS = new Set(['work_experience', 'education_history', 'family_members', 'extracurricular_activities', 'awards', 'publications', 'research_experience']);

// JSONB object fields (single objects, not arrays)
const JSONB_OBJECT_FIELDS = new Set(['scholarship_application', 'financial_guarantee']);

// Numeric fields that need number validation
const NUMERIC_FIELDS = new Set(['hsk_level', 'hsk_score', 'toefl_score']);

// Enum fields with allowed values
const ENUM_FIELDS: Record<string, string[]> = {
  marital_status: ['single', 'married', 'divorced', 'widowed'],
  study_mode: ['full_time', 'part_time'],
  funding_source: ['self_funded', 'csc_scholarship', 'university_scholarship', 'government_scholarship', 'other'],
};

export async function GET(request: NextRequest) {
  const authResult = await requireStudent(request);
  if ('headers' in authResult) {
    return authResult;
  }

  const userId = authResult.id;
  const supabase = getSupabaseClient(); // Service role key, bypasses RLS

  try {
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Get student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Transform to the format the frontend expects
    const profileData = {
      user: {
        id: userId,
        email: authResult.email,
        full_name: user?.full_name || authResult.full_name || '',
        phone: user?.phone || '',
        avatar_url: user?.avatar_url || ''
      },
      studentProfile: student || undefined,
      profileCompletion: calculateProfileCompletion(user, student)
    };

    return NextResponse.json(profileData);
  } catch (error: any) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireStudent(request);
  if ('headers' in authResult) {
    return authResult;
  }

  const userId = authResult.id;
  const requestData = await request.json();
  const supabase = getSupabaseClient(); // Service role key, bypasses RLS

  try {
    // First check if user exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    // Update user table if needed
    if (requestData.full_name || requestData.phone) {
      const userUpdateData: any = {};
      if (requestData.full_name) userUpdateData.full_name = requestData.full_name;
      if (requestData.phone) userUpdateData.phone = requestData.phone;

      if (existingUser) {
        const { error: updateError } = await supabase
          .from('users')
          .update(userUpdateData)
          .eq('id', userId);
        if (updateError) console.error('User update error:', updateError.message);
      } else {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: authResult.email,
            role: 'student',
            ...userUpdateData
          });
        if (insertError) console.error('User insert error:', insertError.message);
      }
    }

    // Update students table if needed
    if (requestData.student_profile) {
      const { data: existingStudent, error: studentCheckError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      // Use the centralized safe columns whitelist
      const safeStudentData: any = {};
      for (const col of STUDENT_SAFE_COLUMNS) {
        if (requestData.student_profile[col] !== undefined) {
          const value = requestData.student_profile[col];

          // Validate JSONB array fields
          if (JSONB_ARRAY_FIELDS.has(col)) {
            if (Array.isArray(value)) {
              safeStudentData[col] = value;
            }
            continue;
          }

          // Validate JSONB object fields
          if (JSONB_OBJECT_FIELDS.has(col)) {
            if (value === null || value === '') {
              safeStudentData[col] = null;
            } else if (typeof value === 'object' && !Array.isArray(value)) {
              safeStudentData[col] = value;
            }
            continue;
          }

          // Validate numeric fields
          if (NUMERIC_FIELDS.has(col)) {
            if (value === '' || value === null) {
              safeStudentData[col] = null;
            } else {
              const num = Number(value);
              if (!isNaN(num) && num >= 0) {
                safeStudentData[col] = num;
              }
            }
            continue;
          }

          // Validate enum fields
          if (ENUM_FIELDS[col]) {
            if (!value || ENUM_FIELDS[col].includes(value)) {
              safeStudentData[col] = value || null;
            }
            continue;
          }

          safeStudentData[col] = value;
        }
      }

      if (existingStudent) {
        const { error: updateError } = await supabase
          .from('students')
          .update(safeStudentData)
          .eq('user_id', userId);
        if (updateError) console.error('Student update error:', updateError.message);
      } else {
        const { error: insertError } = await supabase
          .from('students')
          .insert({ user_id: userId, ...safeStudentData });
        if (insertError) console.error('Student insert error:', insertError.message);
      }
    }

    // Return updated profile data in the correct format
    const { data: finalUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: finalStudent } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    const profileData = {
      user: {
        id: userId,
        email: authResult.email,
        full_name: finalUser?.full_name || authResult.full_name || '',
        phone: finalUser?.phone || '',
        avatar_url: finalUser?.avatar_url || ''
      },
      studentProfile: finalStudent || undefined,
      profileCompletion: calculateProfileCompletion(finalUser, finalStudent)
    };

    return NextResponse.json(profileData);
  } catch (error: any) {
    console.error('Error updating student profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
