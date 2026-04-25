import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePartner } from '@/lib/auth-utils';
import { createRateLimitMiddleware, rateLimitPresets } from '@/lib/rate-limit';
import { errors } from '@/lib/api-response';

const exportRateLimit = createRateLimitMiddleware(rateLimitPresets.export);

// GET /api/partner/export - Export partner's applications
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = exportRateLimit(request);
    if (!rateLimitResult.allowed) {
      return errors.rateLimit(rateLimitResult.resetTime);
    }

    const user = await requirePartner(request);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const exportType = searchParams.get('type') || 'applications';
    const status = searchParams.get('status');
    const degreeType = searchParams.get('degreeType');
    const search = searchParams.get('search');
    const days = searchParams.get('days') || '30';

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

    // Handle analytics export type
    if (exportType === 'analytics') {
      return await handleAnalyticsExport(supabase, partnerRecord.id, format, parseInt(days));
    }

    // Handle applications export type (default)

    // Build query - applications table stores personal_statement/study_plan/intake in profile_snapshot JSONB
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        created_at,
        profile_snapshot,
        notes,
        priority,
        students (
          id,
          first_name,
          last_name,
          nationality,
          email,
          phone
        ),
        programs (
          name,
          degree_level,
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
      query = query.eq('programs.degree_level', degreeType);
    }

    // Search in students table fields
    if (search) {
      query = query.or(`students.first_name.ilike.%${search}%,students.last_name.ilike.%${search}%,students.email.ilike.%${search}%,students.nationality.ilike.%${search}%`);
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
    const exportData = applications.map((app: Record<string, unknown>) => {
      const student = Array.isArray(app.students) ? app.students[0] : app.students as Record<string, unknown> | null;
      const program = Array.isArray(app.programs) ? app.programs[0] : app.programs as Record<string, unknown> | null;
      const university = program?.universities
        ? (Array.isArray(program.universities) ? program.universities[0] : program.universities as Record<string, unknown>)
        : null;
      return {
        id: app.id as string,
        first_name: (student?.first_name as string) || '',
        last_name: (student?.last_name as string) || '',
        email: (student?.email as string) || '',
        phone: (student?.phone as string) || '',
        nationality: (student?.nationality as string) || '',
        status: app.status as string,
        university: (university?.name_en as string) || '',
        program: (program?.name as string) || '',
        degree_level: (program?.degree_level as string) || '',
        submitted_at: (app.submitted_at as string) || '',
        created_at: app.created_at as string,
      };
    });

    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="applications.json"',
        },
      });
    } else {
      const csvHeaders = [
        'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Nationality',
        'Status', 'University', 'Program', 'Degree Level',
        'Submitted At', 'Created At',
      ];

      const csvRows = [
        csvHeaders.join(','),
        ...exportData.map((row) =>
          Object.values(row).map((val) => {
            const str = String(val || '');
            if (str.includes(',') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          }).join(',')
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

async function handleAnalyticsExport(
  supabase: ReturnType<typeof getSupabaseClient>,
  partnerId: string,
  format: string,
  days: number
) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  // Get applications for analytics
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      submitted_at,
      created_at,
      students (
        nationality
      ),
      programs (
        name,
        degree_level,
        universities (
          name_en,
          city
        )
      )
    `)
    .eq('partner_id', partnerId)
    .neq('status', 'draft')
    .gte('created_at', sinceStr)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching analytics for export:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }

  if (!applications || applications.length === 0) {
    return NextResponse.json({ error: 'No data to export for the selected period' }, { status: 400 });
  }

  // Transform for analytics export
  const exportData = (applications as Record<string, unknown>[]).map((app) => {
    const student = (Array.isArray(app.students) ? app.students[0] : app.students) as Record<string, unknown> | null;
    const program = (Array.isArray(app.programs) ? app.programs[0] : app.programs) as Record<string, unknown> | null;
    const university = program?.universities
      ? (Array.isArray(program.universities) ? program.universities[0] : program.universities as Record<string, unknown>)
      : null;
    return {
      application_id: app.id as string,
      status: app.status as string,
      nationality: (student?.nationality as string) || '',
      university: (university?.name_en as string) || '',
      city: (university?.city as string) || '',
      program: (program?.name as string) || '',
      degree_level: (program?.degree_level as string) || '',
      submitted_at: (app.submitted_at as string) || '',
      created_at: app.created_at as string,
    };
  });

  // Summary stats
  const total = exportData.length;
  const byStatus: Record<string, number> = {};
  const byUniversity: Record<string, number> = {};
  const byNationality: Record<string, number> = {};

  exportData.forEach((row) => {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    byUniversity[row.university] = (byUniversity[row.university] || 0) + 1;
    byNationality[row.nationality] = (byNationality[row.nationality] || 0) + 1;
  });

  const summary = {
    period: `Last ${days} days`,
    total_applications: total,
    by_status: byStatus,
    by_university: byUniversity,
    by_nationality: byNationality,
    acceptance_rate: total > 0 ? `${((byStatus['accepted'] || 0) / total * 100).toFixed(1)}%` : '0%',
  };

  if (format === 'json') {
    return new NextResponse(JSON.stringify({ summary, data: exportData }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="analytics-${days}d.json"`,
      },
    });
  } else {
    const csvHeaders = [
      'Application ID', 'Status', 'Nationality', 'University', 'City',
      'Program', 'Degree Level', 'Submitted At', 'Created At',
    ];

    // Summary section
    const summaryRows = [
      `# Analytics Report - Last ${days} Days`,
      `# Total Applications: ${total}`,
      `# Acceptance Rate: ${summary.acceptance_rate}`,
      '',
      csvHeaders.join(','),
      ...exportData.map((row) =>
        Object.values(row).map((val) => {
          const str = String(val || '');
          if (str.includes(',') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ),
    ];

    return new NextResponse(summaryRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${days}d.csv"`,
      },
    });
  }
}
