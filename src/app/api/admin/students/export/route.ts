import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseAdmin = getSupabaseClient();
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // 'csv' or 'json'
    const search = searchParams.get('search') || '';
    const source = searchParams.get('source') || 'all';

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        is_active,
        created_at,
        referred_by_partner_id,
        students (
          nationality,
          passport_number,
          date_of_birth,
          gender,
          current_address,
          wechat_id,
          highest_education,
          gpa,
          hsk_level,
          hsk_score,
          ielts_score,
          toefl_score
        )
      `)
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply source filter
    if (source === 'individual') {
      query = query.is('referred_by_partner_id', null);
    } else if (source === 'partner_referred') {
      query = query.not('referred_by_partner_id', 'is', null);
    }

    const { data: students, error } = await query;

    if (error) {
      console.error('Error fetching students for export:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Flatten data for export
    const exportData = (students || []).map(s => {
      const studentRecord = Array.isArray(s.students) ? s.students[0] : s.students;
      return {
        id: s.id,
        email: s.email,
        full_name: s.full_name,
        phone: s.phone || '',
        is_active: s.is_active ? 'Active' : 'Inactive',
        source: s.referred_by_partner_id ? 'Partner Referred' : 'Individual',
        nationality: studentRecord?.nationality || '',
        passport_number: studentRecord?.passport_number || '',
        date_of_birth: studentRecord?.date_of_birth || '',
        gender: studentRecord?.gender || '',
        current_address: studentRecord?.current_address || '',
        wechat_id: studentRecord?.wechat_id || '',
        highest_education: studentRecord?.highest_education || '',
        gpa: studentRecord?.gpa || '',
        hsk_level: studentRecord?.hsk_level || '',
        hsk_score: studentRecord?.hsk_score || '',
        ielts_score: studentRecord?.ielts_score || '',
        toefl_score: studentRecord?.toefl_score || '',
        created_at: s.created_at,
      };
    });

    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="students_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV format
    const headers = [
      'ID', 'Email', 'Full Name', 'Phone', 'Status', 'Source',
      'Nationality', 'Passport Number', 'Date of Birth', 'Gender',
      'Current Address', 'WeChat ID', 'Highest Education', 'GPA',
      'HSK Level', 'HSK Score', 'IELTS Score', 'TOEFL Score', 'Created At'
    ];

    const csvRows = [
      headers.join(','),
      ...exportData.map(s => [
        `"${s.id}"`,
        `"${s.email}"`,
        `"${s.full_name?.replace(/"/g, '""')}"`,
        `"${s.phone}"`,
        `"${s.is_active}"`,
        `"${s.source}"`,
        `"${s.nationality}"`,
        `"${s.passport_number}"`,
        `"${s.date_of_birth}"`,
        `"${s.gender}"`,
        `"${s.current_address?.replace(/"/g, '""')}"`,
        `"${s.wechat_id}"`,
        `"${s.highest_education}"`,
        `"${s.gpa}"`,
        `"${s.hsk_level}"`,
        `"${s.hsk_score}"`,
        `"${s.ielts_score}"`,
        `"${s.toefl_score}"`,
        `"${s.created_at}"`,
      ].join(','))
    ];

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="students_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error in students export API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
