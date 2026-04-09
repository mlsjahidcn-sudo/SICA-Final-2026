import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/partner/export - Export partner's applications
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'partner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status');
    const degreeType = searchParams.get('degreeType');
    const search = searchParams.get('search');

    const supabase = getSupabaseClient();

    // Get partner record ID from partners table
    const { data: partnerRecord } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!partnerRecord) {
      return NextResponse.json({ error: 'Partner record not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        created_at,
        passport_first_name,
        passport_last_name,
        nationality,
        email,
        phone,
        highest_degree,
        programs (
          name_en,
          degree_type,
          universities (
            name_en,
            city
          )
        )
      `)
      .eq('partner_id', partnerRecord.id)
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (degreeType && degreeType !== 'all') {
      query = query.eq('programs.degree_type', degreeType);
    }

    if (search) {
      query = query.or(`passport_first_name.ilike.%${search}%,passport_last_name.ilike.%${search}%,email.ilike.%${search}%,nationality.ilike.%${search}%`);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching applications for export:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ error: 'No applications to export' }, { status: 400 });
    }

    // Transform data for export
    const exportData = applications.map((app: Record<string, unknown>) => ({
      id: app.id as string,
      first_name: app.passport_first_name as string,
      last_name: app.passport_last_name as string,
      email: app.email as string,
      phone: (app.phone as string) || '',
      nationality: (app.nationality as string) || '',
      status: app.status as string,
      university: (app.programs as Record<string, Record<string, string>>)?.universities?.name_en || '',
      program: (app.programs as Record<string, string>)?.name_en || '',
      degree_type: (app.programs as Record<string, string>)?.degree_type || '',
      highest_degree: (app.highest_degree as string) || '',
      submitted_at: (app.submitted_at as string) || '',
      created_at: app.created_at as string,
    }));

    if (format === 'json') {
      // Return JSON
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="applications.json"',
        },
      });
    } else {
      // Return CSV
      const headers = [
        'ID',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Nationality',
        'Status',
        'University',
        'Program',
        'Degree Type',
        'Highest Degree',
        'Submitted At',
        'Created At',
      ];

      const csvRows = [
        headers.join(','),
        ...exportData.map((row) =>
          headers
            .map((h) => {
              const key = h.toLowerCase().replace(/ /g, '_') as keyof typeof row;
              let value = row[key] || '';
              // Escape quotes and wrap in quotes if contains comma
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(',')
        ),
      ];

      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="applications.csv"',
        },
      });
    }
  } catch (error) {
    console.error('Error in partner export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
