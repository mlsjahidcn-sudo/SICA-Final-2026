import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

// GET /api/admin/leads/export - Export leads as CSV or JSON
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (source) {
      query = query.eq('source', source);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Error exporting leads:', error);
      return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 });
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(leads, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV format
    const headers = [
      'ID',
      'Type',
      'Status',
      'Source',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Nationality',
      'Desired Program',
      'Desired Intake',
      'Organization Name',
      'Contact Person',
      'Organization Email',
      'Organization Phone',
      'Website',
      'Country',
      'Organization Type',
      'Created At',
      'Updated At',
    ];

    const csvRows = [
      headers.join(','),
      ...(leads || []).map((lead) =>
        [
          lead.id,
          lead.type,
          lead.status,
          escapeCsv(lead.source),
          escapeCsv(lead.first_name),
          escapeCsv(lead.last_name),
          escapeCsv(lead.email),
          escapeCsv(lead.phone),
          escapeCsv(lead.nationality),
          escapeCsv(lead.desired_program),
          escapeCsv(lead.desired_intake),
          escapeCsv(lead.organization_name),
          escapeCsv(lead.contact_person),
          escapeCsv(lead.organization_email),
          escapeCsv(lead.organization_phone),
          escapeCsv(lead.website),
          escapeCsv(lead.country),
          escapeCsv(lead.organization_type),
          lead.created_at,
          lead.updated_at,
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Leads export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function escapeCsv(value: string | null | undefined): string {
  if (!value) return '';
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
