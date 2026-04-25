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

// Date fields that need PostgreSQL date formatting (YYYY-MM-DD)
const DATE_FIELDS = new Set(['date_of_birth', 'passport_expiry_date']);

// Enum fields with allowed values
const ENUM_FIELDS: Record<string, string[]> = {
  marital_status: ['single', 'married', 'divorced', 'widowed'],
  study_mode: ['full_time', 'part_time'],
  funding_source: ['self_funded', 'csc_scholarship', 'university_scholarship', 'government_scholarship', 'other'],
};

/**
 * Format a date string to YYYY-MM-DD for PostgreSQL date columns
 * Accepts: YYYY-MM-DD, YYYY/MM/DD, MM/DD/YYYY, DD-MM-YYYY
 */
function formatDateForPostgres(value: string): string | null {
  if (!value || value.trim() === '') return null;

  const trimmed = value.trim();

  // Already in ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Try parsing with Date constructor
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const authResult = await requireStudent(request);
  if ('headers' in authResult) {
    return authResult;
  }

  const userId = authResult.id;
  const supabase = getSupabaseClient();

  try {
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('GET profile - user query error:', userError.message);
    }

    // Get student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (studentError && studentError.code !== 'PGRST116') {
      console.error('GET profile - student query error:', studentError.message);
    }

    // Build a full_name from first_name + last_name if no user.full_name
    const studentFullName = [student?.first_name, student?.last_name].filter(Boolean).join(' ');

    const profileData = {
      user: {
        id: userId,
        email: authResult.email,
        full_name: user?.full_name || studentFullName || authResult.full_name || '',
        phone: user?.phone || '',
        avatar_url: user?.avatar_url || ''
      },
      studentProfile: student || undefined,
      profileCompletion: calculateProfileCompletion(user, student)
    };

    return NextResponse.json(profileData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching student profile:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireStudent(request);
  if ('headers' in authResult) {
    return authResult;
  }

  const userId = authResult.id;
  const requestData = await request.json();
  const supabase = getSupabaseClient();

  try {
    // ── Step 1: Update users table (full_name, phone) ──
    const userUpdateData: Record<string, unknown> = {};
    if (requestData.full_name !== undefined) userUpdateData.full_name = requestData.full_name;
    if (requestData.phone !== undefined) userUpdateData.phone = requestData.phone;

    if (Object.keys(userUpdateData).length > 0) {
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('PUT profile - user check error:', userCheckError.message);
        return NextResponse.json({ error: `Failed to check user: ${userCheckError.message}` }, { status: 500 });
      }

      let userError: string | null = null;
      if (existingUser) {
        const { error } = await supabase
          .from('users')
          .update(userUpdateData)
          .eq('id', userId);
        userError = error?.message || null;
      } else {
        const { error } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: authResult.email,
            role: 'student',
            ...userUpdateData
          });
        userError = error?.message || null;
      }

      if (userError) {
        console.error('PUT profile - user write error:', userError);
        return NextResponse.json({ error: `Failed to save user data: ${userError}` }, { status: 500 });
      }

      console.log('PUT profile - user data saved successfully');
    }

    // ── Step 2: Update students table ──
    if (requestData.student_profile) {
      const { data: existingStudent, error: studentCheckError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (studentCheckError && studentCheckError.code !== 'PGRST116') {
        console.error('PUT profile - student check error:', studentCheckError.message);
        return NextResponse.json({ error: `Failed to check student: ${studentCheckError.message}` }, { status: 500 });
      }

      // Build safe student data from whitelist
      const safeStudentData: Record<string, unknown> = {};

      for (const col of STUDENT_SAFE_COLUMNS) {
        if (requestData.student_profile[col] === undefined) continue;
        const value = requestData.student_profile[col];

        // Validate JSONB array fields - pass as native objects, NOT JSON strings
        if (JSONB_ARRAY_FIELDS.has(col)) {
          if (Array.isArray(value)) {
            safeStudentData[col] = value; // Supabase client handles JSONB natively
          }
          continue;
        }

        // Validate JSONB object fields - pass as native objects, NOT JSON strings
        if (JSONB_OBJECT_FIELDS.has(col)) {
          if (value === null || value === '') {
            safeStudentData[col] = null;
          } else if (typeof value === 'object' && !Array.isArray(value)) {
            safeStudentData[col] = value; // Supabase client handles JSONB natively
          }
          continue;
        }

        // Validate numeric fields
        if (NUMERIC_FIELDS.has(col)) {
          if (value === '' || value === null || value === undefined) {
            safeStudentData[col] = null;
          } else {
            const num = Number(value);
            if (!isNaN(num) && num >= 0) {
              safeStudentData[col] = num;
            } else {
              safeStudentData[col] = null;
            }
          }
          continue;
        }

        // Validate date fields
        if (DATE_FIELDS.has(col)) {
          if (value === '' || value === null || value === undefined) {
            safeStudentData[col] = null;
          } else {
            const formatted = formatDateForPostgres(String(value));
            if (formatted) {
              safeStudentData[col] = formatted;
            } else {
              safeStudentData[col] = null;
            }
          }
          continue;
        }

        // Validate enum fields
        if (ENUM_FIELDS[col]) {
          if (!value || ENUM_FIELDS[col].includes(value)) {
            safeStudentData[col] = value || null;
          } else {
            safeStudentData[col] = null;
          }
          continue;
        }

        // Default: pass through string values
        if (value === '') {
          safeStudentData[col] = null;
        } else {
          safeStudentData[col] = value;
        }
      }

      // Also update first_name / last_name from full_name
      // Note: PostgREST column names are first_name/last_name (not passport_first_name/passport_last_name)
      if (requestData.full_name) {
        const nameParts = String(requestData.full_name).trim().split(/\s+/);
        safeStudentData.first_name = nameParts[0] || null;
        safeStudentData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
      }

      // Auto-update updated_at timestamp
      safeStudentData.updated_at = new Date().toISOString();

      console.log('PUT profile - safe student data columns:', Object.keys(safeStudentData));

      let studentError: string | null = null;
      if (existingStudent) {
        const { error } = await supabase
          .from('students')
          .update(safeStudentData)
          .eq('user_id', userId);
        studentError = error?.message || null;
      } else {
        const { error } = await supabase
          .from('students')
          .insert({ user_id: userId, ...safeStudentData });
        studentError = error?.message || null;
      }

      if (studentError) {
        console.error('PUT profile - student write error:', studentError);
        return NextResponse.json({ error: `Failed to save student data: ${studentError}` }, { status: 500 });
      }

      console.log('PUT profile - student data saved successfully');

      // Note: profile_completion is calculated at runtime in GET requests
      // No need to persist it to database
    }

    // ── Step 4: Return updated profile ──
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

    const studentFullName = [finalStudent?.first_name, finalStudent?.last_name].filter(Boolean).join(' ');

    const profileData = {
      user: {
        id: userId,
        email: authResult.email,
        full_name: finalUser?.full_name || studentFullName || authResult.full_name || '',
        phone: finalUser?.phone || '',
        avatar_url: finalUser?.avatar_url || ''
      },
      studentProfile: finalStudent || undefined,
      profileCompletion: calculateProfileCompletion(finalUser, finalStudent)
    };

    return NextResponse.json(profileData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating student profile:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
