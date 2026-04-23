import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import type { IndividualStudent } from '@/lib/types/admin-modules';

/**
 * GET /api/admin/individual-students/[id]
 * Fetch a single individual student with all details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const { id } = await params;
    const supabaseAdmin = getSupabaseClient();

    // Fetch the student user record
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        is_active,
        country,
        city,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .eq('role', 'student')
      .is('referred_by_partner_id', null)
      .single();

    // If not found with strict filter, try broader lookup (may have referred_by_partner_id but accessed via this endpoint)
    let finalUser = userRecord;
    if (userError || !userRecord) {
      const { data: fallbackUser, error: fallbackError } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          avatar_url,
          is_active,
          country,
          city,
          created_at,
          updated_at
        `)
        .eq('id', id)
        .eq('role', 'student')
        .single();

      if (fallbackError || !fallbackUser) {
        console.error('Student lookup failed:', { id, userError: userError?.message, fallbackError: fallbackError?.message });
        return NextResponse.json({ error: 'Student not found', details: userError?.message || fallbackError?.message }, { status: 404 });
      }
      finalUser = fallbackUser;
    }

    if (!finalUser) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch student record for additional fields
    const { data: studentRecord } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        nationality,
        gender,
        date_of_birth,
        passport_number,
        current_address,
        wechat_id,
        highest_education,
        institution_name
      `)
      .eq('user_id', id)
      .maybeSingle();

    // Get application counts for this student
    let applications = { total: 0, pending: 0 };
    if (studentRecord?.id) {
      const { data: apps } = await supabaseAdmin
        .from('applications')
        .select('status')
        .eq('student_id', studentRecord.id);
      
      if (apps && apps.length > 0) {
        applications = {
          total: apps.length,
          pending: apps.filter(a => ['submitted', 'under_review'].includes(a.status)).length,
        };
      }
    }

    const student: IndividualStudent = {
      id: finalUser.id,
      user_id: finalUser.id,
      email: finalUser.email,
      full_name: finalUser.full_name,
      phone: finalUser.phone,
      avatar_url: finalUser.avatar_url,
      is_active: finalUser.is_active,
      country: finalUser.country || null,
      city: finalUser.city || null,
      source: 'individual' as const,
      nationality: studentRecord?.nationality || null,
      gender: studentRecord?.gender || null,
      date_of_birth: studentRecord?.date_of_birth || null,
      passport_number: studentRecord?.passport_number || null,
      current_address: studentRecord?.current_address || null,
      wechat_id: studentRecord?.wechat_id || null,
      highest_education: studentRecord?.highest_education || null,
      institution_name: studentRecord?.institution_name || null,
      created_at: finalUser.created_at,
      updated_at: finalUser.updated_at,
      applications,
    };

    // Return as plain object (not wrapped in { student: ... }) for compatibility with existing frontend
    return NextResponse.json(student);
  } catch (error) {
    console.error('Error fetching individual student detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
